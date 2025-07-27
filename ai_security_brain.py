from fastapi import FastAPI, Request
import spacy
from sqlitedict import SqliteDict

# === INIT FASTAPI ===
app = FastAPI()

# === NLP MODEL (spaCy) ===
nlp = spacy.load("en_core_web_sm")

# === SUSPICIOUS KEYWORDS & PHRASES ===
SUSPICIOUS_KEYWORDS = {
    # Law enforcement and legal language
    "pursuant", "investigation", "subpoena", "chain of custody", "warrant",
    "court order", "production order", "digital evidence", "confiscate",
    "agency", "controlled delivery", "official", "detective", "agent",
    "prosecution", "forensic", "report", "compliance", "criminal", "case number",
    "supervisor", "testimony", "search warrant", "LEO", "undercover", "FBI", "Europol",
    "interview", "custody", "cooperation", "enforcement", "task force", "disclosure",
    "section 702", "exhibit", "arrest", "law enforcement", "DOJ", "BKA", "polizei"
}
SUSPICIOUS_PHRASES = [
    "as required by law",
    "by court order",
    "in accordance with",
    "federal law",
    "pursuant to",
    "this conversation is being monitored",
    "ongoing investigation",
    "controlled delivery",
    "digital evidence",
    "official request",
    "your cooperation is required"
]

# === SESSION/ACCOUNT SCORE DBs (auto-committing) ===
risk_db = SqliteDict("risk_scores.db", autocommit=True)
canary_db = SqliteDict("canary_hits.db", autocommit=True)
chat_db = SqliteDict("chat_texts.db", autocommit=True)

# === NLP LAW ENFORCEMENT SCORING ===
def nlp_le_score(text):
    score = 0
    doc = nlp(text)
    # Keyword check
    for token in doc:
        if token.text.lower() in SUSPICIOUS_KEYWORDS:
            score += 2
    # Phrase check
    lowered = text.lower()
    for phrase in SUSPICIOUS_PHRASES:
        if phrase in lowered:
            score += 3
    # Bonus: excessive formality
    if "dear" in lowered or lowered.startswith("to whom it may concern"):
        score += 1
    return score

# === MAIN EVENT RECEIVER ===
@app.post("/ai/event")
async def handle_event(req: Request):
    data = await req.json()
    event = data.get("event")
    session_id = data.get("session_id") or data.get("usertag") or "unknown"
    score = 0

    # === Chat/PM Message Event ===
    if event == "chat_message":
        text = data.get("text", "")
        le_score = nlp_le_score(text)
        chat_db.setdefault(session_id, []).append(text)
        score += le_score
    # === Forum/Post Message Event ===
    if event == "forum_post":
        text = data.get("text", "")
        le_score = nlp_le_score(text)
        score += le_score
    # === Canary/Honeypot Hit Event ===
    if event == "canary_hit":
        canary_db[session_id] = canary_db.get(session_id, 0) + 1
        score += 5
    # === Session Start/Device Change Event ===
    if event == "session_status":
        if data.get("device_change") == True:
            score += 2
        # Optionally: check for odd time, regularity, or rare fingerprints
    # === Admin Action Event (Advanced) ===
    if event == "admin_action":
        score += 3  # Only if outside usual time/location, etc.

    # Add to rolling score, but cap at 20 to avoid runaway
    rolling = risk_db.get(session_id, 0) + score
    risk_db[session_id] = min(rolling, 20)
    return {"ok": True, "risk": risk_db[session_id]}

# === SESSION RISK API ===
@app.get("/ai/session-risk")
async def get_risk(session_id: str):
    return {"score": risk_db.get(session_id, 0)}

# === Optional: Testing & Debug ===
@app.get("/ai/test")
async def ai_test(q: str = "pursuant to our investigation"):
    return {"score": nlp_le_score(q)}
