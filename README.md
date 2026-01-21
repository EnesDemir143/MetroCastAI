# MetroCast AI - Advanced Weather Forecasting System

MetroCast AI is an end-to-end, AI-powered weather forecasting system. This project combines data collection, deep learning model training, a high-performance backend service, and a modern web interface to provide accurate 7-day temperature forecasts.

![MetroCast AI Banner](https://raw.githubusercontent.com/enesdemir143/MetroCastAI/main/web/public/assets/preview.png)

## 🚀 Project Structure

The project consists of three main components:

1.  **HYS (Weather Forecasting System) - Training**: Python-based module where deep learning models are trained.
2.  **Backend (Rust) - API**: Low-latency prediction service developed using Rust and Axum.
3.  **Frontend (Web) - Dashboard**: User-friendly visualization interface built with React, Vite, and Tailwind CSS.

---

## 🧠 1. Model and Training

At the heart of the system lies the **ExcelFormer** architecture, a specialized Transformer variant optimized for tabular and time-series data.

### Technical Specifications:
-   **Model:** ExcelFormer (Advanced Attention-based Transformer)
-   **Input Window:** 168 hours (7 days) of historical weather data.
-   **Output Horizon:** 168 hours (7 days) of future temperature predictions.
-   **Data Source:** Open-Meteo Archive API.
-   **Technologies:** PyTorch, Pandas, NumPy, Weights & Biases (WandB).

### Key Features:
-   **Chronological Data Splitting:** Data is split into training, validation, and test sets according to time order to prevent leakage.
-   **Early Stopping:** Monitors validation loss to prevent overfitting.
-   **ONNX Export:** The best-trained model is converted to ONNX format for efficient high-speed execution in the backend.
-   **WandB Integration:** Real-time tracking of training metrics (Loss, MAE, RMSE).

---

## ⚙️ 2. Backend (Rust API)

The prediction serving layer is developed in **Rust**, focusing on performance and safety.

### Features:
-   **Framework:** [Axum](https://github.com/tokio-rs/axum) (High-performance web framework).
-   **Inference Engine:** [ORT (ONNX Runtime)](https://onnxruntime.ai/) - Enables ultra-fast model execution on CPU/GPU.
-   **Documentation:** Integrated Swagger UI via [Utoipa](https://github.com/juhakivekas/utoipa) (`/swagger-ui`).
-   **Data Processing:** Handles input normalization and inverse transformation of model outputs back to Celsius.

### API Endpoints:
-   `POST /predict`: Receives historical weather data and returns a 7-day forecast.
-   `GET /health`: System health check.
-   `GET /swagger-ui`: Access to OpenAPI documentation.

---

## 💻 3. Web Interface (Frontend)

A modern interface where users can examine forecasts and monitor system performance.

### Features:
-   **Dashboard:** Sleek card designs for current and weekly weather data.
-   **Weather Charts:** Interactive temperature variation charts powered by Recharts.
-   **Intelligence Console:**
    -   Visualizes training history with "Loss" and "Accuracy" (MAE) graphs.
    -   Direct integration of WandB telemetry into the UI.
    -   Detailed view of model architecture and hyperparameters.
-   **Modern UI:** Premium dark-mode design built with Tailwind CSS and Shadcn UI components.
-   **Multi-language Support:** Turkish and English language options.

---

## ☁️ 4. Infrastructure & Deployment (AWS)

The system is architected for scalability and reliability using Amazon Web Services (AWS).

### Architecture Components:
-   **Compute (EC2):** The Rust-based backend is containerized and deployed on **AWS EC2** instances, ensuring high availability and low-latency API response times.
-   **Storage (S3):** Historical weather data and processed CSV files are stored in **Amazon S3** buckets, acting as a data lake for the training pipeline.
-   **Security:** Traffic is managed through AWS Security Groups, with port 3000 exposed for the Axum API.

---

## 🛠️ Setup and Installation

### Prerequisites:
-   Python 3.10+
-   Rust (Cargo) 1.75+
-   Node.js 18+ & npm
-   Docker (Optional)

### 1. Start the Backend:
```bash
cd backend
# Make sure best_model.onnx is in models/ or backend/models/
cargo run --release
```

### 2. Start the Frontend:
```bash
cd web
npm install
npm run dev
```

### 3. Training (Optional - for data refresh):
```bash
# Install dependencies
pip install -r requirements.txt

# Fetch fresh data
python data/fetch_data.py

# Run training
python src/training/train.py
```

---

## 📊 Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Languages** | Python, Rust, TypeScript |
| **AI/ML** | PyTorch, ONNX, Scikit-learn |
| **API** | Axum, Utoipa, Serde |
| **Frontend** | React, Vite, Tailwind CSS, Recharts |
| **Inference/Ops**| ORT, AWS S3, Docker, WandB |

---

## 📝 License
This project is licensed under the [MIT License](LICENSE).

---
*Developed by: [Enes Demir](https://github.com/enesdemir143)*
