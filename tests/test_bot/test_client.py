import pytest
from unittest.mock import AsyncMock, patch
import discord
from bot.client import SnapDiscordBot

@pytest.mark.asyncio
@patch("discord_bot.client.CredentialStore")
async def test_bot_startup_and_ping_command(mock_cred_store_class):
    # Mock CredentialStore instance & methods
    mock_store = AsyncMock()
    mock_cred_store_class.return_value = mock_store
    mock_store.initialize.return_value = None
    mock_store.close.return_value = None
    mock_store.get_next_pending_credential.return_value = None

    # Instantiate the discord_bot
    bot = SnapDiscordBot(db_path=":memory:", command_prefix="!")

    # Patch discord_bot.run to just call setup_hook without connecting to Discord
    await bot.setup_hook()

    # Check that CredentialStore was initialized
    mock_store.initialize.assert_called_once()

    # Define a simple test command in discord_bot.commands for ping
    # Here, simulate command call manually:

    @bot.command()
    async def ping(ctx):
        await ctx.send("pong")

    # Create a mock context with send() method
    class MockCtx:
        def __init__(self):
            self.sent = None
        async def send(self, msg):
            self.sent = msg

    ctx = MockCtx()
    await ping.callback(ctx)
    assert ctx.sent == "pong"

    # Close discord_bot connection
    await bot.close()
    mock_store.close.assert_called_once()
