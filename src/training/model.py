"""
ExcelFormer Model for Time-Series Forecasting

ExcelFormer is a transformer-based architecture designed for time-series forecasting.
It uses attention mechanisms to capture temporal dependencies in the input sequence.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import math


class PositionalEncoding(nn.Module):
    """Positional encoding for transformer models."""
    
    def __init__(self, d_model: int, max_len: int = 5000, dropout: float = 0.1):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)
        
        # Create positional encoding matrix
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)  # (1, max_len, d_model)
        
        self.register_buffer('pe', pe)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Tensor of shape (batch_size, seq_len, d_model)
        Returns:
            Tensor with positional encoding added
        """
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


class ExcelFormerAttention(nn.Module):
    """Multi-head self-attention module for ExcelFormer."""
    
    def __init__(self, d_model: int, n_heads: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % n_heads == 0, "d_model must be divisible by n_heads"
        
        self.d_model = d_model
        self.n_heads = n_heads
        self.head_dim = d_model // n_heads
        
        self.q_proj = nn.Linear(d_model, d_model)
        self.k_proj = nn.Linear(d_model, d_model)
        self.v_proj = nn.Linear(d_model, d_model)
        self.out_proj = nn.Linear(d_model, d_model)
        
        self.dropout = nn.Dropout(dropout)
        self.scale = math.sqrt(self.head_dim)
    
    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        """
        Args:
            x: Input tensor of shape (batch_size, seq_len, d_model)
            mask: Optional attention mask
        Returns:
            Output tensor of shape (batch_size, seq_len, d_model)
        """
        batch_size, seq_len, _ = x.shape
        
        # Project to Q, K, V
        q = self.q_proj(x).view(batch_size, seq_len, self.n_heads, self.head_dim).transpose(1, 2)
        k = self.k_proj(x).view(batch_size, seq_len, self.n_heads, self.head_dim).transpose(1, 2)
        v = self.v_proj(x).view(batch_size, seq_len, self.n_heads, self.head_dim).transpose(1, 2)
        
        # Compute attention scores
        attn_scores = torch.matmul(q, k.transpose(-2, -1)) / self.scale
        
        if mask is not None:
            attn_scores = attn_scores.masked_fill(mask == 0, float('-inf'))
        
        attn_weights = F.softmax(attn_scores, dim=-1)
        attn_weights = self.dropout(attn_weights)
        
        # Apply attention to values
        attn_output = torch.matmul(attn_weights, v)
        attn_output = attn_output.transpose(1, 2).contiguous().view(batch_size, seq_len, self.d_model)
        
        return self.out_proj(attn_output)


class ExcelFormerBlock(nn.Module):
    """Single transformer block for ExcelFormer."""
    
    def __init__(self, d_model: int, n_heads: int, d_ff: int, dropout: float = 0.1):
        super().__init__()
        
        self.attention = ExcelFormerAttention(d_model, n_heads, dropout)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout)
        )
        
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        """
        Args:
            x: Input tensor of shape (batch_size, seq_len, d_model)
            mask: Optional attention mask
        Returns:
            Output tensor of shape (batch_size, seq_len, d_model)
        """
        # Self-attention with residual connection
        attn_output = self.attention(x, mask)
        x = self.norm1(x + self.dropout(attn_output))
        
        # Feed-forward with residual connection
        ffn_output = self.ffn(x)
        x = self.norm2(x + ffn_output)
        
        return x


