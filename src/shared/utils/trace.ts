import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'

interface TraceContext {
	traceId: string
}

export const traceStorage = new AsyncLocalStorage<TraceContext>()

export function generateTraceId(): string {
	return randomUUID()
}

export function getTraceId(): string | undefined {
	return traceStorage.getStore()?.traceId
}

export function withTrace<T>(traceId: string, callback: () => T): T {
	return traceStorage.run({ traceId }, callback)
}
