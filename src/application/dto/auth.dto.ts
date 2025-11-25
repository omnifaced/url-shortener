import { z } from '@hono/zod-openapi'

export const registerSchema = z.object({
	username: z.string().min(3).max(255).openapi({ example: 'omnifaced' }),
	password: z.string().min(6).openapi({ example: 'password123' }),
})

export const loginSchema = z.object({
	username: z.string().min(3).max(255).openapi({ example: 'omnifaced' }),
	password: z.string().min(6).openapi({ example: 'password123' }),
})

export const refreshSchema = z.object({
	refreshToken: z.string().min(1).openapi({ example: 'abc123...' }),
})

export const authResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
		refreshToken: z.string().openapi({ example: 'abc123...' }),
		user: z.object({
			id: z.number().openapi({ example: 1 }),
			username: z.string().openapi({ example: 'johndoe' }),
		}),
	}),
})

export const refreshResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
	}),
})

export type RegisterDto = z.infer<typeof registerSchema>
export type LoginDto = z.infer<typeof loginSchema>
export type RefreshDto = z.infer<typeof refreshSchema>

export interface AuthResponseDto {
	accessToken: string
	refreshToken: string
	user: {
		id: number
		username: string
	}
}

export interface RefreshResponseDto {
	accessToken: string
}
