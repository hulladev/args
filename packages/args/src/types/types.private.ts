import type { ZodTypeAny } from "zod"
import type {
  ArgOutput,
  ArgType,
  Argument,
  Command,
  ParserConfig,
  ParserSettings,
} from "./types.public"

export type BareCommand = Omit<ParserConfig, "settings"> & {
  type: "command"
}

export type ArgSchemas<A extends Argument<string, ArgType, ZodTypeAny>[]> = A[number]["schema"]

// Utility type to normalize ParserConfig with default empty arrays
export type NormalizedParserConfig<C extends ParserConfig | BareCommand> = C & {
  arguments: C["arguments"] extends Argument<string, ArgType, ZodTypeAny>[] ? C["arguments"] : []
  commands: C["commands"] extends BareCommand[] ? C["commands"] : []
}

// MergedConfig should accept any config that can be normalized
export type MergedConfig =
  | NormalizedParserConfig<ParserConfig>
  | NormalizedParserConfig<BareCommand>
  | NormalizedParserConfig<Command<string, Argument<string, ArgType, ZodTypeAny>[], BareCommand[]>>

export type StringKey<K extends string | number | symbol> = K extends string ? K : never

export type FindArg<
  C extends {
    arguments: readonly Argument<string, ArgType, ZodTypeAny>[]
    commands?: readonly BareCommand[]
  },
  N extends C["arguments"][number]["name"] | StringKey<keyof C["commands"]>,
> = C["arguments"][number] extends Argument<N, infer AT, infer Z> ? Argument<N, AT, Z> : never

export type ReadyParserConfig<
  C extends ParserConfig | BareCommand,
  ParserType extends "parser" | "command" = "parser",
> = Omit<C, "settings" | "commands" | "argv"> & {
  settings: ParserSettings
  path: string
  type: ParserType
  commands: Command<string, Argument<string, ArgType, ZodTypeAny>[], BareCommand[]>[]
}

export type ArgHandlerOutput<AO extends ArgOutput<MergedConfig, string>> = AO & {
  consumedIndices: Set<number>
}

export type GenericParserConfig<
  N extends string,
  A extends Argument<string, ArgType, ZodTypeAny>[],
  C extends BareCommand[],
> = {
  name: N
  arguments: A
  commands: C
}

export type CommandHandlerOutput<
  C extends Command<string, Argument<string, ArgType, ZodTypeAny>[], BareCommand[]>,
> = {
  [K in C["name"]]: {
    detected: boolean
    arguments: {
      [A in C["arguments"][number]["name"]]: ArgHandlerOutput<
        ArgOutput<NormalizedParserConfig<C>, A>
      >
    }
  }
}

export type PreparedCommands<C extends ParserConfig> = C["commands"] extends Command<
  string,
  Argument<string, ArgType, ZodTypeAny>[],
  BareCommand[]
>[]
  ? C["commands"]
  : Command<string, Argument<string, ArgType, ZodTypeAny>[], BareCommand[]>[]

export type AnyArgOutput = ArgOutput<
  { name: string; arguments: readonly Argument<string, ArgType, ZodTypeAny>[] },
  string
>

// Common parameter type for all parse functions
export type ValueParams<A extends Argument<string, ArgType, ZodTypeAny>> = {
  parsedArgv: string[]
  rawArgv: string[]
  consumedIndices: Set<number>
  arg: A
  settings: ParserSettings
  path: string
  baseOffset?: number
}

// Function signature for parse functions
export type ParseFunction = <C extends NormalizedParserConfig<MergedConfig>>(
  params: ValueParams<C["arguments"][number]>
) => ArgHandlerOutput<ArgOutput<C, C["arguments"][number]["name"]>>
