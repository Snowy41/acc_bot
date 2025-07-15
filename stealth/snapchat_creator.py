import random
from playwright.async_api import TimeoutError as PlaywrightTimeoutError
from twocaptcha import TwoCaptcha
import urllib.parse
from utils.credential_generator import generate_german_credential_snap

import sys
sys.stdout.reconfigure(line_buffering=True)

GMAIL_ADDRESS = "dengler.tobi.td@gmail.com"
GMAIL_PASSWORD = "jbpy hzdr cucz ixlc"


def fetch_snapchat_code_from_gmail(email_address, password, timeout=1200):
    import imaplib, email, re, time
    from bs4 import BeautifulSoup

    IMAP_SERVER = "imap.gmail.com"
    IMAP_PORT = 993
    mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
    mail.login(email_address, password)

    # Try several mailbox names in order
    mailboxes = ['"[Gmail]/All Mail"', 'inbox', '"INBOX"']
    for box in mailboxes:
        try:
            status, _ = mail.select(box)
            print(f"Selecting {box}: status={status}")
            if status == 'OK':
                break
        except Exception as e:
            print(f"Select {box} failed: {e}")
    else:
        print("IMAP select failed! Aborting fetch.")
        mail.logout()
        return None

    code = None
    print("Waiting for Snapchat code email...")
    for _ in range(timeout // 5):
        typ, msg_ids = mail.search(None, 'ALL')
        ids = msg_ids[0].split()
        print("Ids:", ids)
        for msgid in ids[-15:]:
            typ, msg_data = mail.fetch(msgid, '(RFC822)')
            msg = email.message_from_bytes(msg_data[0][1])
            sender = msg.get("From", "")
            subject = msg.get("Subject", "")
            html = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/html":
                        html += part.get_payload(decode=True).decode(errors="replace")
            else:
                html = msg.get_payload(decode=True).decode(errors="replace")
            if "snapchat" in sender.lower() or "snapchat" in subject.lower():
                soup = BeautifulSoup(html, "html.parser")
                for p in soup.find_all("p"):
                    txt = p.get_text(strip=True)
                    if re.fullmatch(r"\d{6}", txt) and txt != "000000":
                        code = txt
                        print("Code found in HTML:", code)
                        mail.logout()
                        return code
        time.sleep(5)
    mail.logout()
    print("No code found after polling emails.")
    return code





class SnapchatCreatorResult:
    def __init__(self, success, error=None, details=None):
        self.success = success
        self.error = error
        self.details = details

API_KEY = "826ef76ae9243ad58575a780e9a7390e"  # <--- put your key here

async def apply_basic_stealth(page):
    await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    await page.add_init_script("""
        window.navigator.chrome = { runtime: {} };
        Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
        Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
    """)

async def solve_captcha_2captcha(page, api_key):
    print("Looking for CAPTCHA (reCAPTCHA v2, v3, or image)...")
    # 1. Wait for recaptcha or hcaptcha or image captcha to appear
    await asyncio.sleep(2)
    # Try reCAPTCHA first (iframe)
    sitekey = None
    captcha_type = None
    frames = page.frames
    for f in frames:
        if "recaptcha" in f.url:
            # reCAPTCHA
            try:
                src = await f.frame_element.get_attribute("src")
                qs = urllib.parse.parse_qs(urllib.parse.urlparse(src).query)
                sitekey = qs.get('k', [None])[0] or qs.get('sitekey', [None])[0]
                print("reCAPTCHA sitekey found:", sitekey)
                captcha_type = "recaptcha"
                break
            except Exception:
                pass
        elif "hcaptcha" in f.url:
            # hCaptcha
            try:
                src = await f.frame_element.get_attribute("src")
                qs = urllib.parse.parse_qs(urllib.parse.urlparse(src).query)
                sitekey = qs.get('sitekey', [None])[0]
                print("hCaptcha sitekey found:", sitekey)
                captcha_type = "hcaptcha"
                break
            except Exception:
                pass

    # Fallback: Look for [data-sitekey] on main page (Snapchat may render recaptcha in div, not iframe)
    if not sitekey:
        el = await page.query_selector('[data-sitekey]')
        if el:
            sitekey = await el.get_attribute('data-sitekey')
            captcha_type = "recaptcha"
            print("Sitekey found in page:", sitekey)

    if not sitekey:
        print("No visible sitekey found—trying to find image captcha...")
        # (Snapchat sometimes uses simple image/number captchas; screenshot and send to 2Captcha)
        img_el = await page.query_selector('img[alt*="captcha"], img[src*="captcha"]')
        if img_el:
            img_path = "snapchat_img_captcha.png"
            await img_el.screenshot(path=img_path)
            solver = TwoCaptcha(api_key)
            print("Submitting image captcha to 2Captcha...")
            result = solver.normal(img_path)
            print("Image captcha solution:", result['code'])
            # Try to fill the code into an input
            await page.fill('input[type="text"]', result['code'])
            return True
        print("No supported captcha detected.")
        return False

    # 2. Submit to 2Captcha
    solver = TwoCaptcha(api_key)
    print(f"Submitting {captcha_type} to 2Captcha...")
    if captcha_type == "recaptcha":
        result = solver.recaptcha(sitekey=sitekey, url=page.url)
    else:
        result = solver.hcaptcha(sitekey=sitekey, url=page.url)
    solution = result['code']
    print("Got captcha solution from 2Captcha.")

    # 3. Inject the solution
    if captcha_type == "recaptcha":
        await page.evaluate(f'''
            let el = document.querySelector('textarea[name="g-recaptcha-response"]');
            if (el) {{
                el.value = "{solution}";
                let evt = document.createEvent('HTMLEvents');
                evt.initEvent('change', false, true);
                el.dispatchEvent(evt);
            }}
        ''')
    else:
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

    # 4. Click verify/continue if needed
    for verify_text in ["Verify", "Continue", "Submit", "Bestätigen", "Weiter"]:
        try:
            btn = await page.query_selector(f'button:has-text("{verify_text}")')
            if btn:
                await btn.click()
                print(f"Clicked {verify_text} to submit captcha.")
                break
        except Exception:
            continue
    await asyncio.sleep(3)
    print("CAPTCHA step completed with 2Captcha.")
    return True

async def create_snapchat_account(cred, proxy=None, user_agent=None):
    from playwright.async_api import async_playwright
    playwright = await async_playwright().start()
    context = None

    proxy_options = {}
    if proxy:
        if not proxy.startswith("http"):
            proxy = "http://" + proxy
        proxy_options = {"server": proxy}

    browser_args = []
    if user_agent:
        browser_args.append(f"--user-agent={user_agent}")

    try:
        context = await playwright.chromium.launch_persistent_context(
            user_data_dir=f"/tmp/snapbot-profile-{random.randint(1000, 9999)}",
            headless=False,
            args=browser_args,
            proxy=proxy_options if proxy else None,
        )
        page = await context.new_page()
        await apply_basic_stealth(page)

        print("Loading signup page...")
        await page.goto("https://accounts.snapchat.com/accounts/signup", timeout=300000)

        await page.wait_for_selector('input[placeholder="First name"]', timeout=150000)

        print("Filling name fields...")
        await page.fill('input[placeholder="First name"]', cred['first'])
        await asyncio.sleep(random.uniform(0.3, 0.8))
        await page.fill('input[placeholder="Last name (optional)"]', cred['last'])
        await asyncio.sleep(random.uniform(0.3, 0.8))

        print("Selecting birthday dropdowns...")
        await page.select_option('select[name="month"]', value="1")
        await asyncio.sleep(random.uniform(0.2, 0.4))
        await page.fill('input[name="day"]', "1")
        await asyncio.sleep(random.uniform(0.2, 0.4))
        await page.fill('input[name="year"]', "2000")
        await asyncio.sleep(random.uniform(0.2, 0.4))

        print("Waiting for username field...")
        await page.wait_for_selector('input[placeholder="Enter your username"]:not([disabled])', timeout=100000)

        print("Filling username and password...")
        await page.fill('input[placeholder="Enter your username"]', cred['username'])
        await asyncio.sleep(random.uniform(0.2, 0.7))
        await page.fill('input[placeholder="Enter a secure password"]', cred['password'])
        await asyncio.sleep(random.uniform(0.3, 1.0))

        print("Clicking Agree and Continue...")
        await page.click('button:has-text("Agree and Continue")')
        await asyncio.sleep(random.uniform(1.0, 2.0))

        # Switch to email sign up
        print("Switching to email sign up...")
        try:
            await page.wait_for_selector('text=/use email instead/i', timeout=100000)
            await page.click('text=/use email instead/i')
            print("Clicked 'Use Email Instead'")
            await asyncio.sleep(random.uniform(0.3, 0.8))
        except Exception as e:
            print(f"Could not find or click 'Use Email Instead': {e}")
            return SnapchatCreatorResult(False, error="Could not switch to email sign up", details=None)

        # Fill email and continue
        print('Filling in Email....')
        await page.wait_for_selector('input#email', timeout=1000000)
        await page.fill('input#email', GMAIL_ADDRESS)
        await asyncio.sleep(random.uniform(0.3, 0.7))
        await page.click('button:has-text("Next")')
        print('Clicked next button....')
        await asyncio.sleep(random.uniform(1.0, 2.0))

        print("Waiting for verification email...")
        # Wait for the 6 code fields
        await page.wait_for_selector('input[name="otpdigits.0"]', timeout=200000)
        print("Waiting for Snapchat email verification code...")

        code = fetch_snapchat_code_from_gmail(GMAIL_ADDRESS, GMAIL_PASSWORD, timeout=1200)
        if code and len(code) == 6:
            for i, digit in enumerate(code):
                await page.fill(f'input[name="otpdigits.{i}"]', digit)
                await asyncio.sleep(random.uniform(0.05, 0.15))
            print(f"Verification code {code} entered.")
            await asyncio.sleep(2)
        else:
            print("Verification code not received in time or not 6 digits.")
            return SnapchatCreatorResult(False, error="Email verification code not received", details=None)

        # Optionally, click Next if the form doesn't auto-advance
        try:
            await page.click('button:has-text("Next")')
            await asyncio.sleep(1)
        except Exception:
            pass

        # CAPTCHA and further logic...
        print("Checking for CAPTCHA after registration attempt...")
        captcha_solved = await solve_captcha_2captcha(page, API_KEY)
        if not captcha_solved:
            return SnapchatCreatorResult(False, error="No CAPTCHA found or could not solve", details=None)

        content = await page.content()
        if "We could not create your account" in content or "error" in content.lower():
            return SnapchatCreatorResult(False, error="Snapchat signup failed (duplicate/banned/invalid)", details=None)
        if "phone" in content.lower():
            return SnapchatCreatorResult(False, error="Phone verification required", details=None)

        return SnapchatCreatorResult(True, details="Snapchat account registration succeeded.")

    except PlaywrightTimeoutError:
        return SnapchatCreatorResult(False, error="Timeout loading/interacting with Snapchat", details=None)
    except Exception as e:
        return SnapchatCreatorResult(False, error=f"Error: {e}", details=None)
    finally:
        if context:
            await context.close()
        await playwright.stop()

if __name__ == "__main__":
    import sys
    import asyncio

    # Generate a random, realistic German girl credential
    cred = generate_german_credential_snap()
    print(f"Using generated credential: {cred}")

    # Optionally, pass proxy/user_agent from command line
    proxy = None
    user_agent = None
    if len(sys.argv) > 1:
        proxy = sys.argv[1]
    if len(sys.argv) > 2:
        user_agent = sys.argv[2]

    async def run():
        result = await create_snapchat_account(cred, proxy=proxy, user_agent=user_agent)
        print("RESULT:", result.success, result.error, result.details)

    asyncio.run(run())