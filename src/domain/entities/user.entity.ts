import { Id, type Username } from '../value-objects'

export interface UserProps {
	id: Id
	username: Username
	passwordHash: string
	createdAt: Date
}

export class User {
	private constructor(private readonly props: UserProps) {}

	public static create(props: UserProps): User {
		return new User(props)
	}

	public static createNew(username: Username, passwordHash: string): User {
		return new User({
			id: Id.createNew(),
			username,
			passwordHash,
			createdAt: new Date(),
		})
	}

	public getId(): Id {
		return this.props.id
	}

	public getUsername(): Username {
		return this.props.username
	}

	public getPasswordHash(): string {
		return this.props.passwordHash
	}
}
