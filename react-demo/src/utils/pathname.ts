export function extractPathname(input: string): string {
  if (input.startsWith('/')) return input
  try {
    return new URL(input).pathname
  } catch {
    return input
  }
}
