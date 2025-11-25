import { Id, type Url, type ShortCode } from '../value-objects'

export interface LinkProps {
	id: Id
	userId: Id
	originalUrl: Url
	shortCode: ShortCode
	title: string | null
	isActive: boolean
	createdAt: Date
	expiresAt: Date | null
}

export class Link {
	private constructor(private props: LinkProps) {}

	public static create(props: LinkProps): Link {
		return new Link(props)
	}

	public static createNew(
		userId: Id,
		originalUrl: Url,
		shortCode: ShortCode,
		title?: string,
		expiresAt?: Date
	): Link {
		return new Link({
			id: Id.createNew(),
			userId,
			originalUrl,
			shortCode,
			title: title ?? null,
			isActive: true,
			createdAt: new Date(),
			expiresAt: expiresAt ?? null,
		})
	}

	public getId(): Id {
		return this.props.id
	}

	public getUserId(): Id {
		return this.props.userId
	}

	public getOriginalUrl(): Url {
		return this.props.originalUrl
	}

	public getShortCode(): ShortCode {
		return this.props.shortCode
	}

	public getTitle(): string | null {
		return this.props.title
	}

	public getIsActive(): boolean {
		return this.props.isActive
	}

	public getCreatedAt(): Date {
		return this.props.createdAt
	}

	public getExpiresAt(): Date | null {
		return this.props.expiresAt
	}

	public isExpired(): boolean {
		if (!this.props.expiresAt) {
			return false
		}

		return this.props.expiresAt < new Date()
	}

	public deactivate(): void {
		this.props.isActive = false
	}

	public activate(): void {
		this.props.isActive = true
	}

	public updateTitle(title: string | null): void {
		this.props.title = title
	}

	public canBeAccessed(): boolean {
		return this.props.isActive && !this.isExpired()
	}
}
