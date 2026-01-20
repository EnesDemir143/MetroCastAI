"""
Training script for ExcelFormer weather forecasting model.
Integrates with Weights & Biases (wandb) for experiment tracking.

Features:
- Chronological train/val/test split
- Validation-based early stopping and checkpointing
- MAE/RMSE metrics in both normalized and real (Celsius) scales
- Inverse transform for predictions
- MPS memory cleanup for Mac M2
"""

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import wandb
import yaml
import os
import sys
import pathlib
import numpy as np
from datetime import datetime
from tqdm import tqdm
from typing import Tuple, Dict, Optional

# Add parent directory to path for imports
ROOT_DIR = pathlib.Path(__file__).parent.parent.parent
sys.path.insert(0, str(pathlib.Path(__file__).parent))

from model import ExcelFormer
from dataset import WeatherDataset

CONFIG_PATH = os.path.join(ROOT_DIR, 'config.yaml')


def load_config() -> dict:
    """Load configuration from YAML file."""
    with open(CONFIG_PATH, 'r') as f:
        return yaml.safe_load(f)


def set_seed(seed: int):
    """Set random seed for reproducibility."""
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def get_device() -> torch.device:
    """Get the best available device."""
    if torch.cuda.is_available():
        return torch.device('cuda')
    elif torch.backends.mps.is_available():
        return torch.device('mps')
    return torch.device('cpu')


def create_dataloaders(config: dict) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """
    Create train, validation, and test dataloaders with chronological splitting.
    
    Returns:
        Tuple of (train_loader, val_loader, test_loader)
    """
    data_path = os.path.join(ROOT_DIR, config['data']['raw_file_path'])
    stats_path = os.path.join(ROOT_DIR, 'data/processed/statistics.npy')
    
    seq_len = config['training']['seq_len']
    pred_len = config['training']['pred_len']
    batch_size = config['training']['batch_size']
    target_col = config['features']['target']
    split_ratio = config['training']['split_ratio']
    
    # Create datasets with chronological splits
    train_dataset = WeatherDataset(
        file_path=data_path,
        stats_path=stats_path,
        seq_len=seq_len,
        pred_len=pred_len,
        target_col=target_col,
        mode='train',
        split_ratio=split_ratio
    )
    
    val_dataset = WeatherDataset(
        file_path=data_path,
        stats_path=stats_path,
        seq_len=seq_len,
        pred_len=pred_len,
        target_col=target_col,
        mode='val',
        split_ratio=split_ratio
    )
    
    test_dataset = WeatherDataset(
        file_path=data_path,
        stats_path=stats_path,
        seq_len=seq_len,
        pred_len=pred_len,
        target_col=target_col,
        mode='test',
        split_ratio=split_ratio
    )
    
    # Create dataloaders (no shuffle for val/test to maintain temporal order)
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,  # Shuffle only training data
        num_workers=0,
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
        pin_memory=True
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
        pin_memory=True
    )
    
    return train_loader, val_loader, test_loader


def create_model(config: dict, device: torch.device) -> ExcelFormer:
    """Create ExcelFormer model from config."""
    model_config = config['model']
    training_config = config['training']
    features_config = config['features']
    
    # Calculate continuous features (excluding weather_code)
    num_weather_inputs = len(features_config['inputs']) - 1  # -1 for weather_code
    num_time_features = 6  # hour, day, month sin/cos
    num_continuous_features = num_weather_inputs + num_time_features
    
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
        dropout=model_config['dropout']
    )
    
    return model.to(device)


def create_optimizer(model: nn.Module, config: dict) -> torch.optim.Optimizer:
    """Create optimizer."""
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=config['training']['learning_rate'],
        weight_decay=config['training']['weight_decay']
    )
    return optimizer


def create_scheduler(optimizer, config: dict):
    """Create learning rate scheduler."""
    scheduler_config = config['training']['scheduler']
    scheduler_type = scheduler_config['type']
    min_lr = scheduler_config['min_lr']
    
    if scheduler_type == 'cosine':
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            optimizer,
            T_max=config['training']['epochs'],
            eta_min=min_lr
        )
    elif scheduler_type == 'step':
        scheduler = torch.optim.lr_scheduler.StepLR(
            optimizer,
            step_size=30,
            gamma=0.1
        )
    elif scheduler_type == 'plateau':
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer,
            mode='min',
            factor=0.5,
            patience=5,
            min_lr=min_lr
        )
    else:
        raise ValueError(f"Unknown scheduler type: {scheduler_type}")
    
    return scheduler


