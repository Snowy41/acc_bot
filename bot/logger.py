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
