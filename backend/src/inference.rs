use ort::session::Session;

pub fn load_model(path: &str) -> ort::Result<Session> {
    let session = Session::builder()?
        .commit_from_file(path)?;
    
    Ok(session)
}

