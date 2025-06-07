import { withoutPrefix } from "@/util/strings"
import type { ZodTypeAny } from "zod"
import { boolean, type ZodBoolean } from "zod"
import type { ArgumentConfig, Flag } from "../types/types.public"

// Function overload for when a schema is explicitly provided
export function flag<const N extends string, const Z extends ZodTypeAny>(
  config: ArgumentConfig<N, "flag", Z> & { schema: Z }
): Flag<N, Z>

// Function overload for when no schema is provided - returns ZodBoolean
export function flag<const N extends string>(
  config: Omit<ArgumentConfig<N, "flag", ZodBoolean>, "schema">
): Flag<N, ZodBoolean>

// Implementation
export function flag<const N extends string, const Z extends ZodTypeAny>({
  schema,
  ...config
}: ArgumentConfig<N, "flag", Z>): Flag<N, Z> {
  const defaultName = withoutPrefix(config.name, "-")
  const defaultShort = withoutPrefix(config.name[0] || "", "-")

  // For the long form, handle both string and array inputs
  let longValue: string | string[]
  if (config.long) {
    // If long is already an array, add the default name to it
    if (Array.isArray(config.long)) {
      const longArray = config.long.map((l) => withoutPrefix(l, "-"))
      longValue = [...longArray, defaultName]
    } else {
      // Otherwise, create an array with both the custom and default names
      longValue = [withoutPrefix(config.long, "-"), defaultName]
    }
  } else {
    // If no custom long provided, just use the default name
    longValue = defaultName
  }

  // For the short form, handle both string and array inputs
  let shortValue: string | string[]
  if (config.short) {
    // If short is already an array, use it directly
    if (Array.isArray(config.short)) {
      shortValue = config.short.map((s) => withoutPrefix(s, "-"))
    } else {
      // Otherwise, use the provided short value
      shortValue = withoutPrefix(config.short, "-")
    }
  } else {
    // If no custom short provided, use first letter of name
    shortValue = defaultShort
  }

  return {
    ...config,
    type: "flag",
    long: longValue,
    short: shortValue,
    schema: schema ?? (boolean() as unknown as Z),
  }
}
