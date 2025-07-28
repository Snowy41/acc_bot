import time

from fastapi import FastAPI, Request, HTTPException
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
account_db = SqliteDict("account_db.db", autocommit=True)
device_db = SqliteDict("device_fp.db", autocommit=True)
ip_db = SqliteDict("ip_db.db", autocommit=True)


# === BRAIN LOG (for debugging) ===
BRAIN_LOG = []

def log_event(evt):
    BRAIN_LOG.append({**evt, "ts": int(time.time())})
    if len(BRAIN_LOG) > 500:
        BRAIN_LOG.pop(0)

@app.post("/ai/event")
async def handle_event(req: Request):
    data = await req.json()
    event = data.get("event")
    session_id = data.get("session_id") or data.get("usertag") or "unknown"
    # ...all risk score logic...
    # After updating risk:
    log_event({
        "event": event,
        "session_id": session_id,
        "risk": risk_db.get(session_id, 0),
        "data": {k: v for k, v in data.items() if k not in ("text", "pages")},  # Don't log full messages/pages
    })
    return {"ok": True, "risk": risk_db[session_id]}

@app.get("/ai/admin/log")
async def brain_log(admin_key: str = ""):
    # In production, use a real admin session/token check!
    if admin_key != "YT123":
        raise HTTPException(status_code=403, detail="Admins only")
    return {"log": list(BRAIN_LOG)[-150:], "risk_db": dict(risk_db)}


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

# === Cloud/Gov ASN/IP Check ===
def is_gov_or_cloud(asn_or_org):
    cloud_terms = ["Amazon", "AWS", "Google", "Azure", "Microsoft", "DigitalOcean", "Linode", "Vultr", "OVH", "Oracle"]
    gov_terms = ["Department", "Gov", "Bund", "Polizei", "Ministry", "Justice", "Interior"]
    if not asn_or_org:
        return False
    asn_or_org = asn_or_org.lower()
    return any(term.lower() in asn_or_org for term in cloud_terms + gov_terms)

@app.post("/ai/event")
async def handle_event(req: Request):
    data = await req.json()
    event = data.get("event")
    session_id = data.get("session_id") or data.get("usertag") or "unknown"
    score = 0

    # --- 1. Site Crawling Detection ---
    if event == "session_navigation":
        # Expects: {"pages": ["/forum/1", "/marketplace", ...], ...}
        pages = data.get("pages", [])
        unique_sections = set(p.split('/')[1] for p in pages if p.count('/') > 1)
        if len(pages) > 15 and len(unique_sections) > 6:
            score += 3  # Visited almost all major sections
        if any("/hidden-admin" in p or "/decoy" in p for p in pages):
            score += 5  # Accessed decoy/honeypot

    # --- 2. Device Fingerprint Tracking ---
    if event == "device_fingerprint":
        # Expects: {"fingerprint": "...", "session_id": "..."}
        fp = data.get("fingerprint")
        if fp:
            if fp not in device_db:
                device_db[fp] = []
            device_db[fp].append(session_id)
            # More than 2 accounts on same device
            if len(set(device_db[fp])) > 2:
                score += 5
            account_db[session_id] = fp
            # If this is a fingerprint seen less than twice in all history, it's rare
            if len(device_db[fp]) < 2:
                score += 2  # Very rare/unique device

    # --- 3. IP ASN / Gov / Cloud Provider Check ---
    if event == "session_start":
        # Expects: {"ip": "...", "asn": "...", "org": "...", "hour": ...}
        ip = data.get("ip")
        asn = data.get("asn", "")
        org = data.get("org", "")
        if ip:
            ip_db[ip] = {"asn": asn, "org": org}
            if is_gov_or_cloud(asn) or is_gov_or_cloud(org):
                score += 4

        # --- 4. Office/Non-Office Hours Check ---
        hour = data.get("hour")
        if hour is not None:
            # Flag always 8-18 (office hours) as suspicious (optional, adjust as needed)
            if 8 <= hour <= 18:
                score += 1  # Only logs in during workday, suspicious
            else:
                score += 0  # Nighttime, typical for real users

    # --- 5. Multiple Accounts, Same Device ---
    if event == "account_switch":
        # Expects: {"from_usertag": "...", "to_usertag": "...", "fingerprint": "..."}
        fp = data.get("fingerprint")
        if fp:
            linked = device_db.get(fp, [])
            if len(set(linked)) > 1:
                score += 4  # Multi-accounting from one device

    # --- (Optional) NLP, can keep for abuse/phishing, not LE ---
    if event == "chat_message":
        text = data.get("text", "")
        le_score = nlp_le_score(text)
        score += le_score

    # --- Rolling/cumulative risk update ---
    rolling = risk_db.get(session_id, 0) + score
    risk_db[session_id] = min(rolling, 30)  # Cap at 30 for runaways

    return {"ok": True, "risk": risk_db[session_id]}

# === SESSION RISK API ===
@app.get("/ai/session-risk")
async def get_risk(session_id: str):
    return {"score": risk_db.get(session_id, 0)}

# === Optional: Testing & Debug ===
@app.get("/ai/test")
async def ai_test(q: str = "pursuant to our investigation"):
    return {"score": nlp_le_score(q)}
