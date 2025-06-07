import { ParserError } from "@/lib/errors"
import { parseArg } from "@/parser/methods/parseArg"
import type {
  AnyArgOutput,
  BareCommand,
  NormalizedParserConfig,
  ReadyParserConfig,
} from "@/types/types.private"
import type { ParserConfig, ParserResult, ParserSettings } from "@/types/types.public"
import { entries } from "@/util/objects"

// Helper function to create an empty arguments result with the correct parser path
function createEmptyArgumentsWithParser(
  command: BareCommand,
  config: ReadyParserConfig<ParserConfig, "parser" | "command">,
  path: string
): Record<string, AnyArgOutput> {
  const result: Record<string, AnyArgOutput> = {}

  command.arguments?.forEach((arg) => {
    if (arg.type === "flag") {
      result[arg.name] = {
        value: false,
        raw: undefined,
        index: -1,
        detected: false,
        parser: path,
      }
    } else if (arg.type === "option") {
      result[arg.name] = {
        value: undefined,
        raw: undefined,
        index: -1,
        detected: false,
        parser: path,
      }
    } else if (
      arg.type === "positional" ||
      arg.type === "sequence" ||
      arg.type === "infiniteSequence"
    ) {
      result[arg.name] = {
        value: undefined,
        raw: undefined,
        index: -1,
        detected: false,
        parser: path,
      }
    }
  })

  return result
}

