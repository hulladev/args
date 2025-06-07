import type { ArgumentConfig, InfiniteSequence } from "@/types/types.public"
import type { ZodTypeAny } from "zod"
import { array, string } from "zod"

export function infiniteSequence<const N extends string>(
  config: Omit<ArgumentConfig<N, "infiniteSequence", ZodTypeAny>, "schema">
): InfiniteSequence<N> {
  return {
    ...config,
    type: "infiniteSequence",
    schema: array(string()),
  }
}
