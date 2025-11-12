import { createConsola } from 'consola'
import { getTraceId } from './trace'

const consola = createConsola({
	formatOptions: {
		colors: true,
		date: true,
		columns: 2,
	},
})

function addTraceId(args: unknown[]): unknown[] {
	const traceId = getTraceId()

	if (!traceId) {
		return args
	}

	const lastArg = args[args.length - 1]

	if (typeof lastArg === 'object' && lastArg !== null && !Array.isArray(lastArg)) {
		args[args.length - 1] = { traceId, ...(lastArg as Record<string, unknown>) }
	} else {
		args.push({ traceId })
	}

	return args
}

function logWithNewline(level: 'log' | 'info' | 'warn' | 'error' | 'success' | 'start', ...args: unknown[]): void {
	const argsWithTrace = addTraceId(args)
	const [message, data] = argsWithTrace

	if (data && typeof data === 'object') {
		consola[level](message)
		console.log(data)
	} else {
		consola[level](...(argsWithTrace as [unknown, ...unknown[]]))
	}
}

export const logger = {
	...consola,
	log: (...args: unknown[]) => logWithNewline('log', ...args),
	info: (...args: unknown[]) => logWithNewline('info', ...args),
	warn: (...args: unknown[]) => logWithNewline('warn', ...args),
	error: (...args: unknown[]) => logWithNewline('error', ...args),
	success: (...args: unknown[]) => logWithNewline('success', ...args),
	start: (...args: unknown[]) => logWithNewline('start', ...args),
}
