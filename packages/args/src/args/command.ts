import type { BareCommand } from "@/types/types.private"
import type { ArgType, Argument, Command, CommandConfig } from "@/types/types.public"
import type { ZodTypeAny } from "zod"

// Overload 4: With both arguments and commands
export function command<
  const N extends string,
  const A extends Argument<string, ArgType, ZodTypeAny>[],
  const C extends BareCommand[],
>(config: CommandConfig<N, A, C>): Command<N, A, C>

// Overload 1: No arguments, no commands
export function command<const N extends string>(config: {
  name: N
  description?: string
}): Command<N, [], []>

// Overload 2: With arguments, no commands
export function command<
  const N extends string,
  const A extends Argument<string, ArgType, ZodTypeAny>[],
>(config: { name: N; description?: string; arguments: A }): Command<N, A, []>

// Overload 3: No arguments, with commands
export function command<const N extends string, const C extends BareCommand[]>(config: {
  name: N
  description?: string
  commands: C
}): Command<N, [], C>

// Implementation
export function command<
  const N extends string,
  const A extends Argument<string, ArgType, ZodTypeAny>[] = [],
  const C extends BareCommand[] = [],
>(config: CommandConfig<N, A, C>): Command<N, A, C> {
  return {
    ...config,
    type: "command",
    arguments: config.arguments ?? ([] as unknown as A),
    commands: config.commands ?? ([] as unknown as C),
  }
}