export function createParse<const C extends ParserConfig>(
  config: ReadyParserConfig<C, "parser"> | ReadyParserConfig<C, "command">,
  read: (argv: string[]) => string[],
  baseOffset: number = 0
) {
  const { settings, type, name, arguments: args, commands, path } = config

  return (argv: string[]): ParserResult<NormalizedParserConfig<C>, typeof type> => {
    // the read and parsedArgv doesn't need to pass on subsequent runs for command
    // its only necessary for the initial parser call
    const rawArgv = type === "parser" ? read(argv) : argv
    const parsedArgv =
      type === "parser"
        ? settings.caseSensitive
          ? rawArgv
          : rawArgv.map((arg) => arg.toLowerCase())
        : rawArgv
    const detected = type === "parser" ? true : parsedArgv.includes(name)

    // Handle nested commands hierarchically:
    // 1. First we identify which command at the current level is used (if any)
    // 2. Then we parse the remaining arguments for that command
    // 3. For flags and options, they can appear anywhere (before or after the command)

    const consumedIndices = new Set<number>()

    // If this is a command parser, mark its name as consumed
    if (type === "command") {
      const nameIndex = parsedArgv.indexOf(name)
      if (nameIndex !== -1) {
        consumedIndices.add(nameIndex)
      }
    }

    // Find the command at the current level (if any)
    const foundCommand = findCommandAtCurrentLevel(
      parsedArgv,
      commands,
      settings,
      path,
      consumedIndices
    )

    // Split the argv into parser's portion and command's portion
    const parserArgvEnd = foundCommand?.index ?? parsedArgv.length
    const commandArgvStart = foundCommand ? foundCommand.index + 1 : parsedArgv.length

    // Create argv slices for parser and command
    const parserArgv = parsedArgv.slice(0, parserArgvEnd)
    const parserRawArgv = rawArgv.slice(0, parserArgvEnd)
    // const commandArgv = foundCommand ? parsedArgv.slice(commandArgvStart) : []
    const commandRawArgv = foundCommand ? rawArgv.slice(commandArgvStart) : []

    // Process all argument types for the current parser/command
    const flagsAndOptions =
      args?.filter((arg) => arg.type === "flag" || arg.type === "option") || []
    const positionalsAndSequences =
      args?.filter((arg) => arg.type === "positional" || arg.type === "sequence") || []
    const infiniteSequences = args?.filter((arg) => arg.type === "infiniteSequence") || []

    // Process flags and options (can appear anywhere)
    const flagAndOptionResults: Record<
      string,
      Omit<ReturnType<typeof parseArg>, "consumedIndices">
    > = {}
    for (const arg of flagsAndOptions) {
      const result = parseArg({
        parsedArgv: parserArgv,
        rawArgv: parserRawArgv,
        arg,
        consumedIndices: new Set(consumedIndices),
        settings,
        path,
        baseOffset,
      })
      result.consumedIndices.forEach((index) => consumedIndices.add(index))
      const { consumedIndices: _, ...resultWithoutConsumedIndices } = result
      flagAndOptionResults[arg.name] = resultWithoutConsumedIndices
    }

    // Process positionals and sequences
    const positionalAndSequenceResults: Record<
      string,
      Omit<ReturnType<typeof parseArg>, "consumedIndices">
    > = {}
    for (const arg of positionalsAndSequences) {
      const result = parseArg({
        parsedArgv: parserArgv,
        rawArgv: parserRawArgv,
        arg,
        consumedIndices: new Set(consumedIndices),
        settings,
        path,
        baseOffset,
      })
      result.consumedIndices.forEach((index) => consumedIndices.add(index))
      const { consumedIndices: _, ...resultWithoutConsumedIndices } = result
      positionalAndSequenceResults[arg.name] = resultWithoutConsumedIndices
    }

    // Process infinite sequences (after regular positionals are consumed)
    const infiniteSequenceResults: Record<
      string,
      Omit<ReturnType<typeof parseArg>, "consumedIndices">
    > = {}
    for (const arg of infiniteSequences) {
      const result = parseArg({
        parsedArgv: parserArgv,
        rawArgv: parserRawArgv,
        arg,
        consumedIndices: new Set(consumedIndices),
        settings,
        path,
        baseOffset,
      })
      result.consumedIndices.forEach((index) => consumedIndices.add(index))
      const { consumedIndices: _, ...resultWithoutConsumedIndices } = result
      infiniteSequenceResults[arg.name] = resultWithoutConsumedIndices
    }

    // Combine parser results
    const allResults = {
      ...flagAndOptionResults,
      ...positionalAndSequenceResults,
      ...infiniteSequenceResults,
    }

    // Build commands result - process the nested commands
    const commandsResult: Record<
      string,
      ParserResult<NormalizedParserConfig<C>, "command">
    > = commands?.reduce((acc, command, idx) => {
      const isDetected = foundCommand?.commandIdx === idx

      if (isDetected && foundCommand) {
        // Create a recursive parser for the command
        const commandConfig = {
          ...command,
          name: command.name,
          type: "command" as const,
          settings,
          path: `${path}.${command.name}`,
          commands: command.commands || [],
        } as ReadyParserConfig<BareCommand, "command">

        // Calculate the offset for the command's argv slice
        const commandOffset = baseOffset + commandArgvStart

        const commandParser = createParse(commandConfig, () => commandRawArgv, commandOffset)

        // Parse the command arguments recursively
        const commandResult = commandParser(commandRawArgv)

        return {
          ...acc,
          [command.name]: {
            ...commandResult,
            detected: true,
            index: baseOffset + foundCommand.index,
            arguments: commandResult.arguments,
          },
        }
      }

      return {
        ...acc,
        [command.name]: {
          detected: isDetected,
          index: isDetected ? baseOffset + foundCommand!.index : -1,
          arguments: createEmptyArgumentsWithParser(command, config, `${path}.${command.name}`),
          commands: {},
        },
      }
    }, {}) || {}

    // Check for unhandled arguments
    const expectedArgvLength = parserArgv.length
    if (consumedIndices.size < expectedArgvLength) {
      const unhandledIndices: number[] = []
      for (let i = 0; i < expectedArgvLength; i++) {
        if (!consumedIndices.has(i)) {
          unhandledIndices.push(i)
        }
      }

      if (unhandledIndices.length > 0) {
        const firstUnhandledIndex = unhandledIndices[0]!
        const unhandledArg = rawArgv[firstUnhandledIndex]!

        throw new ParserError({
          message: `Unhandled argument: ${unhandledArg}`,
          code: "invalid_type",
          parser: path,
          from: "parser",
          argvIndex: baseOffset + firstUnhandledIndex,
          argumentName: unhandledArg,
          path: [path, firstUnhandledIndex],
        })
      }
    }

    // Filter results based on keepOnlyDetected setting
    const filteredArguments = settings.keepOnlyDetected
      ? Object.fromEntries(entries(allResults).filter(([_, arg]) => arg.detected))
      : allResults

    const filteredCommands = settings.keepOnlyDetected
      ? Object.fromEntries(entries(commandsResult).filter(([_, command]) => command.detected))
      : commandsResult

    // Create the base result object
    const baseResult = {
      ...(type === "parser" && { argv: parsedArgv }),
      arguments: filteredArguments,
      commands: filteredCommands,
    }

    // Add detected property for commands
    if (type === "command") {
      return {
        ...baseResult,
        detected,
      } as unknown as ParserResult<NormalizedParserConfig<C>, "command">
    }

    return baseResult as unknown as ParserResult<NormalizedParserConfig<C>, "parser">
  }
}

// Helper function to find a command at the current level only
function findCommandAtCurrentLevel(
  parsedArgv: string[],
  commands: ReadyParserConfig<ParserConfig, "parser" | "command">["commands"],
  settings: ParserSettings,
  path: string,
  consumedIndices: Set<number>
): { command: BareCommand; index: number; commandIdx: number } | null {
  if (!commands || commands.length === 0) {
    return null
  }

  // Look for the first command in parsedArgv that hasn't been consumed yet
  for (let argIndex = 0; argIndex < parsedArgv.length; argIndex++) {
    // Skip arguments that have been consumed
    if (consumedIndices.has(argIndex)) {
      continue
    }

    const arg = parsedArgv[argIndex]!

    // Check each command to see if it matches this argument
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]!
      const commandNames = [
        command.name,
        ...(Array.isArray(command.alias) ? command.alias : command.alias ? [command.alias] : []),
      ]

      // Match command name case-insensitively if settings require
      const normalizedCommandNames = settings.caseSensitive
        ? commandNames
        : commandNames.map((name) => name.toLowerCase())

      if (normalizedCommandNames.includes(arg)) {
        // Found a command
        consumedIndices.add(argIndex)
        return {
          command,
          index: argIndex,
          commandIdx: i,
        }
      }
    }
  }

  return null
}