class EarlyStopping:
    """Early stopping based on validation loss."""
    
    def __init__(self, patience: int = 10, min_delta: float = 0.0001):
        self.patience = patience
        self.min_delta = min_delta
        self.counter = 0
        self.best_loss = float('inf')
        self.should_stop = False
    
    def __call__(self, val_loss: float) -> bool:
        if val_loss < self.best_loss - self.min_delta:
            self.best_loss = val_loss
            self.counter = 0
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.should_stop = True
        return self.should_stop


def compute_metrics(
    preds: torch.Tensor, 
    targets: torch.Tensor,
    target_mean: float = 0.0,
    target_std: float = 1.0
) -> Dict[str, float]:
    """
    Compute MAE and RMSE in both normalized and real scales.
    
    Args:
        preds: Predictions (normalized)
        targets: Ground truth (normalized)
        target_mean: Mean of target for inverse transform
        target_std: Std of target for inverse transform
        
    Returns:
        Dict with mae, rmse (normalized) and mae_celsius, rmse_celsius (real)
    """
    # Normalized scale metrics
    mae = torch.mean(torch.abs(preds - targets)).item()
    mse = torch.mean((preds - targets) ** 2).item()
    rmse = np.sqrt(mse)
    
    # Real scale (Celsius) metrics
    preds_real = preds * target_std + target_mean
    targets_real = targets * target_std + target_mean
    
    mae_celsius = torch.mean(torch.abs(preds_real - targets_real)).item()
    mse_celsius = torch.mean((preds_real - targets_real) ** 2).item()
    rmse_celsius = np.sqrt(mse_celsius)
    
    return {
        'mae': mae,
        'rmse': rmse,
        'mae_celsius': mae_celsius,
        'rmse_celsius': rmse_celsius
    }


def train_epoch(
    model: nn.Module,
    train_loader: DataLoader,
    optimizer: torch.optim.Optimizer,
    criterion: nn.Module,
    device: torch.device,
    config: dict,
    epoch: int,
    target_mean: float,
    target_std: float
) -> Dict[str, float]:
    """Train for one epoch."""
    model.train()
    total_loss = 0.0
    all_preds = []
    all_targets = []
    
    gradient_clip = config['training']['gradient_clip']
    log_freq = config['wandb']['log_freq']
    
    pbar = tqdm(train_loader, desc=f"Train Epoch {epoch+1}", leave=False)
    
    for batch_idx, (x, y) in enumerate(pbar):
        x = x.to(device)
        y = y.to(device)
        
        optimizer.zero_grad()
        
        # Forward pass
        output = model(x)
        output = output.squeeze(-1)  # (batch, pred_len)
        
        # Calculate loss
        loss = criterion(output, y)
        
        # Backward pass
        loss.backward()
        
        # Gradient clipping
        if gradient_clip > 0:
            torch.nn.utils.clip_grad_norm_(model.parameters(), gradient_clip)
        
        optimizer.step()
        
        total_loss += loss.item()
        all_preds.append(output.detach())
        all_targets.append(y.detach())
        
        # Update progress bar
        pbar.set_postfix({'loss': f'{loss.item():.4f}'})
        
        # Log batch metrics to wandb
        if config['wandb']['enabled'] and (batch_idx + 1) % log_freq == 0:
            wandb.log({
                'train/batch_loss': loss.item(),
                'train/learning_rate': optimizer.param_groups[0]['lr'],
            })
    
    # Compute epoch metrics
    all_preds = torch.cat(all_preds, dim=0)
    all_targets = torch.cat(all_targets, dim=0)
    
    metrics = compute_metrics(all_preds, all_targets, target_mean, target_std)
    metrics['loss'] = total_loss / len(train_loader)
    
    return metrics


