import { command } from "@/args/command"
import { flag } from "@/args/flag"
import { option } from "@/args/option"
import { parser } from "@/parser/parser"
import { describe, expect, test } from "vitest"

describe("Case sensitivity", () => {
  test("case sensitivity should be respected when enabled", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "help" }), flag({ name: "HELP" })],
      settings: {
        caseSensitive: true,
      },
    })

    const result = p.parse(["--help", "--HELP"])
    expect(result.arguments.help.value).toBe(true)
    expect(result.arguments.HELP.value).toBe(true)
  })

  test("case sensitivity should be ignored when disabled", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "help" })],
      settings: {
        caseSensitive: false,
      },
    })

    const result = p.parse(["--HELP"])
    expect(result.arguments.help.value).toBe(true)
  })

  test("case sensitivity affects command names when enabled", () => {
    const p = parser({
      name: "test",
      commands: [command({ name: "build" }), command({ name: "BUILD" })],
      settings: {
        caseSensitive: true,
      },
    })

    const result = p.parse(["build"])
    expect(result.commands.build.detected).toBe(true)
    expect(result.commands.BUILD.detected).toBe(false)
  })

  test("case sensitivity is ignored for command names when disabled", () => {
    const p = parser({
      name: "test",
      commands: [command({ name: "build" })],
      settings: {
        caseSensitive: false,
      },
    })

    const result = p.parse(["BUILD"])
    expect(result.commands.build.detected).toBe(true)
  })
})

describe("require equals", () => {
  test("requireEquals should require equals sign for options when enabled", () => {
    const p = parser({
      name: "test",
      arguments: [option({ name: "config" })],
      settings: {
        requireEquals: true,
      },
    })

    // Should throw error when using space-separated format
    expect(() => p.parse(["--config", "file.json"])).toThrow(
      "Option 'config' requires equals format (--config=value) when requireEquals setting is enabled"
    )

    // Should work fine with equals format
    const resultWithEquals = p.parse(["--config=file.json"])
    expect(resultWithEquals.arguments.config.detected).toBe(true)
    expect(resultWithEquals.arguments.config.value).toBe("file.json")
  })

  test("requireEquals should allow both styles when disabled", () => {
    const p = parser({
      name: "test",
      arguments: [option({ name: "config" })],
      settings: {
        requireEquals: false,
      },
    })

    const result = p.parse(["--config", "file.json"])
    expect(result.arguments.config.detected).toBe(true)
    expect(result.arguments.config.value).toBe("file.json")

    const resultWithEquals = p.parse(["--config=file.json"])
    expect(resultWithEquals.arguments.config.detected).toBe(true)
    expect(resultWithEquals.arguments.config.value).toBe("file.json")
  })
})

describe("start and stop index", () => {
  test("startIndex should be respected when enabled", () => {
    const p = parser({
      name: "test",
      arguments: [option({ name: "config" })],
      settings: {
        startIndex: 1,
      },
    })

    const result = p.parse(["a", "--config", "file.json"])
    expect(result.arguments.config.detected).toBe(true)
    expect(result.arguments.config.value).toBe("file.json")
    expect(result.argv).toEqual(["--config", "file.json"])
  })

  test("stopIndex should be respected when enabled", () => {
    const p = parser({
      name: "test",
      arguments: [option({ name: "config" })],
      settings: {
        stopIndex: 2,
      },
    })

    const result = p.parse(["--config", "file.json", "a"])
    expect(result.arguments.config.detected).toBe(true)
    expect(result.arguments.config.value).toBe("file.json")
    expect(result.argv).toEqual(["--config", "file.json"])
  })
  test("stopIndex bigger than argv", () => {
    const p = parser({
      name: "test",
      arguments: [option({ name: "config" })],
      settings: {
        stopIndex: 10,
      },
    })

    const result = p.parse(["--config", "file.json"])
    expect(result.arguments.config.detected).toBe(true)
    expect(result.arguments.config.value).toBe("file.json")
    expect(result.argv).toEqual(["--config", "file.json"])
  })
})
