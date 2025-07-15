import asyncio
import random
import sys

from utils.credential_generator import generate_german_credential
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from twocaptcha import TwoCaptcha
import logging
import os

os.environ["PYTHONUNBUFFERED"] = "1"
sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)


# Setup logger
logging.basicConfig(filename='knuddels_creator.log', encoding='utf-8', level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

API_KEY = "826ef76ae9243ad58575a780e9a7390e"

async def solve_hcaptcha_2captcha(page, api_key, timeout=120):
    # Wait for hCaptcha widget or [data-sitekey] after profile skip
    print("Waiting for hCaptcha challenge (data-sitekey) in DOM...", flush=True)
    try:
        await page.wait_for_selector('.h-captcha, [data-sitekey]', timeout=20000)
    except Exception:
        print("hCaptcha widget/modal did not appear.", flush=True)
        logging.error("hCaptcha widget/modal did not appear.")
        return False

    # Extract sitekey from element with [data-sitekey]
    sitekey_el = await page.query_selector('[data-sitekey]')
    if not sitekey_el:
        print("Could not find data-sitekey element.")
        logging.error("Could not find data-sitekey element.")
        return False
    sitekey = await sitekey_el.get_attribute('data-sitekey')
    print("hCaptcha sitekey:", sitekey, flush=True)
    logging.info(f"hCaptcha sitekey: {sitekey}")

    # Solve hCaptcha via 2Captcha
    solver = TwoCaptcha(api_key)
    print("Submitting hCaptcha to 2Captcha...", flush=True)
    logging.info("Submitting hCaptcha to 2Captcha...")
    result = solver.hcaptcha(sitekey=sitekey, url=page.url)
    solution = result['code']
    print("Got hCaptcha solution from 2Captcha.", flush=True)
    logging.info("Got hCaptcha solution from 2Captcha.")

    # Inject the solution
    await page.evaluate(f'''
        let el = document.querySelector('textarea[name="h-captcha-response"]');
        if (el) {{
            el.value = "{solution}";
            let evt = document.createEvent('HTMLEvents');
            evt.initEvent('change', false, true);
            el.dispatchEvent(evt);
        }}
    ''')

    await asyncio.sleep(2)

    # Click "Weiter" or "Verify" if exists (just in case)
    verify_found = False
    for verify_text in ["Verify", "Weiter", "Abschließen"]:
        try:
            btn = await page.query_selector(f'button:has-text("{verify_text}")')
            if btn:
                await btn.click()
                print(f"Clicked {verify_text} to submit captcha.", flush=True)
                verify_found = True
                break
        except Exception:
            continue
    if not verify_found:
        # Try clicking any enabled button
        buttons = await page.query_selector_all('button')
        for btn in buttons:
            if await btn.is_enabled():
                await btn.click()
                print("Clicked a generic enabled button to submit captcha.", flush=True)
                break

    await asyncio.sleep(3)
    print("hCaptcha step completed.", flush=True)
    return True

async def create_knuddels_account(cred=None, stay_open=True):
    print("⚙️ Launching Playwright and browser...", flush=True)

    if cred is None:
        cred = generate_german_credential()

    nickname = cred["username"]
    password = cred["password"]
    age = str(random.randint(19, 27))

    async with async_playwright() as p:
        print("🌐 Launching Chromium browser...", flush=True)
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        print("🌍 Navigating to knuddels.de...", flush=True)
        await page.goto("https://www.knuddels.de")

        await asyncio.sleep(random.uniform(1.5, 3.0))

        # Click "Jetzt registrieren"
        print("✅ Click 'Jetzt registrieren'...", flush=True)
        await page.click('text="Jetzt registrieren"')
        await asyncio.sleep(random.uniform(1.0, 2.5))

        # Select "Chatten"
        print("✅ Click 'Chatten'...", flush=True)
        await page.click('text="Chatten"')
        await asyncio.sleep(random.uniform(1.0, 2.0))

        # Select "Weiblich"
        print("✅ Click 'Weiblich'...", flush=True)
        await page.click('text="Weiblich"')
        await asyncio.sleep(random.uniform(1.0, 2.0))

        # Enter age
        print("✅ Entering Age...", flush=True)
        await page.wait_for_selector('input[placeholder="Dein Alter"]')
        await page.fill('input[placeholder="Dein Alter"]', age)
        await asyncio.sleep(random.uniform(0.8, 1.5))
        await page.click('button:has-text("Weiter")')
        await asyncio.sleep(random.uniform(1.0, 2.0))

        # Enter nickname
        print("✅ Entering Nickname...", flush=True)
        await page.wait_for_selector('input[placeholder="Dein Nickname"]')
        await page.fill('input[placeholder="Dein Nickname"]', nickname)
        await asyncio.sleep(random.uniform(0.8, 1.5))
        await page.click('button:has-text("Weiter")')
        await asyncio.sleep(random.uniform(1.0, 2.0))

        # Enter password
        print("✅ Entering Password...", flush=True)
        await page.wait_for_selector('input[placeholder="Passwort"]')
        await page.fill('input[placeholder="Passwort"]', password)
        await asyncio.sleep(random.uniform(0.8, 1.5))
        await page.click('button:has-text("Weiter")')
        await asyncio.sleep(random.uniform(1.0, 2.0))

        # Accept terms/Datenschutz
        print("✅ Accepting ToS...", flush=True)
        await page.click('button:has-text("Akzeptieren")')
        await asyncio.sleep(random.uniform(1.0, 2.0))

        # Profile photo skip ("Überspringen" or "Skip")
        print("✅ Skipping ProfilePicture...", flush=True)
        btn = await page.wait_for_selector(f'button:has-text("Überspringen")', timeout=15000)
        await asyncio.sleep(1)
        await btn.click()
        await asyncio.sleep(2)

        print("✅ Trying to solve Captcha...", flush=True)
        # --- hCaptcha challenge: detect, solve, and inject solution ---
        print("Some hCaptcha iframe(s) detected.", flush=True)
        print("All iframe URLs and their indices:", flush=True)
        for idx, frame in enumerate(page.frames):
            print(f"[{idx}] {frame.url}", flush=True)

        # 1. Find the challenge frame
        challenge_frame = None
        for frame in page.frames:
            if "hcaptcha.com" in frame.url and "challenge" in frame.url:
                challenge_frame = frame
                print("Challenge frame detected:", frame.url, flush=True)
                break

        if not challenge_frame:
            print("Challenge frame NOT found even though iframes present.", flush=True)
            await page.screenshot(path="debug_challenge_frame_not_found.png", full_page=True)
            await browser.close()
            return

        # 2. Extract sitekey from challenge frame URL
        print("✅ Extracting SiteKey...", flush=True)

        import urllib.parse
        fragment = urllib.parse.urlparse(challenge_frame.url).fragment
        fragment_params = dict(param.split("=", 1) for param in fragment.split("&") if "=" in param)
        sitekey = fragment_params.get("sitekey")
        print("Extracted sitekey:", sitekey, flush=True)

        # 3. Submit to 2Captcha
        print("✅ Submit to Solving-Service...", flush=True)
        from twocaptcha import TwoCaptcha
        solver = TwoCaptcha(API_KEY)
        print("Submitting hCaptcha to 2Captcha...")
        result = solver.hcaptcha(sitekey=sitekey, url=page.url, flush=True)
        solution = result['code']
        print("Got hCaptcha solution from 2Captcha:", solution, flush=True)

        # --- Inject solution and trigger events/buttons ---
        # 1. Inject into challenge frame
        print("✅ Solving Captcha with solution...", flush=True)
        await challenge_frame.evaluate(f'''
            let el = document.querySelector('textarea[name="h-captcha-response"]');
            if (el) {{
                el.value = "{solution}";
                ["change", "input"].forEach(ev=>{{
                    let evt = document.createEvent('HTMLEvents');
                    evt.initEvent(ev, false, true);
                    el.dispatchEvent(evt);
                }});
            }}
        ''')
        await asyncio.sleep(1)

        # 2. Inject into parent page
        await page.evaluate(f'''
            let el = document.querySelector('textarea[name="h-captcha-response"]');
            if (el) {{
                el.value = "{solution}";
                ["change", "input"].forEach(ev=>{{
                    let evt = document.createEvent('HTMLEvents');
                    evt.initEvent(ev, false, true);
                    el.dispatchEvent(evt);
                }});
            }}
        ''')
        await asyncio.sleep(1)

        # 3. Click all buttons in challenge frame
        buttons = await challenge_frame.query_selector_all('button')
        for btn in buttons:
            try:
                await btn.click()
                print("Clicked button in challenge frame.", flush=True)
                break
            except Exception:
                continue
        await asyncio.sleep(2)

        # 4. Optionally, re-click the invisible checkbox
        checkbox_iframe_el = await page.query_selector('iframe[src*="checkbox-invisible"]')
        if checkbox_iframe_el:
            frame_element = await checkbox_iframe_el.content_frame()
            try:
                await frame_element.click('div[role="checkbox"]')
                print("Clicked invisible checkbox after solution injection.", flush=True)
            except Exception as e:
                print("Could not click invisible checkbox:", e, flush=True)
            await asyncio.sleep(1)

        print(f"✅ Registered: {nickname} / {password} / Age: {age}", flush=True)

        if stay_open:
            print("Browser will stay open for manual review. Press ENTER to close...", flush=True)
            input()
        await browser.close()


if __name__ == "__main__":
    asyncio.run(create_knuddels_account())