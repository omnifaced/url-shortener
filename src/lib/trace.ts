import * as crypto from 'node:crypto'

import { AsyncLocalStorage } from 'node:async_hooks'

interface TraceContext {
	traceId: string
}

export const traceStorage = new AsyncLocalStorage<TraceContext>()

export function generateTraceId(): string {
	return crypto.randomUUID()
}

export function getTraceId(): string | undefined {
	return traceStorage.getStore()?.traceId
}

export function withTrace<T>(traceId: string, callback: () => T): T {
	return traceStorage.run({ traceId }, callback)
}
