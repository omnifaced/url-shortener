export type QrFormat = 'svg' | 'png'
export type QrErrorCorrectionLevel = 'low' | 'medium' | 'quartile' | 'high'

export interface QrOptions {
	format: QrFormat
	size: number
	ecc: QrErrorCorrectionLevel
}

export interface QrPort {
	generate(url: string, options: QrOptions): Promise<Buffer>
}
