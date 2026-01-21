mod handlers;
mod inference;
mod preprocess;
mod schemas;

use axum::{routing::{get, post}, Router};
use std::path::Path;
use std::sync::{Arc, Mutex};
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use handlers::AppState;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

#[derive(OpenApi)]
#[openapi(
    paths(handlers::predict),
    components(
        schemas(
            schemas::PredictionRequest,
            schemas::WeatherInputRecord,
            schemas::PredictionResponse
        )
    ),
    tags(
        (name = "prediction", description = "Prediction endpoints")
    )
)]
struct ApiDoc;

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
        .route("/", get(|| async { "Metrocast API v1.0 is running." }))
        .route("/health", get(|| async { "OK" }))
        .route("/predict", post(handlers::predict))
        .route("/wandb", post(handlers::proxy_wandb))
        .route("/s3-data", get(handlers::proxy_s3))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .with_state(state);

    let addr = "0.0.0.0:3000";
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("Server running on http://{}", addr);
    
    axum::serve(listener, app).await.unwrap();
}
