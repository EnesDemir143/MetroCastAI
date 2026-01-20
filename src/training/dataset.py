import torch
from torch.utils.data import Dataset
import os
import pandas as pd

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
        df['month_sin'] = np.sin(2 * np.pi * (df['time'].dt.month - 1) / 12)
        df['month_cos'] = np.cos(2 * np.pi * (df['time'].dt.month - 1) / 12)
        
        stats = np.load(stats_path, allow_pickle=True).item()
        mean = stats['mean']
        std = stats['std']
        input_cols = stats['input_cols']
        
        # Ensure column order matches statistics
        # Note: input_cols already contains target_col because of the change in stats script
        df = df[input_cols]
            
        self.data = torch.tensor(df.values, dtype=torch.float32)
        
        try:
            self.target_idx = df.columns.get_loc(target_col)
            normalized_data = (self.data - mean) / std

            self.data = torch.tensor(normalized_data, dtype=torch.float32)
        except KeyError:
            raise ValueError(f"Target column '{target_col}' not found in dataset columns: {df.columns.tolist()}")

    def __len__(self):
        return len(self.data) - self.seq_len - self.pred_len + 1

    def __getitem__(self, idx):
        x = self.data[idx : idx + self.seq_len]
        
        y = self.data[idx + self.seq_len : idx + self.seq_len + self.pred_len, self.target_idx]
        
        return x, y