def validate(
    model: nn.Module,
    val_loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
    epoch: int,
    target_mean: float,
    target_std: float
) -> Dict[str, float]:
    """Validate the model."""
    model.eval()
    total_loss = 0.0
    all_preds = []
    all_targets = []
    
    pbar = tqdm(val_loader, desc=f"Val Epoch {epoch+1}", leave=False)
    
    with torch.no_grad():
        for x, y in pbar:
            x = x.to(device)
            y = y.to(device)
            
            output = model(x)
            output = output.squeeze(-1)
            
            loss = criterion(output, y)
            total_loss += loss.item()
            
            all_preds.append(output)
            all_targets.append(y)
            
            pbar.set_postfix({'loss': f'{loss.item():.4f}'})
    
    # Compute epoch metrics
    all_preds = torch.cat(all_preds, dim=0)
    all_targets = torch.cat(all_targets, dim=0)
    
    metrics = compute_metrics(all_preds, all_targets, target_mean, target_std)
    metrics['loss'] = total_loss / len(val_loader)
    
    return metrics


def save_checkpoint(
    model: nn.Module, 
    optimizer, 
    epoch: int, 
    val_loss: float, 
    path: str,
    config: dict
):
    """Save model checkpoint."""
    checkpoint = {
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'val_loss': val_loss,
        'config': config
    }
    os.makedirs(os.path.dirname(path), exist_ok=True)
    torch.save(checkpoint, path)


