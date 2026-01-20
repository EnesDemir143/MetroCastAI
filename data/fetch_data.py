import requests
import pandas as pd
from datetime import datetime
import os
import sys
import pathlib

root_dir = pathlib.Path(__file__).parent.parent
sys.path.append(str(root_dir))

from src.utils.logger import setup_logger
from src.utils.s3_client import upload_to_s3

# Setup logger
logger = setup_logger('fetch_data', 'logs/fetch_data.log')

LAT = 41.0082
LON = 28.9784
START_DATE = "2006-01-01" 
END_DATE = datetime.now().strftime("%Y-%m-%d")
FILE_PATH=r"data/raw/istanbul_weather.csv"
BUCKET_NAME = "metrocast-ai-storage"

def main():
    logger.info(f"Data Fetching ({START_DATE} - {END_DATE})...")
    logger.info("This may take 10-20 seconds due to the amount of data if not already downloaded, please wait.")

    url = "https://archive-api.open-meteo.com/v1/archive"

    params = {
        "latitude": LAT,
        "longitude": LON,
        "start_date": START_DATE,
        "end_date": END_DATE,
        "hourly": [
            # -- Fundamental Data --
            "temperature_2m",
            "relative_humidity_2m",
            "dew_point_2m",          
            "apparent_temperature",  
            "pressure_msl",          
            "surface_pressure",
            
            # -- Precipitation Data --
            "precipitation",
            "rain",                  
            "snowfall",              
            "weather_code",          
            
            # -- Cloud and Sun Data --
            "cloud_cover",
            "cloud_cover_low",       
            "cloud_cover_mid",       
            "cloud_cover_high",      
            "shortwave_radiation",   
            "diffuse_radiation",     
            
            # -- Wind Data --
            "wind_speed_10m",
            "wind_direction_10m",    
            "wind_gusts_10m",        
            "wind_speed_100m",       
            "wind_direction_100m",   
            
            # -- Soil Data --
            "soil_temperature_0cm",       
            "soil_temperature_18cm",      
            "soil_moisture_0_to_7cm",     
            "et0_fao_evapotranspiration",
            
            # -- Atmospheric Data --
            "temperature_850hPa",           
            "temperature_500hPa",           
            "geopotential_height_500hPa",   
            "relative_humidity_850hPa",     
            "wind_speed_850hPa",            
            "wind_direction_850hPa"         
        ],
        "timezone": "auto"
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