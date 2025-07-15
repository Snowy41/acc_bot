import asyncio
import random
import re
import sys

from playwright.async_api import async_playwright
from utils.credential_generator import generate_german_credential_snap

sys.stdout.reconfigure(line_buffering=True)

# --- TOGGLE THIS ---
USE_PROXY = True
USE_MOBILE_UA = False
USE_EXTRA_HUMAN = True

PROXY_CONFIG = {
    "server": "http://p.webshare.io:80",
    "username": "bcqsiuxj-rotate",
    "password": "fys6qsvnjaz4"
}
USER_AGENTS = [
    # Modern Windows Chrome
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    # Mac Chrome
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    # Android Chrome
    "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
]
MOBILE_USER_AGENTS = [
    # Android Chrome
    "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
]

ua = random.choice(MOBILE_USER_AGENTS if USE_MOBILE_UA else USER_AGENTS)
viewport = {"width": 412, "height": 900} if USE_MOBILE_UA else {"width": 1280, "height": 1600}
is_mobile = USE_MOBILE_UA
device_scale = 2 if USE_MOBILE_UA else 1

async def human_fill(page, selector, text):
    if USE_EXTRA_HUMAN:
        for char in text:
            await page.type(selector, char)
            await asyncio.sleep(random.uniform(0.07, 0.18))
    else:
        await page.fill(selector, text)
        await asyncio.sleep(random.uniform(0.3, 0.7))


async def fill_google_birthday_page(page, birthday=None, gender="Male"):
    months = [str(i) for i in range(1, 13)]
    birthday = birthday or {"month": random.choice(months), "day": "15", "year": "2002"}
    await page.wait_for_selector('input[name="day"]', timeout=150000)
    await asyncio.sleep(0.8)
    # Month dropdown
    spans = await page.query_selector_all('span')
    for span in spans:
        txt = await span.inner_text()
        if txt.strip().lower() == "month":
            parent = await span.evaluate_handle('el => el.parentElement')
            await parent.click()
            await asyncio.sleep(0.3)
            await page.click(f'li[data-value="{birthday["month"]}"]')
            await asyncio.sleep(0.3)
            break
    await human_fill(page,'input[name="day"]', birthday["day"])
    await asyncio.sleep(0.2)
    await human_fill(page,'input[name="year"]', birthday["year"])
    await asyncio.sleep(0.2)
    # Gender dropdown
    spans = await page.query_selector_all('span')
    for span in spans:
        txt = await span.inner_text()
        if txt.strip().lower() in ["gender", "geschlecht"]:
            parent = await span.evaluate_handle('el => el.parentElement')
            await parent.click()
            await asyncio.sleep(0.7)
            break
    options = await page.query_selector_all('li[role="option"]')
    clicked = False
    for opt in options:
        txt = await opt.inner_text()
        if txt.strip().lower() == gender.lower():
            await opt.click()
            print(f"Clicked gender option '{gender}' by text.")
            await asyncio.sleep(0.3)
            clicked = True
            break
    if options and not clicked:
        await options[1].click()
        print("Fallback: Clicked gender option by index (1 = Male).")
        await asyncio.sleep(0.3)
    await page.click('button:has-text("Next")')
    await asyncio.sleep(1)
    print("Birthday and gender info submitted!")

async def select_first_gmail_suggestion(page):
    await asyncio.sleep(1)
    divs = await page.query_selector_all('div')
    suggestion_candidates = []
    for div in divs:
        txt = await div.inner_text()
        if re.fullmatch(r"[a-zA-Z0-9._%+-]+@gmail\.com", txt.strip()):
            suggestion_candidates.append(div)
            print(f"Suggestion candidate: {txt.strip()}")
    if suggestion_candidates:
        await suggestion_candidates[0].click()
        print("Clicked first suggested Gmail option.")
        await asyncio.sleep(0.5)
        await page.click('button:has-text("Next")')
        await asyncio.sleep(1)
        selected_email = await suggestion_candidates[0].inner_text()
        return selected_email
    else:
        print("No suggestions found! Fallback to custom email.")
        return None

async def fill_gmail_password(page, password):
    await page.wait_for_selector('input[name="Passwd"]', timeout=80000)
    await asyncio.sleep(0.3)
    await human_fill(page,'input[name="Passwd"]', password)
    await asyncio.sleep(0.3)
    await human_fill(page,'input[name="PasswdAgain"]', password)
    await asyncio.sleep(0.3)
    await page.click('button:has-text("Next")')
    await asyncio.sleep(1)
    print("Password set and continued!")

