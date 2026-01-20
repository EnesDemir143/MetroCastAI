import requests
import pandas as pd
from datetime import datetime
import os
import sys
import pathlib
import yaml

root_dir = pathlib.Path(__file__).parent.parent
sys.path.append(str(root_dir))

CONFIG_PATH = os.path.join(root_dir, 'config.yaml')

with open(CONFIG_PATH, 'r') as f:
    config = yaml.safe_load(f)

from src.utils.logger import setup_logger
from src.utils.s3_client import upload_to_s3

# Setup logger
logger = setup_logger('fetch_data', 'logs/fetch_data.log')

LAT = config['location']['latitude']
LON = config['location']['longitude']
TIME_ZONE=config['location']['timezone']
START_DATE = config['data']['start_date'] 
END_DATE = datetime.now().strftime("%Y-%m-%d")
FILE_PATH=config['data']['raw_file_path']
BUCKET_NAME = config['data']['bucket_name']

HOURLY_PARAMS = config['features']['inputs']

def main():
    logger.info(f"Data Fetching ({START_DATE} - {END_DATE})...")
    logger.info("This may take 10-20 seconds due to the amount of data if not already downloaded, please wait.")

    url = "https://archive-api.open-meteo.com/v1/archive"

    params = {
    "latitude": LAT,
    "longitude": LON,
    "start_date": START_DATE,
    "end_date": END_DATE,
    "hourly": HOURLY_PARAMS,
    "timezone": TIME_ZONE    
    }

    try:
        if os.path.exists(FILE_PATH):
            logger.info("File already exists. Skipping download.")
            df = pd.read_csv(FILE_PATH)
        else:
            # Ensure directory exists before saving
            os.makedirs(os.path.dirname(FILE_PATH), exist_ok=True)
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            df = pd.DataFrame(data['hourly'])
            df.to_csv(FILE_PATH, index=False)

        logger.info("Process completed.")
        logger.info(f"File: {FILE_PATH}")

    except Exception as e:
        logger.error(f"Error: {e}")

    try:
        logger.info(f"S3'e yükleme başlatılıyor: {BUCKET_NAME}")

        success = upload_to_s3(FILE_PATH, bucket_name=BUCKET_NAME)

        if success:
            logger.info("Upload Successful")
        else:
            raise Exception("Upload Failed")
    except Exception as e:
        logger.error(f"Error: {e}")

if __name__ == "__main__":
    main()