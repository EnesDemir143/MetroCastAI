import requests
import pandas as pd
from datetime import datetime, timedelta
import os
import sys
import pathlib
import yaml

# Add root directory to path for imports
root_dir = pathlib.Path(__file__).parent.parent
sys.path.append(str(root_dir))

from src.utils.logger import setup_logger
from src.utils.s3_client import upload_to_s3

# Load Config
CONFIG_PATH = os.path.join(root_dir, 'config.yaml')
with open(CONFIG_PATH, 'r') as f:
    config = yaml.safe_load(f)

# Initialize Logger
logger = setup_logger('update_data', 'logs/update_data.log')

# Constants from Config
LAT = config['location']['latitude']
LON = config['location']['longitude']
TIME_ZONE = config['location']['timezone']
FILE_PATH = config['data']['raw_file_path']
BUCKET_NAME = config['data']['bucket_name']
HOURLY_PARAMS = config['features']['inputs']

def main():
    logger.info("Starting data update process...")

    if not os.path.exists(FILE_PATH):
        logger.error(f"File not found at {FILE_PATH}. Please run fetch_data.py first.")
        return

    try:
        # Load existing data
        logger.info(f"Loading existing data from {FILE_PATH}...")
        df = pd.read_csv(FILE_PATH)
        
        # Ensure 'time' column is datetime
        df['time'] = pd.to_datetime(df['time'])
        
        # Find the last recorded date
        last_date = df['time'].max()
        logger.info(f"Last recorded timestamp: {last_date}")

        # Calculate start date for new data (next hour)
        start_date_new = last_date + timedelta(hours=1)
        end_date_new = datetime.now()

        # Check if update is needed
        if start_date_new >= end_date_new:
            logger.info("Data is already up to date.")
            return

        # Format dates for API (YYYY-MM-DD)
        # Open-Meteo accepts date range, we might fetch a bit more overlap but we will filter
        start_date_str = start_date_new.strftime("%Y-%m-%d")
        end_date_str = end_date_new.strftime("%Y-%m-%d")

        logger.info(f"Fetching new data from {start_date_str} to {end_date_str}...")

        url = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude": LAT,
            "longitude": LON,
            "start_date": start_date_str,
            "end_date": end_date_str,
            "hourly": HOURLY_PARAMS,
            "timezone": TIME_ZONE
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        new_data = response.json()

        # Create DataFrame for new data
        df_new = pd.DataFrame(new_data['hourly'])
        df_new['time'] = pd.to_datetime(df_new['time'])

        # Filter new data to strictly follow the last recorded timestamp
        df_new = df_new[df_new['time'] > last_date]

        if df_new.empty:
            logger.info("No new data points found after filtering.")
            return

        logger.info(f"Found {len(df_new)} new data points.")

        # Append new data
        df_updated = pd.concat([df, df_new], ignore_index=True)

        # Save updated file
        df_updated.to_csv(FILE_PATH, index=False)
        logger.info(f"Updated data saved to {FILE_PATH}. Total rows: {len(df_updated)}")

        # Upload to S3
        logger.info(f"Uploading updated file to S3 bucket: {BUCKET_NAME}...")
        success = upload_to_s3(FILE_PATH, bucket_name=BUCKET_NAME)

        if success:
            logger.info("S3 Upload Successful.")
        else:
            logger.error("S3 Upload Failed.")

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise e

if __name__ == "__main__":
    main()
