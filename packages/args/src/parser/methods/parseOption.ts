import { search } from "@/lib/search"
import { getPositionInSharedDash, isSharedDashPattern } from "@/lib/sharedDash"
import type { ArgHandlerOutput, MergedConfig, ValueParams } from "@/types/types.private"
import type { ArgOutput, Option } from "@/types/types.public"
import { spread } from "@/util/arrays"
import type { ZodTypeAny } from "zod"
import { ParserError } from "../../lib/errors"
import { handleSchema } from "../handlers/handleSchema"

export function parseOption<C extends MergedConfig, A extends Option<string, ZodTypeAny>>({
  parsedArgv,
  rawArgv,
  arg,
  settings,
  consumedIndices,
  path,
  baseOffset = 0,
  searchStartIndex = 0,
  allArgs = [],
}: ValueParams<A>): ArgHandlerOutput<ArgOutput<C, A["name"]>> {
  // When mergeArgs is enabled and searchStartIndex is provided,
  // first search from searchStartIndex onwards, then search before if not found
  let index = search({
    settings,
    parsedArgv,
    commandOrArgument: arg,
    parser: path,
    startIndex: searchStartIndex,
  })

  // If not found and searchStartIndex > 0, search from the beginning (for mergeArgs)
  if (index === -1 && searchStartIndex > 0 && settings.mergeArgs) {
    index = search({
      settings,
      parsedArgv,
      commandOrArgument: arg,
      parser: path,
      startIndex: 0,
    })
    // Make sure we don't find something at or after searchStartIndex
    // (which would have been found in the first search)
    if (index >= searchStartIndex) {
      index = -1
    }
  }

  if (index === -1) {
    return {
      consumedIndices,
      value: undefined,
      raw: undefined,
      index: -1,
      detected: false,
      parser: path,
    }
  }

  // We know index is valid at this point
  const currentArg: string = parsedArgv[index]!
  let value: string | undefined
  let raw: string | undefined

  consumedIndices.add(index)

  // Check if this is a shared dash pattern
  const isSharedDash = settings.sharedDash && isSharedDashPattern(currentArg)

  // Check if format is like -o=value or --option=value
  if (currentArg.includes("=")) {
    // If it's a shared dash pattern with equals, throw an error
    if (isSharedDash) {
      throw new ParserError({
        message: `Cannot use equals syntax with shared dash pattern '${currentArg}'`,
        code: "invalid_arguments",
        parser: path,
        from: "parser",
        argvIndex: baseOffset + index,
        argumentName: arg.name,
        path: [path, arg.name],
      })
    }

    const parts = currentArg.split("=")
    value = parts.slice(1).join("=")
    raw = rawArgv[index]
  }
  // Check if format is like -o value or --option value
  else if (index + 1 < parsedArgv.length) {
    // If requireEquals is enabled, throw error for space-separated format
    if (settings.requireEquals) {
      throw new ParserError({
        message: `Option '${arg.name}' requires equals format (--${arg.name}=value) when requireEquals setting is enabled`,
        code: "invalid_arguments",
        parser: path,
        from: "parser",
        argvIndex: baseOffset + index,
        argumentName: arg.name,
        path: [path, arg.name],
      })
    }

    // Handle shared dash pattern specially
    if (isSharedDash) {
      // Find which position this option's short is in the pattern
      const shorts = spread(arg.short)
      let position = -1

      for (const short of shorts) {
        position = getPositionInSharedDash(currentArg, short, settings)
        if (position !== -1) break
      }

      if (position === -1) {
        throw new ParserError({
          message: `Could not find option '${arg.name}' in shared dash pattern '${currentArg}'`,
          code: "invalid_arguments",
          parser: path,
          from: "parser",
          argvIndex: baseOffset + index,
          argumentName: arg.name,
          path: [path, arg.name],
        })
      }

      // Count how many options come before this position in the pattern
      const chars = currentArg.slice(1).split("")
      let optionsBefore = 0

      for (let i = 0; i < position; i++) {
        const char = chars[i]!
        // Check if this character corresponds to an option (not a flag)
        const matchedArg = allArgs.find((a: { type: string; short?: string | string[] }) => {
          if (a.type === "flag" || a.type === "option") {
            const shorts = spread(a.short).map((s) =>
              settings.caseSensitive ? s : s.toLowerCase()
            )
            const normalizedChar = settings.caseSensitive ? char : char.toLowerCase()
            return shorts.includes(normalizedChar)
          }
          return false
        })

        if (matchedArg && matchedArg.type === "option") {
          optionsBefore++
        }
      }

      // The value is at index + 1 + optionsBefore
      const valueIndex = index + 1 + optionsBefore

      if (valueIndex < parsedArgv.length && !parsedArgv[valueIndex]!.startsWith("-")) {
        value = rawArgv[valueIndex]
        raw = `${rawArgv[index]} ${rawArgv[valueIndex]}`
        consumedIndices.add(valueIndex)
      } else {
        throw new ParserError({
          message: `Missing value for option '${arg.name}' at position ${position} in shared dash pattern '${currentArg}'`,
          code: "invalid_arguments",
          parser: path,
          from: "parser",
          argvIndex: baseOffset + index,
          argumentName: arg.name,
          path: [path, arg.name],
        })
      }
    } else {
      // Normal case - not a shared dash pattern
      // We've already checked index+1 is within bounds
      const nextArg = parsedArgv[index + 1]!
      // Check if the next argument doesn't start with a dash (not a flag/option)
      if (!nextArg.startsWith("-")) {
        value = rawArgv[index + 1]
        raw = `${rawArgv[index]} ${rawArgv[index + 1]}`
        consumedIndices.add(index + 1)
      } else {
        value = rawArgv[index]
        raw = rawArgv[index]
      }
    }
  } else {
    // If requireEquals is enabled and there's no value, throw error
    if (settings.requireEquals) {
      throw new ParserError({
        message: `Option '${arg.name}' requires equals format (--${arg.name}=value) when requireEquals setting is enabled`,
        code: "invalid_arguments",
        parser: path,
        from: "parser",
        argvIndex: baseOffset + index,
        argumentName: arg.name,
        path: [path, arg.name],
      })
    }

    value = rawArgv[index]
    raw = rawArgv[index]
  }

  return {
    value: value ? handleSchema({ path, schema: arg.schema, value }) : undefined,
    raw,
    consumedIndices: new Set(consumedIndices),
    index: baseOffset + index,
    detected: index !== -1,
    parser: path,
  }
}
