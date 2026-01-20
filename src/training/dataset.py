"""
WeatherDataset for time-series forecasting.
Supports chronological train/val/test splitting.
"""

import torch
from torch.utils.data import Dataset
import os
import pandas as pd
import numpy as np
from typing import Literal


class WeatherDataset(Dataset):
    """
    Weather dataset for ExcelFormer training.
    
    Args:
        file_path: Path to raw CSV data
        stats_path: Path to statistics.npy file
        seq_len: Input sequence length
        pred_len: Prediction length
        target_col: Target column name
        mode: Dataset mode ('train', 'val', 'test')
        split_ratio: Dict with train/val/test ratios (default: 80/10/10)
    """
    
    def __init__(
        self, 
        file_path: str, 
        stats_path: str, 
        seq_len: int = 24, 
        pred_len: int = 24, 
        target_col: str = 'temperature_2m',
        mode: Literal['train', 'val', 'test'] = 'train',
        split_ratio: dict = None
    ):
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at {file_path}")
        
        self.seq_len = seq_len
        self.pred_len = pred_len
        self.mode = mode
        
        # Default split ratio (chronological)
        if split_ratio is None:
            split_ratio = {'train': 0.80, 'val': 0.10, 'test': 0.10}
        
        # Load and preprocess data
        df = pd.read_csv(file_path)
        df['time'] = pd.to_datetime(df['time'])
        
        # Add time features
        df['hour_sin'] = np.sin(2 * np.pi * df['time'].dt.hour / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['time'].dt.hour / 24)
        df['day_sin'] = np.sin(2 * np.pi * df['time'].dt.day / 365)
        df['day_cos'] = np.cos(2 * np.pi * df['time'].dt.day / 365)
        df['month_sin'] = np.sin(2 * np.pi * (df['time'].dt.month - 1) / 12)
        df['month_cos'] = np.cos(2 * np.pi * (df['time'].dt.month - 1) / 12)
        
        # Load statistics (computed from training data only)
        stats = np.load(stats_path, allow_pickle=True).item()
        self.mean = stats['mean']
        self.std = stats['std']
        input_cols = stats['input_cols']
        
        # Store stats for inverse transform
        self.stats = stats
        self.input_cols = input_cols
        
        # Get target column index before any processing
        all_cols_list = list(input_cols) + (['weather_code'] if 'weather_code' in df.columns else [])
        try:
            self.target_idx = all_cols_list.index(target_col)
        except ValueError:
            raise ValueError(f"Target column '{target_col}' not found in columns: {all_cols_list}")
        
        # Get target mean/std for inverse transform
        try:
            target_stat_idx = list(input_cols).index(target_col)
            self.target_mean = self.mean[target_stat_idx]
            self.target_std = self.std[target_stat_idx]
        except ValueError:
            self.target_mean = 0.0
            self.target_std = 1.0
        
        # Handle weather_code separately (not normalized)
        has_weather_code = 'weather_code' in df.columns
        weather_code_data = None
        if has_weather_code:
            weather_code_data = df['weather_code'].values
        
        # Normalize continuous features
        df_norm = df[input_cols].copy()
        normalized_values = (df_norm.values - self.mean) / self.std
        
        # Combine normalized features with weather_code
        if has_weather_code:
            full_data = np.column_stack([normalized_values, weather_code_data])
        else:
            full_data = normalized_values
        
        # Chronological split (NO random shuffling for time-series!)
        total_len = len(full_data)
        train_end = int(total_len * split_ratio['train'])
        val_end = train_end + int(total_len * split_ratio['val'])
        
        if mode == 'train':
            data_slice = full_data[:train_end]
        elif mode == 'val':
            data_slice = full_data[train_end:val_end]
        elif mode == 'test':
            data_slice = full_data[val_end:]
        else:
            raise ValueError(f"Invalid mode: {mode}. Must be 'train', 'val', or 'test'")
        
        self.data = torch.tensor(data_slice, dtype=torch.float32)
        
        print(f"[{mode.upper()}] Loaded {len(self.data)} samples "
              f"(indices {train_end if mode == 'val' else (val_end if mode == 'test' else 0)} - "
              f"{val_end if mode == 'val' else (total_len if mode == 'test' else train_end)})")

    def __len__(self):
        return max(0, len(self.data) - self.seq_len - self.pred_len + 1)

    def __getitem__(self, idx):
        x = self.data[idx : idx + self.seq_len]
        y = self.data[idx + self.seq_len : idx + self.seq_len + self.pred_len, self.target_idx]
        return x, y
    
    def inverse_transform_target(self, normalized_values: torch.Tensor) -> torch.Tensor:
        """
        Convert normalized target values back to original scale (Celsius).
        
        Args:
            normalized_values: Normalized target tensor
            
        Returns:
            Values in original scale (Celsius)
        """
        return normalized_values * self.target_std + self.target_mean
