import logging
import sys
from logging.handlers import TimedRotatingFileHandler

# Basic configuration
LOG_FILE = "backend.log" # Keep log file name simple
FORMATTER = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# Configure logging
def setup_logging(log_level=logging.INFO):  # Change default level back to INFO
    """Set up logging configuration"""
    
    logger = logging.getLogger()  # Get root logger
    logger.setLevel(log_level)
    
    # Prevent adding multiple handlers if called again
    if logger.hasHandlers():
        # Check if file and stream handlers already exist
        has_file = any(isinstance(h, TimedRotatingFileHandler) for h in logger.handlers)
        has_stream = any(isinstance(h, logging.StreamHandler) for h in logger.handlers)
        if has_file and has_stream:
             logger.debug("Logging handlers already configured.")
             return
        else:
            # Clear existing handlers if setup is incomplete/incorrect
            for handler in logger.handlers[:]:
                logger.removeHandler(handler)
            logger.info("Cleared existing handlers to reconfigure logging.")
    
    # File Handler (Rotate daily, keep 7 days)
    file_handler = TimedRotatingFileHandler(LOG_FILE, when="midnight", interval=1, backupCount=7)
    file_handler.setFormatter(FORMATTER)
    logger.addHandler(file_handler)
    
    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(FORMATTER)
    logger.addHandler(console_handler)
    
    # Log configuration details
    logger.info(f"Logging setup complete. Level: {logging.getLevelName(log_level)}, File: {LOG_FILE}") 