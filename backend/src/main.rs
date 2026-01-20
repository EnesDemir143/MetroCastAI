mod handlers;
mod inference;
mod preprocess;
mod schemas;

use axum::{routing::post, Router};
use std::path::Path;
use std::sync::{Arc, Mutex};
use tower_http::cors::CorsLayer;

use handlers::AppState;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Paths lookup strategy: try current dir then ../
    // This allows running from 'backend/' or project root
    let stats_paths = ["data/processed/statistics.json", "../data/processed/statistics.json"];
    let model_paths = ["models/best_model.onnx", "../models/best_model.onnx"];

    let stats_path = stats_paths
        .iter()
        .find(|p| Path::new(p).exists())
        .expect("statistics.json not found in 'data/processed/' or '../data/processed/'");

    let model_path = model_paths
        .iter()
        .find(|p| Path::new(p).exists())
        .expect("best_model.onnx not found in 'models/' or '../models/'");

    println!("Loading statistics from: {}", stats_path);
    let stats = preprocess::Statistics::from_file(stats_path)
        .expect("Failed to load statistics");

    println!("Loading model from: {}", model_path);
    let session = inference::load_model(model_path)
        .expect("Failed to load ONNX model");

    // Shared state
    let state = Arc::new(AppState {
        session: Mutex::new(session),
        stats,
    });

    // App router
    let app = Router::new()
        .route("/predict", post(handlers::predict))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = "0.0.0.0:3000";
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("Server running on http://{}", addr);
    
    axum::serve(listener, app).await.unwrap();
}
