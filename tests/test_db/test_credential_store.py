import pytest

from db import credential_store
from db.credential_store import CredentialStore


@pytest.mark.asyncio
async def test_add_and_fetch_credential(tmp_path):
    # Use a temporary database file for isolated testing
    db_path = tmp_path / "test_creds.db"
    store = credential_store.CredentialStore(str(db_path))

    # Initialize DB schema
    await store.initialize()

    # Test data
    test_cred = {
        "email": "test123@example.com",
        "username": "testuser123",
        "password": "SecurePass123!",
        "phone": "+15555550123"
    }

    # Step 1: Add credential
    await store.add_credential(**test_cred)

    # Step 2: Fetch next pending credential
    fetched = await store.get_next_pending_credential()
    assert fetched is not None, "Should fetch the added credential"
    assert fetched["email"] == test_cred["email"]
    assert fetched["status"] == "pending"

    # Step 3: Mark credential as used
    await store.mark_credential_used(fetched["id"])

    # Step 4: Fetch by ID and validate status
    updated = await store.get_credential_by_id(fetched["id"])
    assert updated["status"] == "used"

    # Cleanup
    await store.close()


@pytest.mark.asyncio
async def test_add_and_get_credential():
    store = CredentialStore(":memory:")
    await store.initialize()
    await store.add_credential("test@example.com", "user", "pass", "123456")
    cred = await store.get_next_pending_credential()
    assert cred["email"] == "test@example.com"
    await store.mark_credential_used(cred["id"])
    cred_used = await store.get_credential_by_id(cred["id"])
    assert cred_used["status"] == "used"
    await store.close()
