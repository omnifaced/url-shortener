import { Id } from '../value-objects'

export interface RefreshTokenProps {
	id: Id
	userId: Id
	token: string
	userAgent: string | null
	ip: string | null
	expiresAt: Date
	createdAt: Date
}

export class RefreshToken {
	private constructor(private readonly props: RefreshTokenProps) {}

	public static create(props: RefreshTokenProps): RefreshToken {
		return new RefreshToken(props)
	}

	public static createNew(userId: Id, token: string, expiresAt: Date, userAgent?: string, ip?: string): RefreshToken {
		return new RefreshToken({
			id: Id.createNew(),
			userId,
			token,
			userAgent: userAgent ?? null,
			ip: ip ?? null,
			expiresAt,
			createdAt: new Date(),
		})
	}

	public getId(): Id {
		return this.props.id
	}

	public getUserId(): Id {
		return this.props.userId
	}

	public getToken(): string {
		return this.props.token
	}

	public getUserAgent(): string | null {
		return this.props.userAgent
	}

	public getIp(): string | null {
		return this.props.ip
	}

	public getExpiresAt(): Date {
		return this.props.expiresAt
	}

	public isExpired(): boolean {
		return this.props.expiresAt < new Date()
	}
}
