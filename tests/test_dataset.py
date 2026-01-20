
import sys
import os
import torch
import pathlib

# Add src to path
root_dir = pathlib.Path(__file__).parent.parent
sys.path.append(str(root_dir))

from src.training.dataset import WeatherDataset

def test_weather_dataset():
    # Use real data path
    file_path = "data/raw/istanbul_weather.csv"
    
    if not os.path.exists(file_path):
        print(f"Skipping test: File {file_path} not found.")
        return

    # Initialize dataset
    seq_len = 24
    pred_len = 24
    target_col = 'temperature_2m'
    
    print("Initializing WeatherDataset...")
    dataset = WeatherDataset(file_path, seq_len=seq_len, pred_len=pred_len, target_col=target_col)
    
    print(f"Dataset Length: {len(dataset)}")
    
    # Test first item
    x, y = dataset[0]
    
    print(f"Input Shape (x): {x.shape}")
    print(f"Target Shape (y): {y.shape}")
    print(f"Input Type: {x.dtype}")
    print(f"Target Type: {y.dtype}")
    
    assert x.shape[0] == seq_len, f"Expected input seq_len {seq_len}, got {x.shape[0]}"
    assert y.shape[0] == pred_len, f"Expected target pred_len {pred_len}, got {y.shape[0]}"
    assert isinstance(x, torch.Tensor), "Input x should be a torch.Tensor"
    assert isinstance(y, torch.Tensor), "Target y should be a torch.Tensor"
    
    print("\nTest Passed: Shapes and Types are correct.")

if __name__ == "__main__":
    test_weather_dataset()
