import requests
import pandas as pd
from datetime import datetime

LAT = 41.0082
LON = 28.9784
START_DATE = "2006-01-01" 
END_DATE = datetime.now().strftime("%Y-%m-%d")

print(f"Data Fetching ({START_DATE} - {END_DATE})...")
print("This may take 10-20 seconds due to the amount of data, please wait.")

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
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()

    df = pd.DataFrame(data['hourly'])

    filename = "data/raw/istanbul_weather.csv"
    df.to_csv(filename, index=False)

    print("Process completed.")
    print(f"File: {filename}")
    print(f"Total Columns: {len(df.columns)}")
    print("-" * 30)
    print("This dataset will enable the ExcelFormer model to learn atmospheric movements.")

except Exception as e:
    print(f"Error: {e}")