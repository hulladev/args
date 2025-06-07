import type { BareCommand, ReadyParserConfig } from "@/types/types.private"
import type { ZodTypeAny } from "zod"
import type {
  ArgType,
  Argument,
  Parser,
  ParserConfig,
  ParserSettings,
  ParserSettingsInit,
} from "../types/types.public"
import { prepareArgs } from "./handlers/prepareArgs"
import { prepareCommands } from "./handlers/prepareCommands"
import { initSettings } from "./handlers/settings"
import { createParse } from "./parse"
import { createRead } from "./read"

// Important: This overload should stay on top as it provides the most specific type inference
// for the intelisense.
// Overload 1: Name, commands, arguments, settings
export function parser<
  const N extends string,
  const A extends Argument<string, ArgType, ZodTypeAny>[],
  const C extends BareCommand[],
  const S extends ParserSettingsInit,
>(config: {
  name: N
  arguments: A
  commands: C
  settings: S
}): Parser<{ name: N; arguments: A; commands: C; settings: S }>

// Overload 2: Only name, arguments
export function parser<
  const N extends string,
  const A extends Argument<string, ArgType, ZodTypeAny>[],
>(config: {
  name: N
  arguments: A
}): Parser<{ name: N; arguments: A; commands: []; settings: ParserSettings }>

// Overload 3: Only name, commands
export function parser<const N extends string, const C extends BareCommand[]>(config: {
  name: N
  commands: C
}): Parser<{ name: N; arguments: []; commands: C; settings: ParserSettings }>

// Overload 4: Name, commands, arguments
export function parser<
  const N extends string,
  const A extends Argument<string, ArgType, ZodTypeAny>[],
  const C extends BareCommand[],
>(config: {
  name: N
  arguments: A
  commands: C
}): Parser<{ name: N; arguments: A; commands: C; settings: ParserSettings }>

// Overload 5: Name, arguments, settings
export function parser<
  const N extends string,
  const A extends Argument<string, ArgType, ZodTypeAny>[],
  const S extends ParserSettingsInit,
>(config: {
  name: N
  arguments: A
  settings: S
}): Parser<{ name: N; arguments: A; commands: []; settings: S }>

// Overload 6: Name, commands, settings
export function parser<
  const N extends string,
  const C extends BareCommand[],
  const S extends ParserSettingsInit,
>(config: {
  name: N
  commands: C
  settings: S
}): Parser<{ name: N; arguments: []; commands: C; settings: S }>

// Implementation
export function parser<const C extends ParserConfig>(config: C): Parser<C> {
  const settings: ParserSettings = initSettings(config)
  const normalizedConfig = {
    ...config,
    arguments: config.arguments ?? [],
    commands: config.commands ?? [],
    settings,
  }
  const args = prepareArgs(normalizedConfig)
  const commands = prepareCommands(normalizedConfig)
  const preparedConfig: ReadyParserConfig<C> = {
    ...normalizedConfig,
    arguments: args,
    commands,
    path: normalizedConfig.name,
    type: "parser",
    settings,
  }
  const read = createRead(preparedConfig)
  const parse = createParse(preparedConfig, read)
  return {
    name: normalizedConfig.name,
    settings,
    read,
    // @ts-expect-error recursive parse type, cannot tell from runtime if it's parsing top level parser or recursive command
    parse,
  }
}
