import * as assert from 'node:assert'

import { generateTraceId, getTraceId, withTrace } from './trace'
import { describe, test } from 'node:test'

describe('trace', () => {
	describe('generateTraceId', () => {
		test('should generate a valid UUID', () => {
			const traceId = generateTraceId()

			assert.strictEqual(typeof traceId, 'string')
			assert.match(traceId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
		})

		test('should generate unique IDs', () => {
			const id1 = generateTraceId()
			const id2 = generateTraceId()

			assert.notStrictEqual(id1, id2)
		})
	})

	describe('getTraceId', () => {
		test('should return undefined when not in trace context', () => {
			const traceId = getTraceId()

			assert.strictEqual(traceId, undefined)
		})

		test('should return traceId when in trace context', () => {
			const expectedTraceId = 'test-trace-id'

			const result = withTrace(expectedTraceId, () => {
				return getTraceId()
			})

			assert.strictEqual(result, expectedTraceId)
		})
	})

	describe('withTrace', () => {
		test('should execute callback with trace context', () => {
			const traceId = 'test-trace-123'
			let capturedTraceId: string | undefined

			withTrace(traceId, () => {
				capturedTraceId = getTraceId()
			})

			assert.strictEqual(capturedTraceId, traceId)
		})

		test('should return callback result', () => {
			const result = withTrace('trace-id', () => {
				return 42
			})

			assert.strictEqual(result, 42)
		})

		test('should isolate trace contexts', () => {
			const trace1 = 'trace-1'
			const trace2 = 'trace-2'

			const result1 = withTrace(trace1, () => getTraceId())
			const result2 = withTrace(trace2, () => getTraceId())

			assert.strictEqual(result1, trace1)
			assert.strictEqual(result2, trace2)
		})
	})
})
