// import { warn, debug, trace, info, error } from '@tauri-apps/plugin-log'
//
// function forwardConsole(
//   fnName: 'log' | 'debug' | 'info' | 'warn' | 'error',
//   logger: (message: string) => Promise<void>,
// ) {
//   const original = console[fnName]
//
//   console[fnName] = message => {
//     original(message)
//     logger(message)
//   }
// }
//
// forwardConsole('log', trace)
// forwardConsole('debug', debug)
// forwardConsole('info', info)
// forwardConsole('warn', warn)
// forwardConsole('error', error)

// import * as path from '@tauri-apps/api/path'
// import { stat, BaseDirectory, readFile } from '@tauri-apps/plugin-fs'

// console.log('appCacheDir', await path.appCacheDir())
// console.log('appConfigDir', await path.appConfigDir())
// console.log('appDataDir', await path.appDataDir())
// console.log('appLocalDataDir', await path.appLocalDataDir())
// console.log('appLogDir', await path.appLogDir())
// console.log('audioDir', await path.audioDir())
// console.log('cacheDir', await path.cacheDir())
// console.log('configDir', await path.configDir())
// console.log('dataDir', await path.dataDir())
// console.log('delimiter', path.delimiter())
// // console.log('desktopDir', await path.desktopDir())
// console.log('documentDir', await path.documentDir())
// console.log('downloadDir', await path.downloadDir())
// // console.log('executableDir', await path.executableDir())
// // console.log('fontDir', await path.fontDir())
// console.log('homeDir', await path.homeDir())
// console.log('join', await path.join())
// console.log('localDataDir', await path.localDataDir())
// console.log('pictureDir', await path.pictureDir())
// console.log('publicDir', await path.publicDir())
// console.log('resolve', await path.resolve())
// console.log('resolveResource right', await path.resolveResource('mydb/dict.db'))
// console.log('resolveResource wrong', await path.resolveResource('db/wrong.db'))
// console.log('resourceDir', await path.resourceDir())
// // console.log('runtimeDir', await path.runtimeDir())
// console.log('sep', path.sep())
// console.log('tempDir', await path.tempDir())
// // console.log('templateDir', await path.templateDir())
// console.log('videoDir', await path.videoDir())
//
// try {
//   const metadata = await stat('mydb/dict.db', {
//     baseDir: BaseDirectory.Resource,
//   })
//   console.log('metadata', metadata)
// } catch (e) {
//   console.error('metadata e', e)
// }
//
// try {
//   const icon = await readFile('icon.png', {
//     baseDir: BaseDirectory.Resource,
//   })
//   console.log('icon.byteLength', icon.byteLength)
// } catch (e) {
//   console.error('icon e', e)
// }
//
// try {
//   const db = await readFile('mydb/dict.db', {
//     baseDir: BaseDirectory.Resource,
//   })
//   console.log('db.byteLength', db.byteLength)
// } catch (e) {
//   console.error('db e', e)
// }

// const startUrls = await getCurrent()
//
// if (startUrls) {
//   console.log('deep link startUrls:', startUrls)
//   // App was likely started via a deep link
//   // Note that getCurrent's return value will also get updated every time onOpenUrl gets triggered.
// }
//
// await onOpenUrl(urls => {
//   console.log('deep link:', urls)
// })
