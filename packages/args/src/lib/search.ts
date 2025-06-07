import type { BareCommand } from "@/types/types.private"
import type {
  ArgType,
  Argument,
  Command,
  Flag,
  Option,
  ParserConfig,
  ParserSettings,
} from "@/types/types.public"
import { spread } from "@/util/arrays"
import type { ZodTypeAny } from "zod"
import { ParserError } from "./errors"

// Search for an argument by name
export function search<
  const C extends ParserConfig,
  A extends Flag<string, ZodTypeAny> | Option<string, ZodTypeAny>,
>(data: {
  settings: ParserSettings
  parsedArgv: string[]
  commandOrArgument: A
  parser: C["name"]
  startIndex?: number
}): number

// Search for a command
export function search<const C extends ParserConfig>(data: {
  settings: ParserSettings
  parsedArgv: string[]
  commandOrArgument: Command<string, Argument<string, ArgType, ZodTypeAny>[], BareCommand[]>
  parser: C["name"]
  startIndex?: number
}): number

// Main search function implementation
export function search<const C extends ParserConfig>(data: {
  settings: ParserSettings
  parsedArgv: string[]
  commandOrArgument:
    | Flag<string, ZodTypeAny>
    | Option<string, ZodTypeAny>
    | Command<string, Argument<string, ArgType, ZodTypeAny>[], BareCommand[]>
  parser: C["name"]
  startIndex?: number
}): number {
  const { settings, parsedArgv, commandOrArgument, parser, startIndex = 0 } = data
  // Check if it's a command (has name and type properties, but type is not an ArgType)
  if (isCommand(commandOrArgument)) {
    const searchFor = [commandOrArgument.name, ...spread(commandOrArgument.alias)].map((str) =>
      settings.caseSensitive ? str : str.toLowerCase()
    )

    // Only search from the startIndex position onward
    for (let i = startIndex; i < parsedArgv.length; i++) {
      if (searchFor.includes(parsedArgv[i]!)) {
        return i
      }
    }
    return -1
  }

  // It's an argument - handle different argument types
  const arg = commandOrArgument as Argument<string, ArgType, ZodTypeAny>

  if (arg.type === "flag" || arg.type === "option") {
    // For flags and options, we need to check for short and long forms
    const flagArg = arg as Flag<string, ZodTypeAny> | Option<string, ZodTypeAny>

    const searchFor = [
      ...spread(flagArg.short).map((short) => `-${short}`),
      ...spread(flagArg.long).map((long) => `--${long}`),
    ].map((flag) => (settings.caseSensitive ? flag : flag.toLowerCase()))

    // Only search from the startIndex position onward
    for (let i = startIndex; i < parsedArgv.length; i++) {
      const currentArg = parsedArgv[i]!
      if (
        searchFor.includes(currentArg) ||
        searchFor.some((prefix) => currentArg.startsWith(`${prefix}=`))
      ) {
        return i
      }
    }
    return -1
  }

  // If it's a positional or sequence, or other unrecognized argument type, throw error
  throw new ParserError({
    message: `Unrecognized argument type: ${arg.type}`,
    code: "unrecognized_keys",
    parser: isCommand(commandOrArgument)
      ? (
          commandOrArgument as Command<
            string,
            Argument<string, ArgType, ZodTypeAny>[],
            BareCommand[]
          >
        ).name
      : parser,
    from: "parser",
    argvIndex: -1,
    argumentName: arg.name,
    path: [parser],
  })
}

function isCommand(
  commandOrArgument:
    | Argument<string, ArgType, ZodTypeAny>
    | Command<string, Argument<string, ArgType, ZodTypeAny>[], BareCommand[]>
): commandOrArgument is Command<string, Argument<string, ArgType, ZodTypeAny>[], BareCommand[]> {
  // Commands are ParserConfig objects, arguments have specific ArgType values
  return "type" in commandOrArgument && commandOrArgument.type === "command"
}