async def create_google_account():
    creds = generate_german_credential_snap()
    print("Generated credentials:", creds)

    ua = random.choice(USER_AGENTS)
    viewport = random.choice([
        {"width": 375, "height": 800},
        {"width": 412, "height": 900},
        {"width": 1024, "height": 1080},
        {"width": 1280, "height": 1600}
    ])
    device_scale = random.choice([1, 2])
    is_mobile = "Android" in ua

    async with async_playwright() as p:
        if USE_PROXY:
            browser = await p.chromium.launch(
                headless=False,
                proxy=PROXY_CONFIG
            )
        else:
            browser = await p.chromium.launch(
                headless=False
            )
        context = await browser.new_context(
            user_agent=ua,
            viewport=viewport,
            device_scale_factor=device_scale,
            is_mobile=is_mobile,
            locale="en-US"
        )
        page = await context.new_page()

        # --- Step 1: Names ---
        await page.goto("https://accounts.google.com/signup")
        await asyncio.sleep(2)
        await human_fill(page,'input[name="firstName"]', creds["first"])
        await human_fill(page,'input[name="lastName"]', creds["last"])
        await asyncio.sleep(2)
        await page.keyboard.press('Tab')
        await asyncio.sleep(2)
        await page.click('button:has-text("Next")')
        await asyncio.sleep(2)
        print("Clicked Next button (names)")

        # --- Step 2: Birthday/Gender ---
        await fill_google_birthday_page(page)
        print("Birthday and gender info submitted!")

        # --- Step 3: Choose how you'll sign in ---
        await asyncio.sleep(1)
        try:
            await page.click('text=Create a Gmail address')
            await asyncio.sleep(2)
            await page.click('button:has-text("Next")')
            await asyncio.sleep(2)
            print("Clicked to create a Gmail address.")
        except Exception:
            print("Could not click 'Create a Gmail address' (maybe already selected)")

        await asyncio.sleep(1)

        # Try to select a suggestion FIRST.
        divs = await page.query_selector_all('div')
        suggestion_candidates = []
        for div in divs:
            txt = await div.inner_text()
            if re.fullmatch(r"[a-zA-Z0-9._%+-]+@gmail\.com", txt.strip()):
                suggestion_candidates.append(div)
                print(f"Suggestion candidate: {txt.strip()}")

        if suggestion_candidates:
            await suggestion_candidates[0].click()
            print("Clicked first suggested Gmail option.")
            await asyncio.sleep(2)
            await page.click('button:has-text("Next")')
            await asyncio.sleep(2)
            creds["final_email"] = await suggestion_candidates[0].inner_text()
        else:
            # If no suggestions, now look for username input and do custom
            username_input = await page.query_selector('input[name="Username"]')
            if not username_input:
                username_input = await page.query_selector('input[aria-label="Username"]')
            if not username_input:
                username_input = await page.query_selector('input[aria-label="Nutzername"]')
            if username_input:
                print("On custom Gmail username page.")
                await username_input.fill(creds["username"])
                await asyncio.sleep(2)
                await page.click('button:has-text("Next")')
                await asyncio.sleep(2)

                # Check if "That username is taken" error appears
                try:
                    await page.wait_for_selector('text="That username is taken"', timeout=2000)
                    print("Username is taken, trying available suggestions...")
                    links = await page.query_selector_all('a')
                    for link in links:
                        link_txt = (await link.inner_text()).strip()
                        if re.fullmatch(r"[a-zA-Z0-9._%+-]+", link_txt):
                            await link.click()
                            print(f"Clicked available suggestion: {link_txt}")
                            await asyncio.sleep(0.3)
                            await page.click('button:has-text("Next")')
                            await asyncio.sleep(1)
                            creds["final_email"] = link_txt + "@gmail.com"
                            break
                except Exception:
                    pass  # No error, continue as normal
            else:
                try:
                    await page.click('text="Create your own Gmail address"')
                    await asyncio.sleep(0.3)
                    username_input = await page.query_selector('input[name="Username"]')
                    if username_input:
                        await username_input.fill(creds["username"])
                        await asyncio.sleep(2)
                        await page.click('button:has-text("Next")')
                        await asyncio.sleep(2)
                        creds["final_email"] = creds["username"] + "@gmail.com"
                except Exception:
                    print("Couldn't find suggestion or username input or create-your-own, skipping.")

        # --- Step 5: Password step ---
        await fill_gmail_password(page, creds["password"])

        try:
            await asyncio.sleep(2)
            try:
                await page.click('button:has-text("Skip")')
                print("Skipped phone/recovery.")
                await asyncio.sleep(1)
            except Exception:
                pass

            try:
                await page.click('button:has-text("I agree")')
                print("Accepted privacy terms.")
                await asyncio.sleep(2)
            except Exception:
                pass

            print("Waiting for Gmail inbox...")
            await page.wait_for_url(re.compile(r"https://mail\.google\.com/.*"), timeout=600000)
            await asyncio.sleep(5)
            print("Gmail inbox loaded!")

            try:
                await page.wait_for_selector('div[gh="cm"], div.T-I.T-I-KE.L3', timeout=300000)
                print("Inbox fully loaded.")
            except Exception:
                print("Inbox may not have loaded fully, but landed on Gmail.")
        except Exception as e:
            print("Could not finish signup or go to inbox:", e)

        print("Keeping browser open for manual review (press Ctrl+C to quit).")
        while True:
            await asyncio.sleep(60)

async def main():
    creds = await create_google_account()
    print("Account created (partial):", creds)

if __name__ == "__main__":
    asyncio.run(main())
