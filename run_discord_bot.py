import asyncio
from discord_bot.client import SnapDiscordBot
from discord_bot.commands import CredentialCommands
import os
from dotenv import load_dotenv



load_dotenv()

token = os.getenv("DISCORD_TOKEN")
if not token:
    raise ValueError("DISCORD_TOKEN not set")

async def run_bot():
    print("[Discord Bot] Starting...")
    bot = SnapDiscordBot(db_path="dev.db", command_prefix="!")
    await bot.credential_store.initialize()
    await bot.add_cog(CredentialCommands(bot))
    await bot.start(token)

asyncio.run(run_bot())
