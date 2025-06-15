import type { ArgumentConfig, InfiniteSequence } from "@/types/types.public"
import type { ZodArray, ZodString } from "zod"
import { array, string } from "zod"

// Overload for when schema is provided - must be array of strings
export function infiniteSequence<const N extends string>(
  config: ArgumentConfig<N, "infiniteSequence", ZodArray<ZodString>>
): InfiniteSequence<N>

// Overload for when no schema is provided - defaults to array of strings
export function infiniteSequence<const N extends string>(
  config: Omit<ArgumentConfig<N, "infiniteSequence", never>, "schema">
): InfiniteSequence<N>

// Implementation
export function infiniteSequence<const N extends string>(
  config: ArgumentConfig<N, "infiniteSequence", ZodArray<ZodString> | never>
): InfiniteSequence<N> {
  return {
    ...config,
    type: "infiniteSequence",
    schema: config.schema ?? array(string()),
  }
}
