import base64
import logging

def get_logger():
    logger = logging.getLogger("snapbot")
    logger.setLevel(logging.INFO)

    handler = logging.FileHandler("snapbot.log", encoding="utf-8")
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    # Optional console output for dev
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger

def log_sensitive_event(message, log_file="snapbot_sensitive.log"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"{timestamp} {message}"
    encoded = line.encode("utf-8").hex()  # or use base64 if you prefer
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(encoded + "\n")