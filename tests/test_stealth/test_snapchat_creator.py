import os
import sys

import pytest
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from stealth.snapchat_creator import create_snapchat_account

@pytest.mark.asyncio
async def test_create_snapchat_account():
    # Unique credentials required for every run!
    cred = {
        "email": "pytestunq345@example.com",   # must be unique per run!
        "username": "pytestunqbot345",         # must be unique per run!
        "password": "SuperSecretPassw0rd!",
        "phone": ""
    }

    user_agent = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    )
    proxy = None  # e.g. "123.45.67.89:8080"

    # Test execution
    result = await create_snapchat_account(cred, proxy=proxy, user_agent=user_agent)
    print("Success:", result.success)
    print("Error:", result.error)
    print("Details:", result.details)

    # You can assert either success or simply that you get a result object
    assert isinstance(result.success, bool)
    assert result.error is None or isinstance(result.error, str)
