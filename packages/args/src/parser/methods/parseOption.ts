import { search } from "@/lib/search"
import type { ArgHandlerOutput, MergedConfig } from "@/types/types.private"
import type { ArgOutput, Option } from "@/types/types.public"
import type { ZodTypeAny } from "zod"
import { ParserError } from "../../lib/errors"
import { handleSchema } from "../handlers/handleSchema"
import type { ValueParams } from "./parseArg"

export function parseOption<C extends MergedConfig, A extends Option<string, ZodTypeAny>>({
  parsedArgv,
  rawArgv,
  arg,
  settings,
  consumedIndices,
  path,
  baseOffset = 0,
}: ValueParams<A>): ArgHandlerOutput<ArgOutput<C, A["name"]>> {
  const index = search({ settings, parsedArgv, commandOrArgument: arg, parser: path })

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

  // Check if format is like -o=value or --option=value
  if (currentArg.includes("=")) {
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
