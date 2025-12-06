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

describe("merge args", () => {
  test("should detect root level argument only when mergeArgs is disabled", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "help" })],
      commands: [command({ name: "build", arguments: [flag({ name: "help" })] })],
      settings: {
        mergeArgs: false,
      },
    })

    const result = p.parse(["--help"])
    expect(result.arguments.help.detected).toBe(true)
    expect(result.arguments.help.value).toBe(true)
    expect(result.arguments.help.parser).toBe("test")
    expect(result.commands.build.arguments.help.detected).toBe(false)
  })

  test("should detect command level argument when after command name", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "help" })],
      commands: [command({ name: "build", arguments: [flag({ name: "help" })] })],
      settings: {
        mergeArgs: false,
      },
    })

    const result = p.parse(["build", "--help"])
    expect(result.arguments.help.detected).toBe(false)
    expect(result.commands.build.detected).toBe(true)
    expect(result.commands.build.arguments.help.detected).toBe(true)
    expect(result.commands.build.arguments.help.value).toBe(true)
    expect(result.commands.build.arguments.help.parser).toBe("test.build")
  })

  test("should merge shared flag when argument appears before command", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "help" })],
      commands: [command({ name: "build", arguments: [flag({ name: "help" })] })],
      settings: {
        mergeArgs: true,
      },
    })

    const result = p.parse(["--help", "build"])

    // Root level should detect it
    expect(result.arguments.help.detected).toBe(true)
    expect(result.arguments.help.value).toBe(true)
    expect(result.arguments.help.index).toBe(0)
    expect(result.arguments.help.parser).toBe("test")

    // Command level should also detect it
    expect(result.commands.build.detected).toBe(true)
    expect(result.commands.build.arguments.help.detected).toBe(true)
    expect(result.commands.build.arguments.help.value).toBe(true)
    expect(result.commands.build.arguments.help.index).toBe(0)
    expect(result.commands.build.arguments.help.parser).toBe("test.build")
  })

  test("should merge shared flag with short option", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "help" })],
      commands: [command({ name: "build", arguments: [flag({ name: "help" })] })],
      settings: {
        mergeArgs: true,
      },
    })

    const result = p.parse(["-h", "build"])

    expect(result.arguments.help.detected).toBe(true)
    expect(result.arguments.help.index).toBe(0)
    expect(result.arguments.help.parser).toBe("test")

    expect(result.commands.build.arguments.help.detected).toBe(true)
    expect(result.commands.build.arguments.help.index).toBe(0)
    expect(result.commands.build.arguments.help.parser).toBe("test.build")
  })

  test("should detect both occurrences when flag appears twice", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "help" })],
      commands: [command({ name: "build", arguments: [flag({ name: "help" })] })],
      settings: {
        mergeArgs: true,
      },
    })

    const result = p.parse(["--help", "build", "--help"])

    // Both should be detected - the search will find the first occurrence at index 0
    expect(result.arguments.help.detected).toBe(true)
    expect(result.arguments.help.value).toBe(true)
    expect(result.arguments.help.index).toBe(0)
    expect(result.arguments.help.parser).toBe("test")

    // Command should detect its occurrence at index 2 (relative to full argv)
    expect(result.commands.build.detected).toBe(true)
    expect(result.commands.build.arguments.help.detected).toBe(true)
    expect(result.commands.build.arguments.help.value).toBe(true)
    expect(result.commands.build.arguments.help.index).toBe(2)
    expect(result.commands.build.arguments.help.parser).toBe("test.build")
  })

  test("should merge shared option with value", () => {
    const p = parser({
      name: "test",
      arguments: [option({ name: "config" })],
      commands: [command({ name: "build", arguments: [option({ name: "config" })] })],
      settings: {
        mergeArgs: true,
      },
    })

    const result = p.parse(["--config", "file.json", "build"])

    // Root level should detect it
    expect(result.arguments.config.detected).toBe(true)
    expect(result.arguments.config.value).toBe("file.json")
    expect(result.arguments.config.index).toBe(0)
    expect(result.arguments.config.parser).toBe("test")

    // Command level should also detect it
    expect(result.commands.build.detected).toBe(true)
    expect(result.commands.build.arguments.config.detected).toBe(true)
    expect(result.commands.build.arguments.config.value).toBe("file.json")
    expect(result.commands.build.arguments.config.index).toBe(0)
    expect(result.commands.build.arguments.config.parser).toBe("test.build")
  })

  test("should merge shared option with equals format", () => {
    const p = parser({
      name: "test",
      arguments: [option({ name: "config" })],
      commands: [command({ name: "build", arguments: [option({ name: "config" })] })],
      settings: {
        mergeArgs: true,
      },
    })

    const result = p.parse(["--config=file.json", "build"])

    expect(result.arguments.config.detected).toBe(true)
    expect(result.arguments.config.value).toBe("file.json")
    expect(result.arguments.config.index).toBe(0)
    expect(result.arguments.config.parser).toBe("test")

    expect(result.commands.build.arguments.config.detected).toBe(true)
    expect(result.commands.build.arguments.config.value).toBe("file.json")
    expect(result.commands.build.arguments.config.index).toBe(0)
    expect(result.commands.build.arguments.config.parser).toBe("test.build")
  })

  test("should not merge when argument only exists at root level", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "help" }), flag({ name: "version" })],
      commands: [command({ name: "build", arguments: [flag({ name: "help" })] })],
      settings: {
        mergeArgs: true,
      },
    })

    const result = p.parse(["--version", "build"])

    // Root level should detect version
    expect(result.arguments.version.detected).toBe(true)
    expect(result.arguments.version.parser).toBe("test")

    // Command doesn't have version, so it shouldn't appear
    expect(result.commands.build.arguments).not.toHaveProperty("version")
  })

  test("should not merge when argument only exists at command level", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "help" })],
      commands: [command({ name: "build", arguments: [flag({ name: "help" }), flag({ name: "watch" })] })],
      settings: {
        mergeArgs: true,
      },
    })

    const result = p.parse(["--help", "build"])

    // Command has watch but it wasn't provided
    expect(result.commands.build.arguments.watch.detected).toBe(false)
  })

  test("mergeArgs disabled should maintain original behavior", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "help" })],
      commands: [command({ name: "build", arguments: [flag({ name: "help" })] })],
      settings: {
        mergeArgs: false,
      },
    })

    const result = p.parse(["--help", "build"])

    // Only root should detect it
    expect(result.arguments.help.detected).toBe(true)
    expect(result.arguments.help.parser).toBe("test")

    // Command should NOT detect it since it's before the command
    expect(result.commands.build.arguments.help.detected).toBe(false)
  })

  test("should work with multiple shared arguments", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "help" }), flag({ name: "verbose" })],
      commands: [command({ name: "build", arguments: [flag({ name: "help" }), flag({ name: "verbose" })] })],
      settings: {
        mergeArgs: true,
      },
    })

    const result = p.parse(["--help", "--verbose", "build"])

    // Both flags should be detected at both levels
    expect(result.arguments.help.detected).toBe(true)
    expect(result.arguments.help.index).toBe(0)
    expect(result.arguments.verbose.detected).toBe(true)
    expect(result.arguments.verbose.index).toBe(1)

    expect(result.commands.build.arguments.help.detected).toBe(true)
    expect(result.commands.build.arguments.help.index).toBe(0)
    expect(result.commands.build.arguments.verbose.detected).toBe(true)
    expect(result.commands.build.arguments.verbose.index).toBe(1)
  })
})
