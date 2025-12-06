import type { Argument, ArgType, ParserSettings } from "@/types/types.public"
import { spread } from "@/util/arrays"
import type { ZodTypeAny } from "zod"

/**
 * Detects if an argv element is a combined short flags pattern (e.g., "-hv", "-abc")
 * Only matches single dash followed by 2+ alphanumeric characters
 */
export function isSharedDashPattern(arg: string): boolean {
  return /^-[a-zA-Z0-9]{2,}$/.test(arg)
}

/**
 * Expands a combined short flags string into individual flags
 * Example: "-hv" => ["-h", "-v"]
 * Example: "-abc" => ["-a", "-b", "-c"]
 */
export function expandSharedDash(arg: string, settings: ParserSettings): string[] {
  if (!isSharedDashPattern(arg)) {
    return [arg]
  }

  // Remove the leading dash and split into characters
  const chars = arg.slice(1).split("")

  // Convert each character to a flag
  return chars.map((char) => {
    const flag = `-${char}`
    return settings.caseSensitive ? flag : flag.toLowerCase()
  })
}

/**
 * Checks if a character matches a known short name for any argument
 */
export function isKnownShort(
  char: string,
  args: Argument<string, ArgType, ZodTypeAny>[],
  settings: ParserSettings,
): boolean {
  const normalizedChar = settings.caseSensitive ? char : char.toLowerCase()

  for (const arg of args) {
    if (arg.type === "flag" || arg.type === "option") {
      const shorts = spread(arg.short)
      const normalizedShorts = shorts.map((s) =>
        settings.caseSensitive ? s : s.toLowerCase(),
      )
      if (normalizedShorts.includes(normalizedChar)) {
        return true
      }
    }
  }

  return false
}

/**
 * Finds the argument that matches a given short character
 */
export function findArgByShort(
  char: string,
  args: Argument<string, ArgType, ZodTypeAny>[],
  settings: ParserSettings,
): Argument<string, ArgType, ZodTypeAny> | undefined {
  const normalizedChar = settings.caseSensitive ? char : char.toLowerCase()

  for (const arg of args) {
    if (arg.type === "flag" || arg.type === "option") {
      const shorts = spread(arg.short)
      const normalizedShorts = shorts.map((s) =>
        settings.caseSensitive ? s : s.toLowerCase(),
      )
      if (normalizedShorts.includes(normalizedChar)) {
        return arg
      }
    }
  }

  return undefined
}

/**
 * Checks if a shared dash pattern contains any options (not just flags)
 */
export function containsOptions(
  sharedDashArg: string,
  args: Argument<string, ArgType, ZodTypeAny>[],
  settings: ParserSettings,
): boolean {
  if (!isSharedDashPattern(sharedDashArg)) {
    return false
  }

  const chars = sharedDashArg.slice(1).split("")

  for (const char of chars) {
    const arg = findArgByShort(char, args, settings)
    if (arg && arg.type === "option") {
      return true
    }
  }

  return false
}

/**
 * Gets the position (0-indexed) of a character within a shared dash pattern
 * Returns -1 if the character is not in the pattern
 */
export function getPositionInSharedDash(
  sharedDashArg: string,
  char: string,
  settings: ParserSettings,
): number {
  if (!isSharedDashPattern(sharedDashArg)) {
    return -1
  }

  const chars = sharedDashArg.slice(1).split("")
  const normalizedChar = settings.caseSensitive ? char : char.toLowerCase()
  const normalizedChars = chars.map((c) =>
    settings.caseSensitive ? c : c.toLowerCase(),
  )

  return normalizedChars.indexOf(normalizedChar)
}