def predict(
    model: nn.Module,
    data_loader: DataLoader,
    device: torch.device,
    target_mean: float,
    target_std: float
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Make predictions and return both normalized and Celsius values.
    
    Args:
        model: Trained model
        data_loader: DataLoader for prediction
        device: Torch device
        target_mean: Mean of target for inverse transform
        target_std: Std of target for inverse transform
        
    Returns:
        Tuple of (predictions_celsius, targets_celsius)
    """
    model.eval()
    all_preds = []
    all_targets = []
    
    with torch.no_grad():
        for x, y in tqdm(data_loader, desc="Predicting"):
            x = x.to(device)
            output = model(x)
            output = output.squeeze(-1)
            
            all_preds.append(output.cpu())
            all_targets.append(y)
    
    # Concatenate all predictions
    preds_normalized = torch.cat(all_preds, dim=0).numpy()
    targets_normalized = torch.cat(all_targets, dim=0).numpy()
    
    # Inverse transform to Celsius
    preds_celsius = preds_normalized * target_std + target_mean
    targets_celsius = targets_normalized * target_std + target_mean
    
    return preds_celsius, targets_celsius


def cleanup_memory(device: torch.device):
    """Clean up GPU/MPS memory."""
    if device.type == 'cuda':
        torch.cuda.empty_cache()
    elif device.type == 'mps':
        torch.mps.empty_cache()


def train(config: dict):
    """Main training function."""
    # Set seed
    set_seed(config['training']['seed'])
    
    # Get device
    device = get_device()
    print(f"Using device: {device}")
    
    # Initialize wandb
    if config['wandb']['enabled']:
        run_name = config['wandb']['run_name']
        if run_name is None:
            run_name = f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        wandb.init(
            project=config['wandb']['project'],
            entity=config['wandb']['entity'],
            name=run_name,
            tags=config['wandb']['tags'],
            config={
                'training': config['training'],
                'model': config['model'],
                'features': config['features']
            }
        )
    
    # Create dataloaders
    print("Loading data...")
    train_loader, val_loader, test_loader = create_dataloaders(config)
    print(f"Train batches: {len(train_loader)}, Val batches: {len(val_loader)}, Test batches: {len(test_loader)}")
    
    # Get target stats for inverse transform
    stats = np.load(os.path.join(ROOT_DIR, 'data/processed/statistics.npy'), allow_pickle=True).item()
    input_cols = list(stats['input_cols'])
    target_col = config['features']['target']
    target_idx = input_cols.index(target_col)
    target_mean = stats['mean'][target_idx]
    target_std = stats['std'][target_idx]
    print(f"Target stats - Mean: {target_mean:.2f}°C, Std: {target_std:.2f}")
    
    # Create model
    print("Creating model...")
    model = create_model(config, device)
    print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Log model to wandb
    if config['wandb']['enabled']:
        wandb.watch(model, log='gradients', log_freq=100)
    
    # Create optimizer and scheduler
    optimizer = create_optimizer(model, config)
    scheduler = create_scheduler(optimizer, config)
    
    # Loss function
    criterion = nn.MSELoss()
    
    # Early stopping (based on validation loss)
    early_stopping = None
    if config['training']['early_stopping']['enabled']:
        early_stopping = EarlyStopping(
            patience=config['training']['early_stopping']['patience'],
            min_delta=config['training']['early_stopping']['min_delta']
        )
    
    # Training loop
    best_val_loss = float('inf')
    epochs = config['training']['epochs']
    
    print(f"\nStarting training for {epochs} epochs...")
    print("-" * 60)
    
    for epoch in range(epochs):
        # Train
        train_metrics = train_epoch(
            model, train_loader, optimizer, criterion,
            device, config, epoch, target_mean, target_std
        )
        
        # Validate
        val_metrics = validate(
            model, val_loader, criterion,
            device, epoch, target_mean, target_std
        )
        
        # Update scheduler (based on validation loss for ReduceLROnPlateau)
        if isinstance(scheduler, torch.optim.lr_scheduler.ReduceLROnPlateau):
            scheduler.step(val_metrics['loss'])
        else:
            scheduler.step()
        
        # Log epoch metrics
        current_lr = optimizer.param_groups[0]['lr']
        print(f"Epoch {epoch+1}/{epochs} | "
              f"Train Loss: {train_metrics['loss']:.4f} | "
              f"Val Loss: {val_metrics['loss']:.4f} | "
              f"Val MAE: {val_metrics['mae_celsius']:.2f}°C | "
              f"LR: {current_lr:.6f}")
        
        if config['wandb']['enabled']:
            wandb.log({
                'epoch': epoch + 1,
                'train/loss': train_metrics['loss'],
                'train/mae': train_metrics['mae'],
                'train/rmse': train_metrics['rmse'],
                'train/mae_celsius': train_metrics['mae_celsius'],
                'train/rmse_celsius': train_metrics['rmse_celsius'],
                'val/loss': val_metrics['loss'],
                'val/mae': val_metrics['mae'],
                'val/rmse': val_metrics['rmse'],
                'val/mae_celsius': val_metrics['mae_celsius'],
                'val/rmse_celsius': val_metrics['rmse_celsius'],
                'learning_rate': current_lr
            })
        
        # Save best model (based on validation loss!)
        if val_metrics['loss'] < best_val_loss:
            best_val_loss = val_metrics['loss']
            save_path = os.path.join(ROOT_DIR, 'models', 'best_model.pt')
            save_checkpoint(model, optimizer, epoch, val_metrics['loss'], save_path, config)
            print(f"  ✓ New best model saved! Val Loss: {best_val_loss:.4f}")
            
            if config['wandb']['enabled']:
                wandb.run.summary['best_val_loss'] = best_val_loss
                wandb.run.summary['best_val_mae_celsius'] = val_metrics['mae_celsius']
                wandb.run.summary['best_epoch'] = epoch + 1
        
        # Early stopping (based on validation loss!)
        if early_stopping is not None:
            if early_stopping(val_metrics['loss']):
                print(f"\n⚠ Early stopping triggered at epoch {epoch+1}")
                break
        
        # MPS memory cleanup (important for Mac M2)
        cleanup_memory(device)
    
    # Save final model
    final_path = os.path.join(ROOT_DIR, 'models', 'final_model.pt')
    save_checkpoint(model, optimizer, epochs, val_metrics['loss'], final_path, config)
    
    # Test set evaluation
    print("\n" + "-" * 60)
    print("Evaluating on test set...")
    test_preds, test_targets = predict(model, test_loader, device, target_mean, target_std)
    
    # Compute test metrics
    test_mae = np.mean(np.abs(test_preds - test_targets))
    test_rmse = np.sqrt(np.mean((test_preds - test_targets) ** 2))
    
    print(f"Test MAE: {test_mae:.2f}°C")
    print(f"Test RMSE: {test_rmse:.2f}°C")
    
    if config['wandb']['enabled']:
        wandb.run.summary['test_mae_celsius'] = test_mae
        wandb.run.summary['test_rmse_celsius'] = test_rmse
        wandb.finish()
    
    print("-" * 60)
    print(f"Training completed! Best Val Loss: {best_val_loss:.4f}")
    
    return model


def load_model_for_inference(checkpoint_path: str, config: dict, device: torch.device) -> ExcelFormer:
    """
    Load a trained model for inference.
    
    Args:
        checkpoint_path: Path to model checkpoint
        config: Configuration dict
        device: Torch device
        
    Returns:
        Loaded model in eval mode
    """
    model = create_model(config, device)
    checkpoint = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    return model


if __name__ == "__main__":
    config = load_config()
    train(config)
