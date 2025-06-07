import type { output, ZodArray, ZodTypeAny } from "zod"
import type {
  BareCommand,
  FindArg,
  GenericParserConfig,
  NormalizedParserConfig,
} from "./types.private"

export type ArgType = "flag" | "option" | "positional" | "sequence" | "infiniteSequence"

export type Argument<N extends string, AT extends ArgType, Z extends ZodTypeAny> = {
  name: N
  description?: string
  type: AT
  schema: Z
}

export type ArgumentConfig<
  N extends string,
  AT extends ArgType,
  Z extends ZodTypeAny,
  A extends Argument<string, ArgType, ZodTypeAny>[] = [],
> = {
  name: N
  description?: string
  schema?: Z
} & (AT extends "flag" | "option"
  ? { long?: string | string[]; short?: string | string[] }
  : AT extends "sequence"
    ? { arguments: A; schema: never }
    : {})

export type CommandConfig<
  N extends string,
  A extends Argument<string, ArgType, ZodTypeAny>[],
  C extends BareCommand[] = [],
> = {
  name: N
  description?: string
  arguments?: A
  commands?: C
  alias?: string | string[]
}

export type Flag<N extends string, Z extends ZodTypeAny> = Argument<N, "flag", Z> & {
  long: string | string[]
  short: string | string[]
}
export type Option<N extends string, Z extends ZodTypeAny> = Argument<N, "option", Z> & {
  long: string | string[]
  short: string | string[]
}
export type Positional<N extends string, Z extends ZodTypeAny> = Argument<N, "positional", Z>

export type Sequence<
  N extends string,
  Z extends ZodTypeAny,
  A extends Positional<string, ZodTypeAny>[],
> = Argument<N, "sequence", Z> & {
  arguments: A
}

export type InfiniteSequence<N extends string> = Argument<
  N,
  "infiniteSequence",
  ZodArray<ZodTypeAny>
> & {
  schema: ZodArray<ZodTypeAny>
}

export type Command<
  N extends string,
  A extends Argument<string, ArgType, ZodTypeAny>[] = [],
  C extends BareCommand[] = [],
> = GenericParserConfig<N, A, C> & {
  alias?: string | string[]
  type: "command"
}

export type PossibleArguments =
  | Flag<string, ZodTypeAny>
  | Option<string, ZodTypeAny>
  | Positional<string, ZodTypeAny>
  | Sequence<string, ZodTypeAny, Positional<string, ZodTypeAny>[]>
  | InfiniteSequence<string>

export type ParserSettingsInit = {
  caseSensitive?: boolean
  startIndex?: number
  stopIndex?: number | null
  requireEquals?: boolean
  mode?: "both" | "long" | "short"
  keepOnlyDetected?: boolean
}

export type ParserSettings = {
  [K in keyof ParserSettingsInit]-?: ParserSettingsInit[K]
}

export type ParserConfig = {
  name: string
  arguments?: Argument<string, ArgType, ZodTypeAny>[]
  commands?: BareCommand[]
  settings?: ParserSettingsInit
}

export type ArgOutput<
  C extends { name: string; arguments: readonly Argument<string, ArgType, ZodTypeAny>[] },
  N extends C["arguments"][number]["name"],
> = {
  value: output<FindArg<C, N>["schema"]>
  raw: string | undefined
  index: number
  detected: boolean
  parser: C["name"]
}

export type Parser<C extends ParserConfig> = {
  name: C["name"]
  settings: ParserSettings
  read: (argv: string[]) => string[]
  parse: (argv: string[]) => ParserResult<NormalizedParserConfig<C>>
}

export type ParserResult<
  C extends {
    name: string
    arguments: readonly Argument<string, ArgType, ZodTypeAny>[]
    commands: readonly BareCommand[]
  },
  ParserType extends "parser" | "command" = "parser",
> = {
  arguments: {
    [K in C["arguments"][number]["name"]]: ArgOutput<C, K>
  }
  commands: C["commands"] extends BareCommand[]
    ? {
        [K in C["commands"][number] as K["name"]]: ParserResult<
          NormalizedParserConfig<K>,
          "command"
        >
      }
    : {}
} & (ParserType extends "command" ? { detected: boolean } : { argv: string[] })
