import type { ArgHandlerOutput, MergedConfig } from "@/types/types.private"
import type { ArgOutput, Positional } from "@/types/types.public"
import type { ZodTypeAny } from "zod"
import { handleSchema } from "../handlers/handleSchema"
import type { ValueParams } from "./parseArg"

export function parsePositional<C extends MergedConfig, A extends Positional<string, ZodTypeAny>>({
  parsedArgv,
  rawArgv,
  arg,
  consumedIndices,
  path,
  baseOffset = 0,
}: ValueParams<A>): ArgHandlerOutput<ArgOutput<C, A["name"]>> {
  // With positionals it's bit tricky, since we have no way of knowing which string value is positional unless
  // we will need to filter against the consumedIndices, but at the same time the resulting index will need to refer
  // to the original parsedArgv, so we need to keep track of the consumed indices
  // and the index of the positional argument in the parsedArgv
  // Find the first non-option argument that hasn't been consumed yet
  let index = -1
  for (let i = 0; i < parsedArgv.length; i++) {
    if (!parsedArgv[i]!.startsWith("-") && !consumedIndices.has(i)) {
      index = i
      break
    }
  }

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

  // Mark this index as consumed
  consumedIndices.add(index)

  // Parse the value
  const raw = rawArgv[index]!
  const value = rawArgv[index]!

  return {
    consumedIndices,
    value: handleSchema({ path, schema: arg.schema, value }),
    raw,
    index: baseOffset + index,
    detected: true,
    parser: path,
  }
}
