import type { ArgHandlerOutput, MergedConfig } from "@/types/types.private"
import type { ArgOutput, InfiniteSequence } from "@/types/types.public"
import { handleSchema } from "../handlers/handleSchema"
import type { ValueParams } from "./parseArg"

export function parseInfiniteSequence<C extends MergedConfig, A extends InfiniteSequence<string>>({
  parsedArgv,
  rawArgv,
  arg,
  settings,
  consumedIndices,
  path,
  baseOffset = 0,
}: ValueParams<A>): ArgHandlerOutput<ArgOutput<C, A["name"]>> {
  // Find all non-consumed, non-option arguments
  // Since commands are already handled by the main parser, parserArgv only contains
  // arguments before any command, so we can safely consume all positionals
  const availablePositionals: { value: string; index: number }[] = []

  for (let i = 0; i < parsedArgv.length; i++) {
    const argValue = parsedArgv[i]!

    // Skip already consumed arguments
    if (consumedIndices.has(i)) {
      continue
    }

    // Skip arguments that start with dash (flags/options)
    if (argValue.startsWith("-")) {
      continue
    }

    // This is a positional argument, add it to our collection
    availablePositionals.push({ value: rawArgv[i]!, index: i })
  }

  if (availablePositionals.length === 0) {
    return {
      consumedIndices,
      value: handleSchema({ path, schema: arg.schema, value: [] }),
      raw: undefined,
      index: -1,
      detected: false,
      parser: path,
    }
  }

  // Mark all collected indices as consumed
  const updatedConsumedIndices = new Set(consumedIndices)
  availablePositionals.forEach(({ index }) => {
    updatedConsumedIndices.add(index)
  })

  // Extract values and create output
  const values = availablePositionals.map(({ value }) => value)
  const firstIndex = availablePositionals[0]!.index
  const combinedRaw = values.join(" ")

  return {
    consumedIndices: updatedConsumedIndices,
    value: handleSchema({ path, schema: arg.schema, value: values }),
    raw: combinedRaw,
    index: baseOffset + firstIndex,
    detected: true,
    parser: path,
  }
}
