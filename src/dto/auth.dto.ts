import { z } from 'zod'

export const registerSchema = z.object({
	username: z.string().min(3).max(255).openapi({ example: 'johndoe' }),
	password: z.string().min(6).openapi({ example: 'password123' }),
})

export const loginSchema = z.object({
	username: z.string().min(3).max(255).openapi({ example: 'johndoe' }),
	password: z.string().min(6).openapi({ example: 'password123' }),
})

export const refreshSchema = z.object({
	refreshToken: z.string().min(1).openapi({ example: 'abc123...' }),
})

export const authResponseSchema = z.object({
	accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
	refreshToken: z.string().openapi({ example: 'abc123...' }),
	user: z.object({
		id: z.number().openapi({ example: 1 }),
		username: z.string().openapi({ example: 'johndoe' }),
	}),
})

export const refreshResponseSchema = z.object({
	accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
})
