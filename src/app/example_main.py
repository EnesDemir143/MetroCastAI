import os
import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import wandb
import onnx
import boto3
from dotenv import load_dotenv

# 1. .env dosyasındaki şifreleri yükle (AWS & W&B)
load_dotenv()

# --- AYARLAR (Config) ---
# W&B'ye göndereceğimiz parametreler
WANDB_CONFIG = {
    "learning_rate": 0.001,
    "architecture": "MLP (MetroNet)",
    "dataset": "Istanbul-Weather-Data",
    "epochs": 100,
    "batch_size": 32,
    "hidden_size": 64
}

# Cihaz Seçimi: Mac M1/M2 (MPS) yoksa CPU
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"🚀 Eğitim Cihazı: {device}")

# --- VERİ HAZIRLIĞI ---
def load_data(csv_path):
    if not os.path.exists(csv_path):
        df = pd.DataFrame({
            'base_temp': np.random.randn(100),
            'base_humidity': np.random.randn(100),
            'base_wind': np.random.randn(100),
            'base_pressure': np.random.randn(100),
            'target_temp': np.random.randn(100)
        })
        raise FileNotFoundError(f"❌ Veri dosyası bulunamadı: {csv_path}. Önce fetch_data.py çalıştır!")
    else:    
        df = pd.read_csv(csv_path)
    
    # Girdi (X) ve Hedef (y) sütunlarını seç
    # base_temp: Yeşilköy, target_temp: Maslak (Örnek)
    features = ['base_temp', 'base_humidity', 'base_wind', 'base_pressure']
    target = ['target_temp']
    
    X = df[features].values.astype(np.float32)
    y = df[target].values.astype(np.float32)
    return X, y

# --- MODEL MİMARİSİ ---
class MetroNet(nn.Module):
    def __init__(self, input_size):
        super(MetroNet, self).__init__()
        self.layer1 = nn.Linear(input_size, WANDB_CONFIG["hidden_size"])
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.2)
        self.layer2 = nn.Linear(WANDB_CONFIG["hidden_size"], WANDB_CONFIG["hidden_size"] // 2)
        self.output = nn.Linear(WANDB_CONFIG["hidden_size"] // 2, 1)

    def forward(self, x):
        x = self.layer1(x)
        x = self.relu(x)
        x = self.dropout(x)
        x = self.layer2(x)
        x = self.relu(x)
        x = self.output(x)
        return x

# --- EĞİTİM FONKSİYONU ---
def train():
    # 1. W&B BAŞLATMA (Senin verdiğin kodun entegre edilmiş hali)
    run = wandb.init(
        # Eğer 'team' kullanmak istemiyorsan aşağıdaki entity satırını SİL veya yorum yap.
        entity="jieuna1-kocaeli-university", 
        project="MetroCastAI",
        config=WANDB_CONFIG
    )
    
    # Veriyi Yükle
    print("⏳ Veri yükleniyor...")
    X, y = load_data("data/istanbul_weather_data.csv")
    
    # Ölçeklendirme (Scaling)
    scaler_X = StandardScaler()
    scaler_y = StandardScaler()
    X = scaler_X.fit_transform(X)
    y = scaler_y.fit_transform(y)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Tensor'a çevir
    X_train_t = torch.tensor(X_train).to(device)
    y_train_t = torch.tensor(y_train).to(device)
    X_test_t = torch.tensor(X_test).to(device)
    y_test_t = torch.tensor(y_test).to(device)
    
    model = MetroNet(input_size=X.shape[1]).to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=WANDB_CONFIG["learning_rate"])
    
    # 2. EĞİTİM DÖNGÜSÜ
    print("🏋️‍♂️ Eğitim Başlıyor...")
    for epoch in range(WANDB_CONFIG["epochs"]):
        model.train()
        optimizer.zero_grad()
        
        # İleri ve Geri Yayılım
        outputs = model(X_train_t)
        loss = criterion(outputs, y_train_t)
        loss.backward()
        optimizer.step()
        
        # Loglama (Her 10 epochta bir)
        if (epoch+1) % 10 == 0:
            model.eval()
            with torch.no_grad():
                test_outputs = model(X_test_t)
                val_loss = criterion(test_outputs, y_test_t)
                
            print(f"Epoch [{epoch+1}/{WANDB_CONFIG['epochs']}], Loss: {loss.item():.4f}")
            
            # W&B'ye GERÇEK metrikleri gönderiyoruz (Random değil!)
            run.log({
                "train_loss": loss.item(), 
                "val_loss": val_loss.item(),
                "epoch": epoch
            })
            
    print("✅ Eğitim Tamamlandı!")

    # --- 3. ONNX EXPORT ---
    print("📦 ONNX Formatına Çevriliyor...")
    dummy_input = torch.randn(1, X.shape[1]).to(device)
    if not os.path.exists("models"):
        os.makedirs("models")
    onnx_path = "models/metrocast_model.onnx"
    
    torch.onnx.export(
        model, dummy_input, onnx_path, 
        input_names=["input"], output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}}
    )
    
    # Modeli W&B'ye de yedekle
    wandb.save(onnx_path)

    # --- 4. AWS S3 UPLOAD ---
    # Not: Bucket ismini senin oluşturduğunla değiştirmeyi unutma!
    BUCKET_NAME = "metrocast-ai-storage-enes" 
    S3_FILE_NAME = "model-v1.onnx"

    print(f"☁️ AWS S3'e yükleniyor: {BUCKET_NAME}...")
    s3 = boto3.client('s3')
    try:
        s3.upload_file(onnx_path, BUCKET_NAME, S3_FILE_NAME)
        print(f"✅ BAŞARILI! Model buluta yüklendi: s3://{BUCKET_NAME}/{S3_FILE_NAME}")
    except Exception as e:
        print(f"❌ HATA: S3 yüklemesi başarısız oldu. .env dosyanı kontrol et.\nHata: {e}")

    # İşlemi bitir
    run.finish()

if __name__ == "__main__":
    train()