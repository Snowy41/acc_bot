import pytest
from unittest.mock import AsyncMock, patch, MagicMock

import discord
from discord import Forbidden
from discord.ext import commands
from bot.commands import CredentialCommands

@pytest.mark.asyncio
@patch("discord_bot.client.CredentialStore")
async def test_nextcred_command_success_and_dm(mock_cred_store_class):
    # Setup mock CredentialStore with a fake credential
    fake_credential = {
        "id": 1,
        "email": "user@example.com",
        "username": "user123",
        "password": "pass123",
        "phone": "+123456789",
        "status": "pending"
    }
    mock_store = AsyncMock()
    mock_store.get_next_pending_credential.return_value = fake_credential
    mock_store.mark_credential_used.return_value = None
    mock_cred_store_class.return_value = mock_store

    # Create a discord_bot instance with mocked CredentialStore
    intents = discord.Intents.default()
    bot = commands.Bot(command_prefix="!", intents=intents)
    bot.credential_store = mock_store

    # Add the CredentialCommands cog to the discord_bot
    cog = CredentialCommands(bot)
    await bot.add_cog(cog)

    # Create a mock user and context
    mock_author = MagicMock(spec=discord.User)
    mock_author.mention = "@user"
    mock_author.send = AsyncMock()

    mock_ctx = MagicMock()
    mock_ctx.author = mock_author
    mock_ctx.send = AsyncMock()

    # Call the command callback manually
    await cog.next_credential.callback(cog, mock_ctx)

    # Assertions
    mock_store.get_next_pending_credential.assert_awaited_once()
    mock_store.mark_credential_used.assert_awaited_once_with(fake_credential["id"])

    # Check DM sent to user
    mock_author.send.assert_awaited_once()
    dm_msg = mock_author.send.call_args[0][0]
    assert "Email: user@example.com" in dm_msg
    assert "Username: user123" in dm_msg

    # Check confirmation sent publicly
    mock_ctx.send.assert_awaited_once()
    public_msg = mock_ctx.send.call_args[0][0]
    assert "@user" in public_msg

@pytest.mark.asyncio
@patch("discord_bot.client.CredentialStore")
async def test_nextcred_command_no_pending(mock_cred_store_class):
    # No pending credential returned
    mock_store = AsyncMock()
    mock_store.get_next_pending_credential.return_value = None
    mock_cred_store_class.return_value = mock_store

    intents = discord.Intents.default()
    bot = commands.Bot(command_prefix="!", intents=intents)
    bot.credential_store = mock_store
    cog = CredentialCommands(bot)
    await bot.add_cog(cog)

    mock_ctx = MagicMock()
    mock_ctx.send = AsyncMock()

    await cog.next_credential.callback(cog, mock_ctx)

    mock_ctx.send.assert_awaited_once_with("No pending credentials available.")

@pytest.mark.asyncio
@patch("discord_bot.client.CredentialStore")
async def test_nextcred_command_dm_blocked(mock_cred_store_class):
    fake_credential = {
        "id": 1,
        "email": "user@example.com",
        "username": "user123",
        "password": "pass123",
        "phone": "+123456789",
        "status": "pending"
    }
    mock_store = AsyncMock()
    mock_store.get_next_pending_credential.return_value = fake_credential
    mock_store.mark_credential_used.return_value = None
    mock_cred_store_class.return_value = mock_store

    intents = discord.Intents.default()
    bot = commands.Bot(command_prefix="!", intents=intents)
    bot.credential_store = mock_store
    cog = CredentialCommands(bot)
    await bot.add_cog(cog)

    mock_author = MagicMock(spec=discord.User)
    mock_author.mention = "@user"

    # Fix here: Provide mock response with .status attribute
    mock_response = MagicMock()
    mock_response.status = 403
    mock_author.send = AsyncMock(side_effect=Forbidden(response=mock_response, message="Cannot send messages to this user"))

    mock_ctx = MagicMock()
    mock_ctx.author = mock_author
    mock_ctx.send = AsyncMock()

    await cog.next_credential.callback(cog, mock_ctx)

    mock_author.send.assert_awaited_once()
    mock_ctx.send.assert_awaited_once_with("I couldn't DM you. Please check your DM settings.")

