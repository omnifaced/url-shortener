import encodeQR, { type ErrorCorrection } from 'qr'

export interface QrCodeOptions {
	format: 'svg' | 'png'
	size: number
	ecc: ErrorCorrection
}

export interface QrCodeResult {
	data: string | Uint8Array<ArrayBuffer>
	contentType: string
}

export function generateQrCode(url: string, options: QrCodeOptions): QrCodeResult {
	const { format, size, ecc } = options
	const scale = Math.floor(size / 25)

	if (format === 'svg') {
		const svg = encodeQR(url, 'svg', { ecc, scale })
		return {
			data: svg,
			contentType: 'image/svg+xml',
		}
	}

	const rawBytes = encodeQR(url, 'gif', { ecc, scale })
	const bytes = new Uint8Array(rawBytes.buffer.slice(0) as ArrayBuffer)

	return {
		data: bytes,
		contentType: 'image/gif',
	}
}
