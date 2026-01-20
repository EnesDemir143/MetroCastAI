import json
from datetime import datetime, timedelta, timezone

def generate_payload():
    base_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    records = []
    
    for i in range(24):
        t = base_time - timedelta(hours=23-i) # 24 hours history ending at current hour
        record = {
            "timestamp": t.isoformat(),
            "temperature_2m": 15.0 + (i % 5), # dummy variation
            "relative_humidity_2m": 60.0,
            "dew_point_2m": 10.0,
            "surface_pressure": 1013.0,
            "precipitation": 0.0,
            "cloud_cover": 0.0,
            "shortwave_radiation": 500.0 if 6 <= t.hour <= 18 else 0.0,
            "wind_speed_10m": 5.0,
            "wind_direction_10m": 180.0,
            "soil_temperature_0_to_7cm": 12.0,
            "weather_code": 1.0
        }
        records.append(record)
    
    payload = {"recent_history": records}
    
    with open("backend/test_payload.json", "w") as f:
        json.dump(payload, f, indent=2)
    
    print("Created backend/test_payload.json")

if __name__ == "__main__":
    generate_payload()
