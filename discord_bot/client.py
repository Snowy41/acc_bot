import os

import discord
from discord.ext import commands

from discord_bot.dashboard import get_or_create_dashboard
from db.credential_store import CredentialStore


class SnapDiscordBot(commands.Bot):
    def __init__(self, db_path, *args, **kwargs):
        self.db_path = db_path
        super().__init__(*args, **kwargs)
        self.credential_store = CredentialStore(self.db_path)  # safe now

    async def on_ready(self):
        print(f"Logged in as {self.user} (ID: {self.user.id})")
        print("------")
        # Dashboard setup
        channel_id = int(os.getenv("DASHBOARD_CHANNEL_ID"))
        channel = self.get_channel(channel_id)
        if channel is None:
            channel = await self.fetch_channel(channel_id)
        await get_or_create_dashboard(self, channel)

    async def setup_hook(self):
        # async init, initialize DB connection
        self.credential_store = CredentialStore(self.db_path)
        await self.credential_store.initialize()

    async def close(self):
        if self.credential_store:
            await self.credential_store.close()
        await super().close()