class ExcelFormer(nn.Module):
    """
    ExcelFormer: Transformer-based model for time-series forecasting.
    
    This model takes a sequence of multivariate time-series data and predicts
    future values. It uses self-attention to capture temporal dependencies.
    
    Args:
        num_continuous_features: Number of continuous input features (weather + time, excluding weather_code)
        num_weather_codes: Number of unique weather codes for embedding (default: 100 for WMO codes 0-99)
        weather_code_embed_dim: Dimension of weather code embedding (default: 8)
        d_model: Model dimension (default: 128)
        n_heads: Number of attention heads (default: 8)
        n_layers: Number of transformer blocks (default: 4)
        d_ff: Feed-forward network dimension (default: 512)
        seq_len: Input sequence length (default: 24)
        pred_len: Prediction length (default: 24)
        dropout: Dropout probability (default: 0.1)
        
    Note:
        Input tensor format: [...continuous_features, weather_code]
        weather_code should be the LAST column as integer indices
    """
    
    def __init__(
        self,
        num_continuous_features: int = 16,  # 10 weather (excl. weather_code) + 6 time features
        num_weather_codes: int = 100,        # WMO codes range from 0-99
        weather_code_embed_dim: int = 8,     # Embedding dimension for weather code
        d_model: int = 128,
        n_heads: int = 8,
        n_layers: int = 4,
        d_ff: int = 512,
        seq_len: int = 24,
        pred_len: int = 24,
        dropout: float = 0.1
    ):
        super().__init__()
        
        # Feature dimensions
        self.num_continuous_features = num_continuous_features
        self.num_weather_codes = num_weather_codes
        self.weather_code_embed_dim = weather_code_embed_dim
        
        # Total input to transformer = continuous features + weather_code embedding
        self.total_input_dim = num_continuous_features + weather_code_embed_dim
        
        self.d_model = d_model
        self.seq_len = seq_len
        self.pred_len = pred_len
        
        # Weather code embedding layer (categorical -> learned vector)
        self.weather_code_embedding = nn.Embedding(
            num_embeddings=num_weather_codes,
            embedding_dim=weather_code_embed_dim
        )
        
        # Input embedding layer (continuous + weather_code_embed -> d_model)
        self.input_embedding = nn.Linear(self.total_input_dim, d_model)
        
        # Positional encoding
        self.pos_encoding = PositionalEncoding(d_model, max_len=seq_len + pred_len, dropout=dropout)
        
        # Transformer encoder blocks
        self.encoder_blocks = nn.ModuleList([
            ExcelFormerBlock(d_model, n_heads, d_ff, dropout)
            for _ in range(n_layers)
        ])
        
        # Output projection layers
        self.output_norm = nn.LayerNorm(d_model)
        self.output_projection = nn.Linear(d_model, 1)  # Predict single target (temperature)
        
        # Temporal projection to convert seq_len -> pred_len
        self.temporal_projection = nn.Linear(seq_len, pred_len)
        
        self._init_weights()
    
    def _init_weights(self):
        """Initialize model weights."""
        for p in self.parameters():
            if p.dim() > 1:
                nn.init.xavier_uniform_(p)
    
    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        """
        Forward pass of ExcelFormer.
        
        Args:
            x: Input tensor of shape (batch_size, seq_len, num_continuous_features + 1)
               Last column should be weather_code (integer indices)
            mask: Optional attention mask
            
        Returns:
            Predictions of shape (batch_size, pred_len, 1)
        """
        batch_size = x.shape[0]
        
        # Split continuous features and weather_code
        # weather_code is the last column
        continuous_features = x[:, :, :-1]  # (batch, seq_len, num_continuous_features)
        weather_codes = x[:, :, -1].long()   # (batch, seq_len) - integer indices
        
        # Get weather code embeddings
        weather_code_embed = self.weather_code_embedding(weather_codes)  # (batch, seq_len, embed_dim)
        
        # Concatenate continuous features with weather code embeddings
        combined = torch.cat([continuous_features, weather_code_embed], dim=-1)  # (batch, seq_len, total_input_dim)
        
        # Input embedding: -> (batch_size, seq_len, d_model)
        x = self.input_embedding(combined)
        
        # Add positional encoding
        x = self.pos_encoding(x)
        
        # Pass through encoder blocks
        for block in self.encoder_blocks:
            x = block(x, mask)
        
        # Output normalization
        x = self.output_norm(x)
        
        # Project to single output feature
        # (batch_size, seq_len, d_model) -> (batch_size, seq_len, 1)
        x = self.output_projection(x)
        
        # Temporal projection: (batch_size, seq_len, 1) -> (batch_size, pred_len, 1)
        x = x.transpose(1, 2)  # (batch_size, 1, seq_len)
        x = self.temporal_projection(x)  # (batch_size, 1, pred_len)
        x = x.transpose(1, 2)  # (batch_size, pred_len, 1)
        
        return x
    
    def get_num_params(self) -> int:
        """Returns the total number of parameters in the model."""
        return sum(p.numel() for p in self.parameters())
    
    def get_num_trainable_params(self) -> int:
        """Returns the number of trainable parameters in the model."""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)


def build_model_from_config(config: dict) -> ExcelFormer:
    """
    Build ExcelFormer model from configuration dictionary.
    
    Args:
        config: Configuration dictionary with training and feature settings
        
    Returns:
        Configured ExcelFormer model
    """
    # Number of weather inputs excluding weather_code + time features
    num_weather_inputs = len(config.get('features', {}).get('inputs', [])) - 1  # -1 for weather_code
    num_time_features = config.get('features', {}).get('num_time_features', 6)
    num_continuous_features = num_weather_inputs + num_time_features
    
    seq_len = config.get('training', {}).get('seq_len', 24)
    pred_len = config.get('training', {}).get('pred_len', 24)
    
    model = ExcelFormer(
        num_continuous_features=num_continuous_features if num_continuous_features > 0 else 16,
        num_weather_codes=100,  # WMO codes 0-99
        weather_code_embed_dim=8,
        seq_len=seq_len,
        pred_len=pred_len,
    )
    
    return model


if __name__ == "__main__":
    # Test the model
    batch_size = 32
    seq_len = 24
    pred_len = 24
    
    # Feature breakdown:
    # - 10 weather features (excluding weather_code)
    # - 6 time features (sin/cos for hour, day, month)
    # - 1 weather_code (last column, will be embedded)
    num_continuous_features = 16  # 10 weather + 6 time
    weather_code_embed_dim = 8
    
    model = ExcelFormer(
        num_continuous_features=num_continuous_features,
        num_weather_codes=100,
        weather_code_embed_dim=weather_code_embed_dim,
        seq_len=seq_len,
        pred_len=pred_len
    )
    
    # Total input features = continuous + 1 (weather_code as last column)
    total_input_cols = num_continuous_features + 1  # 17 columns
    
    # Create dummy input (last column is weather_code as integers 0-99)
    x_continuous = torch.randn(batch_size, seq_len, num_continuous_features)
    x_weather_code = torch.randint(0, 100, (batch_size, seq_len, 1)).float()
    x = torch.cat([x_continuous, x_weather_code], dim=-1)
    
    # Forward pass
    output = model(x)
    
    print(f"Continuous features: {num_continuous_features}")
    print(f"Weather code embedding dim: {weather_code_embed_dim}")
    print(f"Total input columns: {total_input_cols}")
    print(f"Input shape: {x.shape}")
    print(f"Output shape: {output.shape}")
    print(f"Total parameters: {model.get_num_params():,}")
    print(f"Trainable parameters: {model.get_num_trainable_params():,}")

