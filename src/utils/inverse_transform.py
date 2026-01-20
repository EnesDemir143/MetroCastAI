import numpy as np
import yaml
import os
import pathlib

def load_stats(stats_path):
    if not os.path.exists(stats_path):
        raise FileNotFoundError(f"Statistics file not found at {stats_path}")
    return np.load(stats_path, allow_pickle=True).item()

def denormalize_target(predictions, config_path, stats_path=None):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    target_col = config['features']['target']
    
    if stats_path is None:
        root_dir = pathlib.Path(config_path).parent
        stats_path = os.path.join(root_dir, 'data', 'processed', 'statistics.npy')
    
    stats = load_stats(stats_path)
    means = stats['mean']
    stds = stats['std']
    input_cols = stats['input_cols']
    
    try:
        target_idx = np.where(input_cols == target_col)[0][0]
    except (IndexError, ValueError):
        raise ValueError(f"Target column '{target_col}' not found in statistics input_cols: {input_cols}")
    
    target_mean = means[target_idx]
    target_std = stds[target_idx]
    
    if hasattr(predictions, 'cpu'):
        predictions = predictions.detach().cpu().numpy()
    elif hasattr(predictions, 'numpy'):
        predictions = predictions.numpy()
        
    denormalized = predictions * target_std + target_mean
    
    return denormalized
