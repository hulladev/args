import { command, flag, option, positional, sequence } from "@/index"
import type { Argument, Command, Flag, Positional, Sequence } from "@/types/types.public"
import { describe, expectTypeOf, test } from "vitest"
import type { ZodArray, ZodPipeline, ZodString } from "zod"
import { z, type ZodBoolean } from "zod"

describe("flag", () => {
  test("flag without schema", () => {
    expectTypeOf(flag({ name: "test" })).toEqualTypeOf<Flag<"test", ZodBoolean>>()
  })
  test("flag with schema", () => {
    expectTypeOf(flag({ name: "test", schema: z.boolean() })).toEqualTypeOf<
      Flag<"test", ZodBoolean>
    >()
  })
  test("flag with override string schema", () => {
    expectTypeOf(flag({ name: "test", schema: z.string() })).toEqualTypeOf<
      Flag<"test", ZodString>
    >()
  })
  test("schema with pipe", () => {
    expectTypeOf(flag({ name: "test", schema: z.boolean().pipe(z.string()) })).toEqualTypeOf<
      Flag<"test", ZodPipeline<ZodBoolean, ZodString>>
    >()
  })
  test("flag with description", () => {
    expectTypeOf(flag({ name: "test", description: "test flag" })).toEqualTypeOf<
      Flag<"test", ZodBoolean>
    >()
  })
  test("flag with long and short names", () => {
    expectTypeOf(flag({ name: "test", long: "long", short: "s" })).toEqualTypeOf<
      Flag<"test", ZodBoolean>
    >()
  })
  test("flag with long name only", () => {
    expectTypeOf(flag({ name: "test", long: "long" })).toEqualTypeOf<Flag<"test", ZodBoolean>>()
  })
})

describe("option", () => {
  test("option without schema", () => {
    expectTypeOf(option({ name: "test" })).toEqualTypeOf<Argument<"test", "option", ZodString>>()
  })
  test("option with schema", () => {
    expectTypeOf(option({ name: "test", schema: z.boolean() })).toEqualTypeOf<
      Argument<"test", "option", ZodBoolean>
    >()
  })
  test("option with override string schema", () => {
    expectTypeOf(option({ name: "test", schema: z.string() })).toEqualTypeOf<
      Argument<"test", "option", ZodString>
    >()
  })
  test("schema with pipe", () => {
    expectTypeOf(option({ name: "test", schema: z.boolean().pipe(z.string()) })).toEqualTypeOf<
      Argument<"test", "option", ZodPipeline<ZodBoolean, ZodString>>
    >()
  })
  test("option with description", () => {
    expectTypeOf(option({ name: "test", description: "test option" })).toEqualTypeOf<
      Argument<"test", "option", ZodString>
    >()
  })
  test("option with long and short names", () => {
    expectTypeOf(option({ name: "test", long: "long", short: "s" })).toEqualTypeOf<
      Argument<"test", "option", ZodString>
    >()
  })
  test("option with long name only", () => {
    expectTypeOf(option({ name: "test", long: "long" })).toEqualTypeOf<
      Argument<"test", "option", ZodString>
    >()
  })
  test("option with short name only", () => {
    expectTypeOf(option({ name: "test", short: "s" })).toEqualTypeOf<
      Argument<"test", "option", ZodString>
    >()
  })
  test("option with long and short names and description", () => {
    expectTypeOf(
      option({
        name: "test",
        long: "long",
        short: "s",
        description: "test option",
      })
    ).toEqualTypeOf<Argument<"test", "option", ZodString>>()
  })
  test("option with long name only and description", () => {
    expectTypeOf(option({ name: "test", long: "long", description: "test option" })).toEqualTypeOf<
      Argument<"test", "option", ZodString>
    >()
  })
  test("option with short name only and description", () => {
    expectTypeOf(option({ name: "test", short: "s", description: "test option" })).toEqualTypeOf<
      Argument<"test", "option", ZodString>
    >()
  })
  test("option with long and short names and schema", () => {
    expectTypeOf(
      option({ name: "test", long: "long", short: "s", schema: z.string() })
    ).toEqualTypeOf<Argument<"test", "option", ZodString>>()
  })
  test("option with long name only and schema", () => {
    expectTypeOf(option({ name: "test", long: "long", schema: z.string() })).toEqualTypeOf<
      Argument<"test", "option", ZodString>
    >()
  })
})

describe("positional", () => {
  test("positional without schema", () => {
    expectTypeOf(positional({ name: "test" })).toEqualTypeOf<
      Argument<"test", "positional", ZodString>
    >()
  })
  test("positional with schema", () => {
    expectTypeOf(positional({ name: "test", schema: z.boolean() })).toEqualTypeOf<
      Argument<"test", "positional", ZodBoolean>
    >()
  })
  test("positional with override string schema", () => {
    expectTypeOf(positional({ name: "test", schema: z.string() })).toEqualTypeOf<
      Argument<"test", "positional", ZodString>
    >()
  })
  test("schema with pipe", () => {
    expectTypeOf(positional({ name: "test", schema: z.boolean().pipe(z.string()) })).toEqualTypeOf<
      Argument<"test", "positional", ZodPipeline<ZodBoolean, ZodString>>
    >()
  })
  test("positional with description", () => {
    expectTypeOf(positional({ name: "test", description: "test positional" })).toEqualTypeOf<
      Argument<"test", "positional", ZodString>
    >()
  })
  test("positional should not accept long and short names", () => {
    // @ts-expect-error long property doesn't apply to positionals
    positional({ name: "test", long: "long", short: "s" })
  })
  test("positional should not accept long name", () => {
    // @ts-expect-error long property doesn't apply to positionals
    positional({ name: "test", long: "long" })
  })
})

describe("sequence", () => {
  test("sequence without schema", () => {
    expectTypeOf(
      sequence({ name: "test", arguments: [positional({ name: "test" })] })
    ).toEqualTypeOf<
      Sequence<"test", ZodArray<ZodString, "many">, Positional<"test", ZodString>[]>
    >()
  })
  test("sequence with 2 positionals", () => {
    expectTypeOf(
      sequence({
        name: "test",
        arguments: [positional({ name: "test" }), positional({ name: "test2" })],
      })
    ).toEqualTypeOf<
      Sequence<
        "test",
        ZodArray<ZodString, "many">,
        (Positional<"test", ZodString> | Positional<"test2", ZodString>)[]
      >
    >()
  })
})

describe("command", () => {
  test("command without schema", () => {
    expectTypeOf(command({ name: "test" })).toEqualTypeOf<Command<"test", []>>()
  })
  test("command with arguments", () => {
    expectTypeOf(
      command({ name: "test", arguments: [positional({ name: "test" })] })
    ).toEqualTypeOf<Command<"test", [Positional<"test", ZodString>], []>>()
  })
  test("command with commands", () => {
    const c = command({
      name: "test",
      arguments: [positional({ name: "test" })],
      commands: [command({ name: "test2" })],
    })
    expectTypeOf(c).toEqualTypeOf<
      Command<"test", [Positional<"test", ZodString>], [Command<"test2", [], []>]>
    >()
  })
})
