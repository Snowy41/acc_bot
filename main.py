import os
import asyncio
from dotenv import load_dotenv

from bot.client import SnapDiscordBot
from bot.commands import CredentialCommands
import discord

load_dotenv()
token = os.getenv("DISCORD_TOKEN")
if not token:
    raise ValueError("DISCORD_TOKEN environment variable not set!")

intents = discord.Intents.default()
intents.message_content = True

bot = SnapDiscordBot(
    db_path="credentials.db",
    command_prefix="!",
    intents=intents
)

async def main():
    print("Initializing CredentialStore...")
    await bot.credential_store.initialize()
    print("CredentialStore initialized!")

    print("Adding cog...")
    await bot.add_cog(CredentialCommands(bot))
    print("Cog added!")

    print("Starting bot...")
    await bot.start(token)  # blocks forever until disconnected

if __name__ == "__main__":
    asyncio.run(main())
