import discord
import asyncio
import os
from utils.logger import get_logger
from utils.credential_generator import generate_german_credential

DASHBOARD_MESSAGE_FILE = "dashboard_msg_id.txt"
DASHBOARD_TITLE = "👻 SnapBot Account Dashboard"
DASHBOARD_DESC = (
    "Welcome! Use the buttons below to manage credentials.\n"
    "• 🟢 **Pending** = Registered, ready to hand out\n"
    "• 🔵 **Used** = Already given out\n"
    "• 🔴 **Invalid** = Banned or bad\n\n"
    "**Select an action:**"
)
DASHBOARD_COLOR = discord.Color.from_rgb(255, 252, 0)
STATUS_EMOJIS = {"pending": "🟢", "used": "🔵", "invalid": "🔴"}

def progress_bar(current, total, length=16):
    fill = "■"
    empty = "□"
    if total == 0:
        return empty * length
    filled = int((current / total) * length)
    return fill * filled + empty * (length - filled)

class ClaimPendingCredentialView(discord.ui.View):
    def __init__(self, bot, credential):
        super().__init__(timeout=60)
        self.bot = bot
        self.credential = credential

    @discord.ui.button(label="🎟️ Claim", style=discord.ButtonStyle.green)
    async def claim(self, interaction: discord.Interaction, button: discord.ui.Button):
        logger = get_logger()
        try:
            cred = await self.bot.credential_store.get_credential_by_id(self.credential['id'])
            print("Trying to claim:", cred)  # Debug print
            if not cred or cred['status'] != "pending":
                await interaction.response.send_message("❌ Sorry, this credential is no longer available.",
                                                        ephemeral=True)
                logger.warning(f"Claim failed: Credential {self.credential['id']} not available.")
                return
            await self.bot.credential_store.mark_credential_used(cred['id'])

            dm_message = (
                f"**Here is your credential:**\n"
                f"Email: `{cred['email']}`\n"
                f"Username: `{cred['username']}`\n"
                f"Password: `{cred['password']}`\n"
                f"Phone: `{cred['phone']}`\n"
            )
            try:
                await interaction.user.send(dm_message)
                await interaction.response.send_message("✅ Credential sent to your DM!", ephemeral=True)
                logger.info(
                    f"Credential {cred['id']} ({cred['email']}) claimed by {interaction.user} [{interaction.user.id}]")
            except discord.Forbidden:
                await interaction.response.send_message("❌ I couldn't DM you. Please check your DM settings.",
                                                        ephemeral=True)
                logger.warning(f"Failed to DM credential {cred['id']} to {interaction.user} [{interaction.user.id}]")
            # Delete the claim message after claim if public
            try:
                await asyncio.sleep(2)
                await interaction.message.delete()
            except Exception as e:
                print("Error deleting claim message:", e)
            await update_dashboard(self.bot)
        except Exception as e:
            logger.error(f"Exception in claim callback: {e}")
            try:
                await interaction.response.send_message(f"❌ Error: {e}", ephemeral=True)
                await update_dashboard(self.bot)
            except Exception:
                pass

