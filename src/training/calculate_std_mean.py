import pandas as pd
import numpy as np
import yaml
import os
import pathlib

root_dir = pathlib.Path(__file__).parent.parent.parent
CONFIG_PATH = os.path.join(root_dir, 'config.yaml')
with open(CONFIG_PATH, 'r') as f:
    config = yaml.safe_load(f)

def preprocess_and_split():
    df = pd.read_csv(config['data']['raw_file_path'])
    df['time'] = pd.to_datetime(df['time'])
    
    df['hour_sin'] = np.sin(2 * np.pi * df['time'].dt.hour / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['time'].dt.hour / 24)
    df['day_sin'] = np.sin(2 * np.pi * df['time'].dt.day / 365)
    df['day_cos'] = np.cos(2 * np.pi * df['time'].dt.day / 365)
    df['month_sin'] = np.sin(2 * np.pi * (df['time'].dt.month - 1) / 12)
    df['month_cos'] = np.cos(2 * np.pi * (df['time'].dt.month - 1) / 12)
    
    target_col = config['features']['target']
    # Exclude weather_code from normalization (it's categorical)
    exclude_from_norm = ['time', 'weather_code']
    input_cols = [c for c in df.columns if c not in exclude_from_norm]
    
    # Keep weather_code separately (not normalized)
    all_cols = input_cols + ['weather_code'] if 'weather_code' in df.columns else input_cols
    
    total_len = len(df)
    train_ratio = config['training']['split_ratio']['train'] 
    val_ratio = config['training']['split_ratio'].get('val', 0.10)
    
    train_end = int(total_len * train_ratio)
    val_end = train_end + int(total_len * val_ratio)
    
    train_df = df.iloc[:train_end]
    val_df = df.iloc[train_end:val_end]
    test_df = df.iloc[val_end:]
    
    mean = train_df[input_cols].mean().values
    std = train_df[input_cols].std().values
    std[std == 0] = 1.0 
    
    stats = {
        'mean': mean, 
        'std': std, 
        'input_cols': input_cols,  # Columns that are normalized
        'all_cols': all_cols,       # All columns including weather_code
        'exclude_from_norm': ['weather_code']  # Columns not normalized
    }
    np.save(os.path.join(root_dir, 'data/processed/statistics.npy'), stats)
    
    print(f"Split Tamamlandı: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")
    print(f"Normalize edilen sütunlar: {len(input_cols)}")
    print(f"Normalize edilmeyen: weather_code")
    return train_df, val_df, test_df

if __name__ == "__main__":
    preprocess_and_split()

