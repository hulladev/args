import { ParserError } from "@/lib/errors"
import type { Flag, Option, ParserConfig } from "@/types/types.public"
import { mapKey } from "@/util/arrays"
import type { ZodBoolean, ZodTypeAny } from "zod"

export function prepareArgs<C extends ParserConfig>(config: C): NonNullable<C["arguments"]> {
  const args: Array<NonNullable<C["arguments"]>[number] & { short?: string; long?: string }> = []
  const argumentsList = config.arguments || []

  // Track if we've seen an infiniteSequence
  let hasInfiniteSequence = false

  for (const arg of argumentsList) {
    if (mapKey(args, "name").includes(arg.name)) {
      throw new ParserError({
        message: `Duplicate argument name: "${arg.name}"`,
        code: "ambiguous_arguments",
        parser: config.name,
        from: "parser",
        argvIndex: -1,
        argumentName: arg.name,
        path: [config.name],
      })
    }

    // Check if there's a positional, sequence, or infiniteSequence after an infiniteSequence
    if (
      hasInfiniteSequence &&
      (arg.type === "positional" || arg.type === "sequence" || arg.type === "infiniteSequence")
    ) {
      throw new ParserError({
        message: `Cannot define ${arg.type} "${arg.name}" after an infiniteSequence`,
        code: "ambiguous_arguments",
        parser: config.name,
        from: "parser",
        argvIndex: -1,
        argumentName: arg.name,
        path: [config.name],
      })
    }

    // Mark if we've seen an infiniteSequence
    if (arg.type === "infiniteSequence") {
      hasInfiniteSequence = true
    }

    let short = ""
    let long = ""
    if (arg.type === "flag" || arg.type === "option") {
      // Check if there's a custom long/short property already set
      const typedArg = arg as Flag<string, ZodBoolean> | Option<string, ZodTypeAny>

      // Use the custom short value if provided, otherwise generate from name
      short =
        typedArg.short ??
        (config.settings?.caseSensitive ? arg.name[0]! : arg.name[0]!.toLowerCase())

      // @ts-expect-error Not all arguments have a short key
      if (mapKey(args, "short").includes(short)) {
        throw new ParserError({
          message: `Duplicate short argument: ${short}`,
          code: "ambiguous_arguments",
          parser: config.name,
          from: "parser",
          argvIndex: -1,
          argumentName: arg.name,
          path: [config.name],
        })
      }

      // Use the custom long value if provided, otherwise use the name
      long = typedArg.long ?? (config.settings?.caseSensitive ? arg.name! : arg.name!.toLowerCase())

      // @ts-expect-error Not all arguments have a short key
      if (mapKey(args, "long").includes(long)) {
        throw new ParserError({
          message: `Duplicate long argument: ${long}`,
          code: "ambiguous_arguments",
          parser: config.name,
          from: "parser",
          argvIndex: -1,
          argumentName: arg.name,
          path: [config.name],
        })
      }
    }

    args.push({
      ...arg,
      ...(short ? { short } : {}),
      ...(long ? { long } : {}),
    })
  }
  return args as NonNullable<C["arguments"]>
}
