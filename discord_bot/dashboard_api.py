from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os

from starlette.responses import JSONResponse

app = FastAPI()

# Allow frontend on port 5173 (React/Vite default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend dev port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BOT_SCRIPTS = {
    "yahoo": os.path.abspath("discord_bot/stealth/yahoo_creator.py"),
    "snapchat": os.path.abspath("discord_bot/stealth/snapchat_creator.py"),
    # Add more as needed
}

RUNNING_PROCESSES = {}

LOG_FILES = {
    "snapbot": "snapbot.log",
    "knuddels": "knuddels_creator.log",
    "yahoo": "yahoo_creator.log"
}

def run_bot(botname, script):
    proc = subprocess.Popen(["python", script])
    RUNNING_PROCESSES[botname] = proc


@app.get("/api/logs")
def list_logs():
    return {"logs": list(LOG_FILES.keys())}

@app.get("/api/bots")
def list_bots():
    return {
        "bots": [
            {"name": k, "path": v, "running": k in RUNNING_PROCESSES and RUNNING_PROCESSES[k].poll() is None}
            for k, v in BOT_SCRIPTS.items()
        ]
    }

@app.post("/api/bots/{botname}/start")
def start_bot(botname: str, background_tasks: BackgroundTasks):
    if botname not in BOT_SCRIPTS:
        return {"error": "Unknown discord_bot"}
    # Already running?
    if botname in RUNNING_PROCESSES and RUNNING_PROCESSES[botname].poll() is None:
        return {"status": "already running"}
    background_tasks.add_task(run_bot, botname, BOT_SCRIPTS[botname])
    return {"status": "started", "discord_bot": botname}

@app.post("/api/bots/{botname}/stop")
def stop_bot(botname: str):
    proc = RUNNING_PROCESSES.get(botname)
    if proc and proc.poll() is None:
        proc.terminate()
        return {"status": "stopped"}
    return {"status": "not running"}

@app.get("/api/bots/{botname}/status")
def bot_status(botname: str):
    proc = RUNNING_PROCESSES.get(botname)
    running = proc and proc.poll() is None
    return {"running": running}

@app.get("/api/logs")
def get_logs():
    log_path = "knuddels_creator.log"
    if not os.path.exists(log_path):
        return {"logs": ["No log file found."]}
    with open(log_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    return {"logs": lines[-50:]}  # return last 50 lines

@app.get("/api/logs/{logname}")
def get_log_file(logname: str):
    if logname not in LOG_FILES:
        return JSONResponse(status_code=404, content={"error": "Log not found"})
    path = LOG_FILES[logname]
    if not os.path.exists(path):
        return {"lines": [f"No log file at: {path}"]}
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    return {"lines": lines[-50:]}  # Return last 50 lines
