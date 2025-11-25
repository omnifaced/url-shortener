import { Id } from '../value-objects'

export interface DeviceInfo {
	browser?: string
	os?: string
	device?: string
}

export interface ClickProps {
	id: Id
	linkId: Id
	clickedAt: Date
	ip: string | null
	userAgent: string | null
	referer: string | null
	deviceInfo: DeviceInfo | null
}

export class Click {
	private constructor(private readonly props: ClickProps) {}

	public static create(props: ClickProps): Click {
		return new Click(props)
	}

	public static createNew(
		linkId: Id,
		ip?: string,
		userAgent?: string,
		referer?: string,
		deviceInfo?: DeviceInfo
	): Click {
		return new Click({
			id: Id.createNew(),
			linkId,
			clickedAt: new Date(),
			ip: ip ?? null,
			userAgent: userAgent ?? null,
			referer: referer ?? null,
			deviceInfo: deviceInfo ?? null,
		})
	}

	public getId(): Id {
		return this.props.id
	}

	public getLinkId(): Id {
		return this.props.linkId
	}

	public getClickedAt(): Date {
		return this.props.clickedAt
	}

	public getIp(): string | null {
		return this.props.ip
	}

	public getUserAgent(): string | null {
		return this.props.userAgent
	}

	public getReferer(): string | null {
		return this.props.referer
	}

	public getDeviceInfo(): DeviceInfo | null {
		return this.props.deviceInfo
	}
}
