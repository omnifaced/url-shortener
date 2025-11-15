import { createApp, startServer, startCleanupJob, setupGracefulShutdown } from './server'

const app = createApp()
const port = Number(process.env.PORT) || 3000

startServer(app, port)
startCleanupJob()
setupGracefulShutdown()
