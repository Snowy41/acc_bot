import random
import string

GERMAN_FIRST_NAMES = [
    "Mia", "Emma", "Hannah", "Lea", "Lina", "Marie", "Lena", "Anna", "Sofia",
    "Laura", "Clara", "Luisa", "Amelie", "Emilia", "Charlotte", "Emily", "Sophia", "Ella",
    "Marie", "Lisa", "Johanna", "Helena", "Marlene", "Paula", "Greta", "Ida", "Luise",
    "Maja", "Franziska", "Melina", "Annika"
]

GERMAN_LAST_NAMES = [
    "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
    "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Braun", "Werner",
    "Schwarz", "Zimmermann", "Schmitt", "Hartmann", "Krüger", "Lange", "Scholz", "Schubert", "Krause", "Meier"
]

def random_german_name():
    first = random.choice(GERMAN_FIRST_NAMES)
    last = random.choice(GERMAN_LAST_NAMES)
    return first, last

def normalize(s):
    # Replace umlauts and ß, remove non-ascii
    s = s.lower()
    replacements = {'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss'}
    for k, v in replacements.items():
        s = s.replace(k, v)
    s = ''.join(c for c in s if c.isalnum())
    return s

def random_birthday(min_year=1995, max_year=2003):
    # Random German legal age birthday (YYYY, MM, DD)
    year = random.randint(min_year, max_year)
    month = random.randint(1, 12)
    # Pick day based on month (simplified, safe for all months)
    if month == 2:
        day = random.randint(1, 28)
    elif month in [4, 6, 9, 11]:
        day = random.randint(1, 30)
    else:
        day = random.randint(1, 31)
    return year, month, day
def random_username():
    first, last = random_german_name()
    return f"{normalize(first)}{normalize(last)}{random.randint(1,999)}"

def random_email(username=None):
    domains = ["gmx.de", "web.de", "gmail.com", "outlook.de", "t-online.de"]
    if username is None:
        username = random_username()
    return f"{username}{random.randint(100,9999)}@{random.choice(domains)}"

def random_password():
    chars = string.ascii_letters + string.digits + "!$%&?"
    pw = [random.choice(string.ascii_uppercase),
          random.choice(string.ascii_lowercase),
          random.choice(string.digits)]
    pw += [random.choice(chars) for _ in range(random.randint(8,12))]
    random.shuffle(pw)
    return ''.join(pw)

def random_phone():
    # German mobile phone format: +49 15X XXXXXXXX
    first = random.choice(["151", "152", "157", "159", "160", "162", "163", "170", "171", "172", "173", "174", "175", "176", "177", "178", "179"])
    return f"+49{first}{random.randint(1000000,9999999)}"

def generate_german_credential():
    username = random_username()
    email = random_email(username)
    password = random_password()
    phone = random_phone()
    return {
        "email": email,
        "username": username,
        "password": password,
        "phone": phone
    }


def generate_german_credential_snap():
    username = random_username()
    if len(username) <= 14:username = username[:14].rstrip("_-.")
    email = random_email(username)
    password = random_password()
    phone = random_phone()
    return {
        "email": email,
        "username": username,
        "password": password,
        "phone": phone,
        "first": random.choice(GERMAN_FIRST_NAMES),
        "last" : random.choice(GERMAN_LAST_NAMES)
    }
def generate_german_credential_yahoo():
    username = random_username()
    email = random_email(username)
    password = random_password()
    phone = random_phone()
    first = random.choice(GERMAN_FIRST_NAMES)
    last = random.choice(GERMAN_LAST_NAMES)
    year, month, day = random_birthday()
    return {
        "email": email,
        "username": username,
        "password": password,
        "phone": phone,
        "first": first,
        "last": last,
        "year": year,
        "month": month,
        "day": day
    }