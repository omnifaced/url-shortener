import { createApp, startServer, startCleanupJob, setupGracefulShutdown } from './server'
import { hasCerts } from './server/start-server'
import { config } from './config'

const app = createApp()

if (!config.app.redirect_url) {
	config.app.redirect_url = `${hasCerts() ? 'https' : 'http'}://${config.app.host}:${config.app.port}`
}

startServer(app, config.app.port)
startCleanupJob()
setupGracefulShutdown()
