import { relative } from 'node:path'

export function getRelativePath(path: string) {
	return relative(process.cwd(), path)
}
