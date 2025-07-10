import discord
from discord.ext import commands

class CredentialCommands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="nextcred")
    async def next_credential(self, ctx):
        print("Executing command")
        await ctx.send("Next credential command triggered!")
        cred = await self.bot.credential_store.get_next_pending_credential()
        if not cred:
            await ctx.send("No pending credentials available.")
            return

        await self.bot.credential_store.mark_credential_used(cred["id"])

        dm_message = (
            f"Here is your credential:\n"
            f"Email: {cred['email']}\n"
            f"Username: {cred['username']}\n"
            f"Password: {cred['password']}\n"
            f"Phone: {cred['phone']}\n"
        )
        try:
            await ctx.author.send(dm_message)
            await ctx.send(f"{ctx.author.mention}, I’ve sent you a DM with the credential.")
        except discord.Forbidden:
            await ctx.send("I couldn't DM you. Please check your DM settings.")
