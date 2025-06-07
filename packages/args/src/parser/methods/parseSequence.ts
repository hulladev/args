import type { ArgHandlerOutput, MergedConfig, ValueParams } from "@/types/types.private"
import type { ArgOutput, Positional, Sequence } from "@/types/types.public"
import type { ZodTypeAny } from "zod"
import { Parsers } from "./parsers"

export function parseSequence<
  C extends MergedConfig,
  A extends Sequence<string, ZodTypeAny, Positional<string, ZodTypeAny>[]>,
>({
  parsedArgv,
  rawArgv,
  arg,
  settings,
  consumedIndices,
  path,
  baseOffset = 0,
}: ValueParams<A>): ArgHandlerOutput<ArgOutput<C, A["name"]>> {
  // Create a copy of the consumed indices set to avoid modifying the original
  const updatedConsumedIndices = new Set(consumedIndices)

  // A sequence needs to match all its arguments in order
  const sequenceArguments = arg.arguments

  // Track the matched arguments with their complete results in an object mapping
  const argumentResults: Record<
    string,
    Omit<ArgHandlerOutput<ArgOutput<C, C["arguments"][number]["name"]>>, "consumedIndices">
  > = {}
  const matchedRaw: string[] = []
  const matchedIndices: number[] = []

  // Get the parseArg function from the registry
  const parseArg = Parsers.getInstance().getParseArg()

  // Process each argument in the sequence
  for (const sequenceArg of sequenceArguments) {
    // Call the appropriate parser for this argument
    const result = parseArg<C>({
      parsedArgv,
      rawArgv,
      arg: sequenceArg,
      settings,
      consumedIndices: new Set(updatedConsumedIndices), // Pass a copy to avoid early modification
      path: `${path}.${sequenceArg.name}`,
      baseOffset,
    })

    // If any argument in the sequence wasn't found, the sequence is incomplete
    if (!result.detected) {
      return {
        consumedIndices: new Set(consumedIndices), // Return original set, don't consume anything
        value: undefined,
        raw: undefined,
        index: -1,
        detected: false,
        parser: path,
      }
    }

    // Store the complete result object in the mapping, not just the value
    const { consumedIndices: _, ...resultWithoutConsumedIndices } = result
    argumentResults[sequenceArg.name] = resultWithoutConsumedIndices

    // Collect raw values and indices for metadata
    if (result.raw !== undefined) {
      matchedRaw.push(result.raw)
    }
    if (result.index !== -1) {
      matchedIndices.push(result.index)
    }

    // Update the consumed indices for the next argument in the sequence
    result.consumedIndices.forEach((index) => updatedConsumedIndices.add(index))
  }

  // If we got here, we found all arguments in the sequence
  const startIndex = matchedIndices.length > 0 ? Math.min(...matchedIndices) : -1
  const combinedRaw = matchedRaw.join(" ")

  return {
    consumedIndices: updatedConsumedIndices,
    // Just return the object mapping directly - no schema validation at sequence level
    value: argumentResults,
    raw: combinedRaw,
    index: startIndex,
    detected: startIndex !== -1,
    parser: path,
  }
}
