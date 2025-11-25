import type { Id, Username } from '../value-objects'
import type { User } from '../entities'

export interface UserRepository {
	findById(id: Id): Promise<User | null>
	findByUsername(username: Username): Promise<User | null>
	save(user: User): Promise<User>
	exists(username: Username): Promise<boolean>
}
