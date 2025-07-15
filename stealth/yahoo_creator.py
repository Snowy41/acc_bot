import asyncio
import random
import sys

from playwright.async_api import async_playwright
from utils.credential_generator import generate_german_credential_yahoo
import aiohttp
import json

sys.stdout.reconfigure(line_buffering=True)

USE_PROXY = True
USE_MOBILE_UA = True
USE_EXTRA_HUMAN = True
SMSMAN_API_KEY = "jpe2T7BASFxjFjk3yYQciQ7QIXTiLyey"  # <-- Put your real sms-man.com API key here

PROXY_CONFIG = {
    "server": "http://p.webshare.io:80",
    "username": "bcqsiuxj-rotate",
    "password": "fys6qsvnjaz4"
}
USER_AGENTS = [
    # Desktop
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
]
MOBILE_USER_AGENTS = [
    "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
]

async def human_fill(page, selector, text):
    if USE_EXTRA_HUMAN:
        for char in text:
            await page.type(selector, char)
            await asyncio.sleep(random.uniform(0.07, 0.18))
    else:
        await page.fill(selector, text)
        await asyncio.sleep(random.uniform(0.3, 0.7))

# Dummy phone/SMS rental function -- replace with real API integration
async def rent_virtual_number():
    number, request_id = await smsman_rent_number()
    print(f"Rented number: {number} (request_id={request_id})")

    async def get_sms_code():
        return await smsman_get_code(request_id)

    return number, get_sms_code

async def create_yahoo_account():
    creds = generate_german_credential_yahoo()
    print("Generated credentials:", creds)

    ua = random.choice(MOBILE_USER_AGENTS if USE_MOBILE_UA else USER_AGENTS)
    viewport = {"width": 412, "height": 900} if USE_MOBILE_UA else {"width": 1280, "height": 1600}
    is_mobile = USE_MOBILE_UA
    device_scale = 2 if USE_MOBILE_UA else 1

    async with async_playwright() as p:
        if USE_PROXY:
            browser = await p.chromium.launch(headless=False, proxy=PROXY_CONFIG)
        else:
            browser = await p.chromium.launch(headless=False)

        context = await browser.new_context(
            user_agent=ua,
            viewport=viewport,
            device_scale_factor=device_scale,
            is_mobile=is_mobile,
            locale="en-US"
        )
        page = await context.new_page()

        await page.goto("https://login.yahoo.com/account/create")
        await asyncio.sleep(1.5)

        # Fill names
        await human_fill(page, 'input[name="firstName"]', creds["first"])
        await human_fill(page, 'input[name="lastName"]', creds["last"])

        # Email username (without @yahoo.com)
        await human_fill(page, 'input[name="userId"]', creds["username"])

        # Password
        await human_fill(page, 'input[name="password"]', creds["password"])

        # --- Month dropdown (by value or visible text) ---
        await asyncio.sleep(0.2)
        await page.select_option('select[name="mm"]', value=str(creds["month"]))  # "1" = Jan, "2" = Feb, ...

        # Day/Year
        await human_fill(page, 'input[name="dd"]', str(creds["day"]))
        await human_fill(page, 'input[name="yyyy"]', str(creds["year"]))

        # Optionally: Gender (Yahoo sometimes doesn't require)
        #try:
            #print("Searching for Gender-Input...")
            #await human_fill(page, 'input[name="freeformGender"]', "Female")
        #except Exception:
            #print("Gender-Input not found.")
            #pass

        print("Searching for Checkbox...")
        # Agree to terms
        try:
            # Try span by visible text
            await page.click('span.agree-checkbox-text')
            print("Clicked 'I agree to these terms.' span.")
        except Exception as e:
            print(f"Failed span click: {e}")
        await asyncio.sleep(0.4)

        await page.click('button[name="signup"]')

        # 1. Detect proxy country
        proxy_country = await get_proxy_country_code(PROXY_CONFIG)
        # 2. Get sms-man country list
        smsman_countries = await get_smsman_countries()
        # 3. Map to sms-man id
        country_id = map_country_code_to_smsman_id(proxy_country, smsman_countries)
        print(f"Using SMS country_id {country_id} for proxy country {proxy_country}")

        # 4. Rent SMS number with detected country_id
        phone, request_id = await smsman_rent_number(country_id=country_id)
        print(f"Phone number: {phone} (request_id={request_id})")

        if phone.startswith("49"):
            phone_local = phone[2:]
        else:
            phone_local = phone
        await human_fill(page, 'input[name="phone"]', phone_local)
        await asyncio.sleep(1)
        await page.click('#reg-sms-button')  # <- Click "Code per SMS erhalten"
        await asyncio.sleep(1)

        # After clicking Next and Yahoo asks for SMS code:
        print("Waiting for Yahoo SMS code from sms-man...")
        sms_code = await smsman_get_code(request_id)
        await page.wait_for_selector('#verification-code-field', timeout=30000)
        await human_fill(page, '#verification-code-field', sms_code)
        await asyncio.sleep(0.5)
        await page.click('#verify-code-button')
        await asyncio.sleep(2)
        print("Yahoo account should now be created!")

        await page.wait_for_selector('a.not-now', timeout=20000)
        await page.click('a.not-now')
        await asyncio.sleep(1)

        # Optionally go to inbox to verify
        try:
            await page.goto("https://mail.yahoo.com")
            await asyncio.sleep(5)
            print("Inbox loaded!")
        except Exception as e:
            print("Could not load inbox:", e)

        print("Keeping browser open for manual review (Ctrl+C to quit).")
        while True:
            await asyncio.sleep(60)


