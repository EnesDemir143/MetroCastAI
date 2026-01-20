use ort::session::Session;

pub fn load_model() -> ort::Result<Session> {
    let session = Session::builder()?
        .commit_from_file("models/best_model.onnx")?;
    
    Ok(session)
}

