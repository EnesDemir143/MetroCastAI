"""
ONNX Export Script for ExcelFormer model.
Standalone script to export trained PyTorch models to ONNX format.
"""

import torch
import yaml
import os
import pathlib
import sys

# Proje kök dizinini ekle
ROOT_DIR = pathlib.Path(__file__).parent.parent.parent
sys.path.insert(0, str(pathlib.Path(__file__).parent))

from model import ExcelFormer

CONFIG_PATH = os.path.join(ROOT_DIR, 'config.yaml')


def load_config():
    """Load configuration from YAML file."""
    with open(CONFIG_PATH, 'r') as f:
        return yaml.safe_load(f)


def export_to_onnx(checkpoint_path: str, onnx_path: str, config: dict):
    """
    Export a trained PyTorch model to ONNX format.
    
    Args:
        checkpoint_path: Path to PyTorch checkpoint (.pt)
        onnx_path: Output path for ONNX model (.onnx)
        config: Configuration dict
    """
    device = torch.device("cpu")  # Export için CPU yeterli ve güvenli
    
    # Model Config
    model_config = config['model']
    training_config = config['training']
    features_config = config['features']
    
    # Feature dimensions
    num_weather_inputs = len(features_config['inputs']) - 1  # -1 for weather_code
    num_time_features = 6  # hour, day, month sin/cos
    num_continuous_features = num_weather_inputs + num_time_features
    
    # Create model
    model = ExcelFormer(
        num_continuous_features=num_continuous_features,
        num_weather_codes=model_config['num_weather_codes'],
        weather_code_embed_dim=model_config['weather_code_embed_dim'],
        d_model=model_config['d_model'],
        n_heads=model_config['n_heads'],
        n_layers=model_config['n_layers'],
        d_ff=model_config['d_ff'],
        seq_len=training_config['seq_len'],
        pred_len=training_config['pred_len'],
        dropout=model_config.get('dropout', 0.1)
    )
    
    # Load weights
    checkpoint = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    print(f"✓ Model loaded from {checkpoint_path}")
    
    # Dummy Input: (batch_size, seq_len, num_continuous_features + 1)
    # +1 for weather_code as last column
    total_input_cols = num_continuous_features + 1
    dummy_input = torch.randn(1, training_config['seq_len'], total_input_cols)
    
    # Export to ONNX
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=18,  # LayerNormalization için 18+ gerekli
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    print(f"✓ ONNX export başarılı: {onnx_path}")


def main():
    """Export best_model and final_model to ONNX."""
    config = load_config()
    
    models_dir = os.path.join(ROOT_DIR, 'models')
    
    # Export best model
    best_pt = os.path.join(models_dir, 'best_model.pt')
    best_onnx = os.path.join(models_dir, 'best_model.onnx')
    
    if os.path.exists(best_pt):
        export_to_onnx(best_pt, best_onnx, config)
    else:
        print(f"⚠ {best_pt} bulunamadı, atlanıyor...")
    
    # Export final model
    final_pt = os.path.join(models_dir, 'final_model.pt')
    final_onnx = os.path.join(models_dir, 'final_model.onnx')
    
    if os.path.exists(final_pt):
        export_to_onnx(final_pt, final_onnx, config)
    else:
        print(f"⚠ {final_pt} bulunamadı, atlanıyor...")
    
    print("\n✓ ONNX export tamamlandı!")


if __name__ == "__main__":
    main()