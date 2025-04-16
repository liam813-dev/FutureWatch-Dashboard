import os
import time
import redis
import json
import logging

# Placeholder for your actual data aggregation logic
# Replace this with imports and calls to your data fetching functions
# from data_aggregator import fetch_all_dashboard_data

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Configuration
REDIS_URL = os.environ.get('REDIS_URL')
DASHBOARD_DATA_KEY = "dashboard_data" # The key to store data under in Redis
DATA_TTL_SECONDS = 10 # Time-to-live for the data in seconds
FETCH_INTERVAL_SECONDS = 5 # How often to fetch new data

def get_redis_connection():
    """Establishes connection to Redis."""
    if not REDIS_URL:
        logging.error("REDIS_URL environment variable not set.")
        raise ValueError("REDIS_URL not configured")
    try:
        # decode_responses=True makes sure we get strings back from Redis
        r = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        r.ping() # Check connection
        logging.info("Successfully connected to Redis.")
        return r
    except redis.exceptions.ConnectionError as e:
        logging.error(f"Failed to connect to Redis: {e}")
        raise

def placeholder_fetch_data():
    """Placeholder function for fetching data. Replace with your actual logic."""
    # In a real scenario, this would call functions from data_sources/* or data_aggregator
    # e.g., return fetch_all_dashboard_data()
    logging.info("Fetching placeholder data...")
    # Example structure
    return {
        "timestamp": time.time(),
        "example_metric": 123.45,
        "source": "placeholder"
    }

def main():
    """Main loop for the background worker."""
    logging.info("Starting data ingestor worker...")
    redis_client = get_redis_connection()

    while True:
        try:
            logging.info("Fetching new data...")
            # Replace placeholder_fetch_data with your actual data fetching call
            dashboard_data = placeholder_fetch_data() 

            if dashboard_data:
                # Serialize data to JSON string before storing
                json_data = json.dumps(dashboard_data)
                
                # Store data in Redis with TTL
                redis_client.setex(DASHBOARD_DATA_KEY, DATA_TTL_SECONDS, json_data)
                logging.info(f"Successfully updated '{DASHBOARD_DATA_KEY}' in Redis.")
            else:
                logging.warning("No data fetched in this cycle.")

        except Exception as e:
            logging.exception(f"An error occurred in the main loop: {e}")
            # Optional: implement backoff strategy here

        # Wait before the next fetch cycle
        logging.info(f"Sleeping for {FETCH_INTERVAL_SECONDS} seconds...")
        time.sleep(FETCH_INTERVAL_SECONDS)

if __name__ == "__main__":
    main() 