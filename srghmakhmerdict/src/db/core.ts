import Database from '@tauri-apps/plugin-sql'

// let dictDbPromise: Promise<Database> | undefined = undefined
let userDbPromise: Promise<Database> | undefined = undefined

// Connect to the Read-Only Dictionary DB
// we should not have 2 connections to same db. Why? sqlite doesnt support
// export const getDictDb = (): Promise<Database> => {
//   if (!dictDbPromise) {
//     dictDbPromise = Database.load('sqlite:dict.db?mode=ro')
//   }

//   return dictDbPromise
// }

// Connect to the Read-Write User Data DB
export const getUserDb = (): Promise<Database> => {
  if (!userDbPromise) userDbPromise = Database.load('sqlite:user_data.db')

  return userDbPromise
}
