import type { ArgumentConfig, Positional } from "@/types/types.public"
import type { ZodString, ZodTypeAny } from "zod"
import { string } from "zod"

// Function overload for when a schema is explicitly provided
export function positional<const N extends string, const Z extends ZodTypeAny>(
  config: ArgumentConfig<N, "positional", Z> & { schema: Z }
): Positional<N, Z>

// Function overload for when no schema is provided - returns ZodString
export function positional<const N extends string>(
  config: Omit<ArgumentConfig<N, "positional", ZodString>, "schema">
): Positional<N, ZodString>

// Implementation
export function positional<const N extends string, const Z extends ZodTypeAny = ZodString>({
  schema,
  ...config
}: ArgumentConfig<N, "positional", Z>): Positional<N, Z> {
  return {
    ...config,
    type: "positional",
    schema: schema ?? (string() as unknown as Z),
  }
}