async def smsman_rent_number(country_id:str, application_id=136):
    # 1. Request a number for Yahoo (service: yahoo) and country: US (or any available)
    url = (
        f"https://api.sms-man.com/control/get-number"
        f"?token={SMSMAN_API_KEY}"
        f"&country_id={country_id}"
        f"&application_id={application_id}"
    )

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            data = await resp.text()
            print("sms-man get-number:", data)
            result = json.loads(data)
            if "number" not in result or "request_id" not in result:
                raise Exception(f"Failed to rent number: {result}")
            return result["number"], result["request_id"]

async def smsman_get_code(request_id, max_attempts=20, delay=5):
    url = (
        f"https://api.sms-man.com/control/get-sms"
        f"?token={SMSMAN_API_KEY}"
        f"&request_id={request_id}"
    )
    print("Trying to get code...")
    for _ in range(max_attempts):
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                print("Try: ", _)
                data = await resp.text()
                print("sms-man get-sms:", data)
                result = json.loads(data)
                print(result)
                if "sms_code" in result and result["sms_code"]:
                    print("Found code...")
                    return result["sms_code"]
                elif result.get("error_code") == "wait_sms":
                    await asyncio.sleep(delay)
                else:
                    raise Exception(f"SMS code error: {result}")
    raise Exception("Timed out waiting for Yahoo SMS code.")

async def get_proxy_country_code(proxy_config):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, proxy=proxy_config)
        context = await browser.new_context()
        page = await context.new_page()
        await page.goto('https://ipinfo.io/json')
        geo = await page.evaluate("() => document.body.innerText")
        await browser.close()
        geo_json = json.loads(geo)
        # Returns 'DE', 'US', etc.
        print(f"Proxy detected country: {geo_json.get('country')}")
        return geo_json.get('country')

async def get_smsman_countries():
    url = f'https://api.sms-man.com/control/countries?token={SMSMAN_API_KEY}'
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            countries = await resp.json()
            print(countries)
            return countries

def map_country_code_to_smsman_id(iso_code, smsman_countries):
    iso_code = iso_code.upper()
    special_cases = {
        "US": ["USA", "UNITED STATES", "AMERICA"],
        "GB": ["UK", "UNITED KINGDOM", "GREAT BRITAIN"],
        "RU": ["RUSSIA"],
        "DE": ["GERMANY"],
        "FR": ["FRANCE"],
        "IN": ["INDIA"],
    }
    # Try 'code' field first
    for country in smsman_countries:
        if isinstance(country, dict) and 'code' in country and country['code'].upper() == iso_code:
            return country['id']
    # Try special mapping names
    if iso_code in special_cases:
        for country in smsman_countries:
            if not isinstance(country, dict):
                continue
            title = country.get('title', '').upper()
            if any(name in title for name in special_cases[iso_code]):
                return country['id']
    # Loose match in title
    print(f"iso_code: '{iso_code}'")

    for country in smsman_countries:
        if not isinstance(country, dict):
            continue
        if iso_code in country.get('title', '').upper():
            return country['id']
    print("WARNING: Could not map ISO code, using DE (123) as fallback!")
    return 123


async def main():
    await create_yahoo_account()

if __name__ == "__main__":
    asyncio.run(main())
