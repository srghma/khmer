import Database from '@tauri-apps/plugin-sql'

// let dictDbPromise: Promise<Database> | undefined = undefined
let userDbPromise: Promise<Database> | undefined = undefined

// // Connect to the Read-Only Dictionary DB
// export const getDictDb = (): Promise<Database> => {
//   if (!dictDbPromise) {
//     // 'dict.db' must be located in a place accessible to the plugin (e.g. AppConfig or Resource)
//     // In dev, ensure dict.db is available or configured in tauri.conf.json permissions
//     // dictDbPromise = Database.load('sqlite:mydb/dict.db?mode=ro')
//     dictDbPromise = Database.load('sqlite:localhost/dict.db?mode=ro')
//   }
//   return dictDbPromise
// }
//
// getDictDb()

// Connect to the Read-Write User Data DB
export const getUserDb = (): Promise<Database> => {
  if (!userDbPromise) userDbPromise = Database.load('sqlite:user_data.db')

  return userDbPromise
}
