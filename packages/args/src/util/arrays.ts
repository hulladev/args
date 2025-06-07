export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

export function mapKey<T extends Record<string, unknown>, K extends keyof T>(
  obj: T[],
  key: K
): T[K][] {
  return obj.map((item) => item[key])
}

export function spread<T>(arr: T[] | T): T extends undefined ? never[] : T[] {
  if (arr === undefined) {
    return [] as T extends undefined ? never[] : T[]
  }
  if (Array.isArray(arr)) {
    return arr as T extends undefined ? never[] : T[]
  }
  return [arr] as T extends undefined ? never[] : T[]
}
