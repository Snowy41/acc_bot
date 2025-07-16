import asyncio
import os
from discord_bot.client import SnapDiscordBot
from discord_bot.commands import CredentialCommands
import discord
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("DISCORD_TOKEN")
if not token:
    raise ValueError("DISCORD_TOKEN not set")

async def run_bot():
    print("[Discord Bot] Starting...")

    intents = discord.Intents.default()
    intents.message_content = True  # Enable if your bot needs to read messages

    bot = SnapDiscordBot(
        db_path="dev.db",
        command_prefix="!",
        intents=intents,
    )

    await bot.credential_store.initialize()
    await bot.add_cog(CredentialCommands(bot))
    await bot.start(token)

asyncio.run(run_bot())
