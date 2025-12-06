import { search } from "@/lib/search"
import type { ArgHandlerOutput, MergedConfig } from "@/types/types.private"
import type { ArgOutput, Flag } from "@/types/types.public"
import type { ZodTypeAny } from "zod"
import { handleSchema } from "../handlers/handleSchema"
import type { ValueParams } from "./parseArg"

export function parseFlag<C extends MergedConfig, A extends Flag<string, ZodTypeAny>>({
  parsedArgv,
  rawArgv,
  arg,
  settings,
  consumedIndices,
  path,
  baseOffset = 0,
  searchStartIndex = 0,
}: ValueParams<A>): ArgHandlerOutput<ArgOutput<C, A["name"]>> {
  // When mergeArgs is enabled and searchStartIndex is provided,
  // first search from searchStartIndex onwards, then search before if not found
  let index = search({
    settings,
    parsedArgv,
    commandOrArgument: arg,
    parser: path,
    startIndex: searchStartIndex,
  })

  // If not found and searchStartIndex > 0, search from the beginning (for mergeArgs)
  if (index === -1 && searchStartIndex > 0 && settings.mergeArgs) {
    index = search({
      settings,
      parsedArgv,
      commandOrArgument: arg,
      parser: path,
      startIndex: 0,
    })
    // Make sure we don't find something at or after searchStartIndex
    // (which would have been found in the first search)
    if (index >= searchStartIndex) {
      index = -1
    }
  }

  if (index !== -1) {
    // Remove the segments from the parsedArgv
    consumedIndices.add(index)
  }

  return {
    value:
      index === -1
        ? handleSchema({ path, schema: arg.schema, value: false })
        : handleSchema({ path, schema: arg.schema, value: true }),
    raw: rawArgv[index],
    consumedIndices: new Set(consumedIndices),
    index: index === -1 ? -1 : baseOffset + index,
    detected: index !== -1,
    parser: path,
  }
}
