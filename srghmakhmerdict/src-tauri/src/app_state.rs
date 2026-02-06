use sqlx::{SqlitePool};
use tokio::sync::RwLock;

pub struct AppState {
    pub dict_pool: RwLock<Option<SqlitePool>>,
}

impl AppState {
    pub async fn get_pool(&self) -> Result<SqlitePool, String> {
        let guard = self.dict_pool.read().await;
        match &*guard {
            Some(pool) => Ok(pool.clone()),
            None => Err("DB_NOT_READY".to_string()),
        }
    }
}
