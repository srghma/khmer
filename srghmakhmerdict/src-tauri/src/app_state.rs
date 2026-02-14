use sqlx::{SqlitePool};
use tokio::sync::RwLock;

pub struct AppState {
    pub dict_pool: RwLock<Option<SqlitePool>>,
    pub init_error: RwLock<Option<String>>,
}

impl AppState {
    pub async fn get_pool(&self) -> Result<SqlitePool, String> {
        let guard = self.dict_pool.read().await;
        match &*guard {
            Some(pool) => Ok(pool.clone()),
            None => {
                let error_guard = self.init_error.read().await;
                match &*error_guard {
                    Some(err) => Err(err.clone()),
                    None => Err("DB_NOT_READY".to_string()),
                }
            }
        }
    }
}
