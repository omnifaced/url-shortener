import encodeQR from 'qr'

import type { QrPort, QrOptions } from '../../application'

export class QrAdapter implements QrPort {
	public async generate(url: string, options: QrOptions): Promise<Buffer> {
		const { format, size, ecc } = options

		const scale = Math.floor(size / 25)

		if (format === 'svg') {
			const svg = encodeQR(url, 'svg', { ecc, scale })
			return Buffer.from(svg)
		}

		const rawBytes = encodeQR(url, 'gif', { ecc, scale })
		return Buffer.from(rawBytes.buffer.slice(0) as ArrayBuffer)
	}
}
