import torch
from torch.utils.data import Dataset
import os
import pandas as pd
import numpy as np

class WeatherDataset(Dataset):
    def __init__(self, file_path, stats_path, seq_len=24, pred_len=24, target_col='temperature_2m'):
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at {file_path}")
            
        self.seq_len = seq_len
        self.pred_len = pred_len
        
        df = pd.read_csv(file_path)
        df['time'] = pd.to_datetime(df['time'])

        df['hour_sin'] = np.sin(2 * np.pi * df['time'].dt.hour / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['time'].dt.hour / 24)
        df['day_sin'] = np.sin(2 * np.pi * df['time'].dt.day / 365)
        df['day_cos'] = np.cos(2 * np.pi * df['time'].dt.day / 365)
        df['month_sin'] = np.sin(2 * np.pi * (df['time'].dt.month - 1) / 12)
        df['month_cos'] = np.cos(2 * np.pi * (df['time'].dt.month - 1) / 12)
        
        stats = np.load(stats_path, allow_pickle=True).item()
        mean = stats['mean']
        std = stats['std']
        input_cols = stats['input_cols']
        all_cols = stats.get('all_cols', input_cols)
        
        has_weather_code = 'weather_code' in df.columns
        weather_code_data = None
        if has_weather_code:
            weather_code_data = df['weather_code'].values
        
        df_norm = df[input_cols].copy()
        normalized_values = (df_norm.values - mean) / std
        
        if has_weather_code:
            self.data = torch.tensor(
                np.column_stack([normalized_values, weather_code_data]), 
                dtype=torch.float32
            )
            all_cols_list = list(input_cols) + ['weather_code']
        else:
            self.data = torch.tensor(normalized_values, dtype=torch.float32)
            all_cols_list = list(input_cols)
            
        try:
            self.target_idx = all_cols_list.index(target_col)
        except ValueError:
            raise ValueError(f"Target column '{target_col}' not found in dataset columns: {all_cols_list}")

    def __len__(self):
        return len(self.data) - self.seq_len - self.pred_len + 1

    def __getitem__(self, idx):
        x = self.data[idx : idx + self.seq_len]
        
        y = self.data[idx + self.seq_len : idx + self.seq_len + self.pred_len, self.target_idx]
        
        return x, y
