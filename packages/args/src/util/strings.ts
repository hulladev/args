export function withoutPrefix(str: string, char: string): string {
  const prefix = str.trim().startsWith(char) ? char : ""
  return str.trim().slice(prefix.length)
}