class DashboardView(discord.ui.View):
    def __init__(self, bot):
        super().__init__(timeout=None)
        self.bot = bot

    @discord.ui.button(label="🟢 List Pending", style=discord.ButtonStyle.green)
    async def list_pending(self, interaction: discord.Interaction, button: discord.ui.Button):
        creds = await self.bot.credential_store.get_all_credentials()
        pending = [c for c in creds if c["status"] == "pending"]
        if not pending:
            await interaction.response.send_message("No pending credentials.", ephemeral=True)
            return

        lines = [
            f"**{i+1}.** `{c['email']}` *(ID {c['id']})*"
            for i, c in enumerate(pending[:5])
        ]
        msg = "**🟢 Pending credentials:**\n" + "\n".join(lines)
        await interaction.response.send_message(
            msg + "\n\nClick **Claim** on any account below to receive it.",
            ephemeral=True
        )

        sent_messages = []
        for i, c in enumerate(pending[:5]):
            embed = discord.Embed(
                title=f"Pending Account #{i+1} (ID {c['id']})",
                description=(
                    f"**Email:** `{c['email']}`\n"
                    f"**Username:** `{c['username']}`\n"
                    f"Click below to claim."
                ),
                color=discord.Color.green()
            )
            view = ClaimPendingCredentialView(self.bot, c)
            msg = await interaction.channel.send(embed=embed, view=view)
            sent_messages.append(msg)

        await asyncio.sleep(60)
        for msg in sent_messages:
            try:
                await msg.delete()
            except Exception:
                pass

    @discord.ui.button(label="🔵 List Used", style=discord.ButtonStyle.blurple)
    async def list_used(self, interaction: discord.Interaction, button: discord.ui.Button):
        creds = await self.bot.credential_store.get_all_credentials()
        used = [c for c in creds if c["status"] == "used"]
        if not used:
            msg = "No used credentials."
        else:
            msg = "\n".join(
                f"**{i+1}.** {STATUS_EMOJIS['used']} `{c['email']}` *(ID {c['id']})*"
                for i, c in enumerate(used)
            )
        await interaction.response.send_message(f"**You selected:** 🔵 **List Used**\n{msg}", ephemeral=True)
        await asyncio.sleep(20)
        try:
            sent_msg = await interaction.original_response()
            await sent_msg.delete()
        except Exception:
            pass

    @discord.ui.button(label="🔴 List Invalid", style=discord.ButtonStyle.red)
    async def list_invalid(self, interaction: discord.Interaction, button: discord.ui.Button):
        creds = await self.bot.credential_store.get_all_credentials()
        invalid = [c for c in creds if c["status"] == "invalid"]
        if not invalid:
            msg = "No invalid credentials."
        else:
            msg = "\n".join(
                f"**{i+1}.** {STATUS_EMOJIS['invalid']} `{c['email']}` *(ID {c['id']})*"
                for i, c in enumerate(invalid)
            )
        await interaction.response.send_message(f"**You selected:** 🔴 **List Invalid**\n{msg}", ephemeral=True)
        await asyncio.sleep(20)
        try:
            sent_msg = await interaction.original_response()
            await sent_msg.delete()
        except Exception:
            pass

    @discord.ui.button(label="🇩🇪 Add Random Credential", style=discord.ButtonStyle.gray)
    async def add_random_german_credential(self, interaction: discord.Interaction, button: discord.ui.Button):
        try:
            cred = generate_german_credential()
            await self.bot.credential_store.add_credential(
                cred["email"], cred["username"], cred["password"], cred["phone"]
            )
            await interaction.response.send_message(
                f"✅ Created German credential:\n"
                f"**Email:** `{cred['email']}`\n"
                f"**Username:** `{cred['username']}`\n"
                f"**Password:** `{cred['password']}`\n"
                f"**Phone:** `{cred['phone']}`",
                ephemeral=True
            )
            from bot.dashboard import update_dashboard
            await update_dashboard(self.bot)
        except Exception as e:
            await interaction.response.send_message(f"❌ Could not add random credential: {e}", ephemeral=True)

async def get_or_create_dashboard(bot, channel):
    dashboard_msg_id = None
    if os.path.exists(DASHBOARD_MESSAGE_FILE):
        with open(DASHBOARD_MESSAGE_FILE, "r") as f:
            try:
                dashboard_msg_id = int(f.read().strip())
            except Exception:
                dashboard_msg_id = None

    dashboard_msg = None
    if dashboard_msg_id:
        try:
            dashboard_msg = await channel.fetch_message(dashboard_msg_id)
        except Exception:
            dashboard_msg = None

    # Gather credential stats for the progress bar
    creds = await bot.credential_store.get_all_credentials()
    pending_count = sum(1 for c in creds if c["status"] == "pending")
    used_count = sum(1 for c in creds if c["status"] == "used")
    invalid_count = sum(1 for c in creds if c["status"] == "invalid")
    total = pending_count + used_count + invalid_count

    bar = progress_bar(used_count, total, length=18)

    # Load local banner image (project root)
    banner_path = os.path.join(os.path.dirname(__file__), '..', 'dashboard_banner.png')
    banner_file = discord.File(banner_path, filename="../dashboard_banner.png")

    embed = discord.Embed(
        title=DASHBOARD_TITLE,
        description=(
            f"**🟢 Pending:** `{pending_count}`  "
            f"**🔵 Used:** `{used_count}`  "
            f"**🔴 Invalid:** `{invalid_count}`\n\n"
            f"**Usage Progress**\n{bar}\n\n"
            "Select an action below:"
        ),
        color=DASHBOARD_COLOR
    )
    embed.set_image(url="attachment://dashboard_banner.png")
    embed.set_footer(text="Powered by mcbzh • 24/7 Uptime")

    if dashboard_msg is None:
        view = DashboardView(bot)
        dashboard_msg = await channel.send(embed=embed, file=banner_file, view=view)
        with open(DASHBOARD_MESSAGE_FILE, "w") as f:
            f.write(str(dashboard_msg.id))
    else:
        try:
            await dashboard_msg.edit(embed=embed, view=DashboardView(bot), content=None, attachments=[banner_file])
        except Exception:
            pass

    try:
        await dashboard_msg.pin()
    except Exception:
        pass
    return dashboard_msg


async def update_dashboard(bot):
    channel_id = int(os.getenv("DASHBOARD_CHANNEL_ID"))
    channel = bot.get_channel(channel_id)
    if channel is None:
        channel = await bot.fetch_channel(channel_id)
    await get_or_create_dashboard(bot, channel)
