import { Counter, collectDefaultMetrics, Gauge, Histogram, Registry } from 'prom-client'

export const metricsRegistry = new Registry()

collectDefaultMetrics({
	register: metricsRegistry,
	prefix: 'url_shortener_',
})

export const httpRequestsTotal = new Counter({
	name: 'url_shortener_http_requests_total',
	help: 'Total number of HTTP requests',
	labelNames: ['method', 'path', 'status'],
	registers: [metricsRegistry],
})

export const httpRequestDuration = new Histogram({
	name: 'url_shortener_http_request_duration_seconds',
	help: 'HTTP request duration in seconds',
	labelNames: ['method', 'path', 'status'],
	buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
	registers: [metricsRegistry],
})

export const linksCreatedTotal = new Counter({
	name: 'url_shortener_links_created_total',
	help: 'Total number of links created',
	labelNames: ['user_id'],
	registers: [metricsRegistry],
})

export const linksActiveGauge = new Gauge({
	name: 'url_shortener_links_active',
	help: 'Number of currently active links',
	registers: [metricsRegistry],
})

export const clicksTotal = new Counter({
	name: 'url_shortener_clicks_total',
	help: 'Total number of clicks on short links',
	labelNames: ['short_code'],
	registers: [metricsRegistry],
})

export const authAttemptsTotal = new Counter({
	name: 'url_shortener_auth_attempts_total',
	help: 'Total number of authentication attempts',
	labelNames: ['type', 'status'],
	registers: [metricsRegistry],
})

export const authTokensActiveGauge = new Gauge({
	name: 'url_shortener_auth_tokens_active',
	help: 'Number of active refresh tokens',
	registers: [metricsRegistry],
})

export const cacheHitsTotal = new Counter({
	name: 'url_shortener_cache_hits_total',
	help: 'Total number of cache hits',
	labelNames: ['cache_type'],
	registers: [metricsRegistry],
})

export const cacheMissesTotal = new Counter({
	name: 'url_shortener_cache_misses_total',
	help: 'Total number of cache misses',
	labelNames: ['cache_type'],
	registers: [metricsRegistry],
})

export const linkExpirationTotal = new Counter({
	name: 'url_shortener_link_expiration_total',
	help: 'Total number of expired links cleaned up',
	registers: [metricsRegistry],
})

export const tokenExpirationTotal = new Counter({
	name: 'url_shortener_token_expiration_total',
	help: 'Total number of expired tokens cleaned up',
	registers: [metricsRegistry],
})

export const qrCodesGeneratedTotal = new Counter({
	name: 'url_shortener_qr_codes_generated_total',
	help: 'Total number of QR codes generated',
	labelNames: ['format'],
	registers: [metricsRegistry],
})
