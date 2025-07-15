import discord
from discord.ext import commands

from utils.logger import get_logger
from stealth.snapchat_creator import create_snapchat_account

class CredentialCommands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="nextcred")
    @commands.has_permissions(administrator=True)
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
            logger = get_logger()
            logger.info(f"Credential {cred['id']} sent to {ctx.author}")
        except discord.Forbidden:
            await ctx.send("I couldn't DM you. Please check your DM settings.")

    @commands.command(name="addcred")
    @commands.has_permissions(administrator=True)
    async def add_credential(self, ctx, email: str = None, username: str = None, password: str = None,
                             phone: str = None):
        missing = []
        if not email:
            missing.append("email")
        if not username:
            missing.append("username")
        if not password:
            missing.append("password")
        if not phone:
            missing.append("phone")

        if missing:
            await ctx.send(f"❌ Missing required arguments: {', '.join(missing)}.\n"
                           f"Usage: `!addcred <email> <username> <password> <phone>`\n"
                           f"If your arguments have spaces, use quotes, e.g.:\n"
                           f"`!addcred email@example.com username \"my password\" \"123 456\"`")
            return

        try:
            await self.bot.credential_store.add_credential(email, username, password, phone)
            print(f"[DEBUG] Received arguments: email={email}, username={username}, password={password}, phone={phone}")
            await ctx.send(f"✅ Credential for `{email}` added successfully.")
            logger = get_logger()
            logger.info(f"Added credential: {email}")
        except Exception as e:
            await ctx.send(f"❌ Failed to add credential: `{e}`")

    @commands.command(name="listcreds")
    @commands.has_permissions(administrator=True)
    async def list_credentials(self, ctx):
        creds = await self.bot.credential_store.get_all_credentials()
        if not creds:
            await ctx.send("No credentials in the database.")
            return

        message = "Credentials in database:\n"
        for cred in creds:
            message += f"ID: {cred['id']}, Email: {cred['email']}, Status: {cred['status']}\n"
        await ctx.send(message[:1900])  # avoid Discord message limit
        logger = get_logger()
        logger.info(f"Listed all credentials.")

    @commands.command(name="resetcreds")
    @commands.has_permissions(administrator=True)
    async def reset_credentials(self, ctx):
        try:
            await self.bot.credential_store.reset_all_credentials()
            await ctx.send("✅ All credentials have been reset to `pending`.")
            logger = get_logger()
            logger.info(f"Reset all credentials.")
        except Exception as e:
            await ctx.send(f"❌ Failed to reset credentials: `{e}`")

    @commands.command(name="deletecred")
    @commands.has_permissions(administrator=True)
    async def delete_credential(self, ctx, cred_id: int = None):
        if cred_id is None:
            await ctx.send("❌ You must provide the ID of the credential to delete.\nUsage: `!deletecred <id>`")
            return
        try:
            deleted = await self.bot.credential_store.delete_credential_by_id(cred_id)
            if deleted:
                await ctx.send(f"✅ Credential with ID `{cred_id}` deleted successfully.")
                logger = get_logger()
                logger.info(f"Deleted credential with ID `{cred_id}`")
            else:
                await ctx.send(f"❌ No credential found with ID `{cred_id}`.")
        except Exception as e:
            await ctx.send(f"❌ Failed to delete credential: `{e}`")

    @commands.command(name="create_snap")
    @commands.has_permissions(administrator=True)
    async def create_snap_account(self, ctx, cred_id: int = None):
        if cred_id:
            cred = await self.bot.credential_store.get_credential_by_id(cred_id)
        else:
            cred = await self.bot.credential_store.get_next_pending_credential()
        if not cred:
            await ctx.send("No credential available.")
            return

        await ctx.send(f"⏳ Attempting to create Snapchat account for `{cred['email']}`...")
        result = await create_snapchat_account(cred)
        if result.success:
            await ctx.send(f"✅ Account creation success for `{cred['email']}`! Details: {result.details}")
            await self.bot.credential_store.mark_credential_used(cred['id'])
        else:
            await ctx.send(f"❌ Failed: {result.error}")

    @commands.command(name="invalidatecred")
    @commands.has_permissions(administrator=True)
    async def invalidate_credential(self, ctx, cred_id: int = None):
        if cred_id is None:
            await ctx.send("❌ You must provide the ID of the credential to invalidate. Usage: `!invalidatecred <id>`")
            return
        try:
            await self.bot.credential_store.mark_credential_invalid(cred_id)
            await ctx.send(f"✅ Credential with ID `{cred_id}` marked as invalid.")
            logger = get_logger()
            logger.info(f"Credential {cred_id} marked as invalid by {ctx.author}")
        except Exception as e:
            await ctx.send(f"❌ Failed to invalidate credential: `{e}`")

    # -------- INTERACTIVE BUTTONS START HERE --------

    # Interactive view for claiming a credential
    class ClaimCredentialView(discord.ui.View):
        def __init__(self, bot, cred_id):
            super().__init__(timeout=60)
            self.bot = bot
            self.cred_id = cred_id

        @discord.ui.button(label="Claim This Account", style=discord.ButtonStyle.green)
        async def claim(self, interaction: discord.Interaction, button: discord.ui.Button):
            cred = await self.bot.credential_store.get_credential_by_id(self.cred_id)
            if not cred or cred["status"] != "pending":
                await interaction.response.send_message("Sorry, this credential is no longer available.", ephemeral=True)
                return
            await self.bot.credential_store.mark_credential_used(self.cred_id)
            dm_message = (
                f"Here is your credential:\n"
                f"Email: {cred['email']}\n"
                f"Username: {cred['username']}\n"
                f"Password: {cred['password']}\n"
                f"Phone: {cred['phone']}\n"
            )
            try:
                await interaction.user.send(dm_message)
                await interaction.response.send_message("✅ Credential sent to your DM!", ephemeral=True)
                logger = get_logger()
                logger.info(f"Credential {cred['id']} claimed by {interaction.user}")
            except discord.Forbidden:
                await interaction.response.send_message("I couldn't DM you. Please check your DM settings.", ephemeral=True)

    @commands.command(name="pendingcreds")
    @commands.has_permissions(administrator=True)
    async def list_pending_with_buttons(self, ctx):
        creds = await self.bot.credential_store.get_all_credentials()
        pending_creds = [c for c in creds if c["status"] == "pending"]
        if not pending_creds:
            await ctx.send("No pending credentials.")
            return
        for cred in pending_creds:
            embed = discord.Embed(
                title=f"Credential ID {cred['id']}",
                description=f"**Email:** {cred['email']}\n"
                            f"**Username:** {cred['username']}\n"
                            f"**Status:** {cred['status']}",
                color=discord.Color.green()
            )
            view = self.ClaimCredentialView(self.bot, cred["id"])
            await ctx.send(embed=embed, view=view)

    class AdminToolsView(discord.ui.View):
        def __init__(self, bot):
            super().__init__(timeout=120)
            self.bot = bot

        @discord.ui.button(label="List All Credentials", style=discord.ButtonStyle.blurple)
        async def list_creds(self, interaction: discord.Interaction, button: discord.ui.Button):
            creds = await self.bot.credential_store.get_all_credentials()
            msg = "\n".join([f"ID: {c['id']} | {c['email']} | {c['status']}" for c in creds])[:1900]
            await interaction.response.send_message(f"**Credentials:**\n{msg}", ephemeral=True)

        @discord.ui.button(label="Reset All to Pending", style=discord.ButtonStyle.red)
        async def reset_creds(self, interaction: discord.Interaction, button: discord.ui.Button):
            await self.bot.credential_store.reset_all_credentials()
            await interaction.response.send_message("✅ All credentials reset to pending.", ephemeral=True)

    @commands.command(name="admintools")
    @commands.has_permissions(administrator=True)
    async def admin_tools_menu(self, ctx):
        view = self.AdminToolsView(self.bot)
        await ctx.send("**Admin Tools:**", view=view)
