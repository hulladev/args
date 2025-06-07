import type { ArgumentConfig, Option as OptionType } from "@/types/types.public"
import { withoutPrefix } from "@/util/strings"
import type { ZodString, ZodTypeAny } from "zod"
import { string } from "zod"

// Function overload for when a schema is explicitly provided
export function option<const N extends string, const Z extends ZodTypeAny>(
  config: ArgumentConfig<N, "option", Z> & { schema: Z }
): OptionType<N, Z>

// Function overload for when no schema is provided - returns ZodString
export function option<const N extends string>(
  config: Omit<ArgumentConfig<N, "option", ZodString>, "schema">
): OptionType<N, ZodString>

// Implementation
export function option<const N extends string, const Z extends ZodTypeAny = ZodString>({
  schema,
  ...config
}: ArgumentConfig<N, "option", Z>): OptionType<N, Z> {
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
    type: "option",
    long: longValue,
    short: shortValue,
    schema: schema ?? (string() as unknown as Z),
  } as OptionType<N, Z>
}
