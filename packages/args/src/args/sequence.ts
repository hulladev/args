import type { ArgumentConfig, Positional, Sequence } from "@/types/types.public"
import type { ZodArray, ZodTypeAny } from "zod"
import { array } from "zod"

// Function overload for when no schema is provided - returns a tuple schema
export function sequence<const N extends string, A extends Positional<string, ZodTypeAny>[]>(
  config: Omit<ArgumentConfig<N, "sequence", ZodTypeAny>, "schema" | "arguments"> & {
    arguments: A
  }
): Sequence<N, ZodArray<A[number]["schema"]>, A> {
  return {
    ...config,
    type: "sequence",
    schema: array(
      //@ts-expect-error cant get typing right with this specific zod override but should be fine
      config.arguments.map((arg) => arg.schema)
    ) as unknown as ZodArray<A[number]["schema"]>,
    arguments: config.arguments,
  }
}
