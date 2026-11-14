/// Erreur commune. Les backends convertissent leurs erreurs vers ce type.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("entrée invalide : {0}")]
    Invalid(String),
    #[error("non pris en charge : {0}")]
    Unsupported(String),
    #[error("backend {backend} : {message}")]
    Backend {
        backend: &'static str,
        message: String,
    },
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

pub type Result<T, E = Error> = std::result::Result<T, E>;
