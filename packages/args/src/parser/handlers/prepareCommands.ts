import { ParserError } from "@/lib/errors"
import type { BareCommand, PreparedCommands } from "@/types/types.private"
import type { ArgType, Argument, Command, ParserConfig } from "@/types/types.public"
import { mapKey } from "@/util/arrays"
import type { ZodTypeAny } from "zod"

export function prepareCommands<C extends ParserConfig>(config: C): PreparedCommands<C> {
  const commands: PreparedCommands<C> = []
  for (const command of config.commands ?? []) {
    if (mapKey(commands, "name").includes(command.name)) {
      throw new ParserError({
        message: `Duplicate command name: "${command.name}"`,
        code: "ambiguous_arguments",
        parser: config.name,
        from: "parser",
        argvIndex: -1,
        argumentName: command.name,
        path: [config.name],
      })
    }
    commands.push(
      command as Command<string, Argument<string, ArgType, ZodTypeAny>[], BareCommand[]>
    )
  }
  return commands
}
