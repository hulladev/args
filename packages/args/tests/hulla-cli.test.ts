import { describe, expect, test } from "vitest"
import z from "zod"
import { command, flag, infiniteSequence, option, parser } from "../src"

describe("hulla-cli", () => {
  const hulla = parser({
    name: "hulla",
    arguments: [flag({ name: "help" }), flag({ name: "version" })],
    commands: [
      command({
        name: "install",
        alias: ["i", "add"],
        arguments: [
          infiniteSequence({ name: "packages" }),
          flag({ name: "force" }),
          flag({ name: "verbose" }),
        ],
      }),
      command({
        name: "remove",
        alias: ["r", "rm"],
        arguments: [
          infiniteSequence({ name: "packages" }),
          flag({ name: "force" }),
          flag({ name: "verbose" }),
        ],
      }),
      command({
        name: "upgrade",
        alias: ["u", "up"],
        arguments: [
          infiniteSequence({ name: "packages" }),
          flag({ name: "force" }),
          flag({ name: "verbose" }),
        ],
      }),
      command({
        name: "ui",
        arguments: [flag({ name: "help" }), flag({ name: "version" })],
        commands: [
          command({
            name: "install",
            alias: ["i", "add"],
            arguments: [
              infiniteSequence({ name: "components" }),
              flag({ name: "force" }),
              flag({ name: "verbose" }),
            ],
          }),
          command({
            name: "remove",
            alias: ["r", "rm"],
            arguments: [infiniteSequence({ name: "components" })],
          }),
          command({
            name: "init",
            alias: ["-i"],
            arguments: [
              option({ name: "style", schema: z.enum(["tailwind", "stylex"]) }),
              option({ name: "frameworks" }),
              option({ name: "tsconfig" }),
              option({ name: "utils" }),
              option({ name: "template" }),
            ],
          }),
        ],
      }),
    ],
  })

  // 1. Basic commands and global flags
  test("global flags", () => {
    const helpResult = hulla.parse(["--help"])
    expect(helpResult.arguments.help.value).toBe(true)
    expect(helpResult.arguments.version.value).toBe(false)
    expect(helpResult.commands.install.detected).toBe(false)
    expect(helpResult.commands.remove.detected).toBe(false)
    expect(helpResult.commands.upgrade.detected).toBe(false)
    expect(helpResult.commands.ui.detected).toBe(false)

    const versionResult = hulla.parse(["--version"])
    expect(versionResult.arguments.help.value).toBe(false)
    expect(versionResult.arguments.version.value).toBe(true)
    expect(versionResult.commands.install.detected).toBe(false)
    expect(versionResult.commands.remove.detected).toBe(false)
    expect(versionResult.commands.upgrade.detected).toBe(false)
    expect(versionResult.commands.ui.detected).toBe(false)
  })

  // 2. Top-level commands with their arguments
  test("install command with packages", () => {
    const result = hulla.parse(["install", "package1", "package2", "--force"])
    expect(result.commands.install.detected).toBe(true)
    expect(result.commands.install.arguments.packages.value).toEqual(["package1", "package2"])
    expect(result.commands.install.arguments.force.value).toBe(true)
    expect(result.commands.install.arguments.verbose.value).toBe(false)
  })

  test("install command with aliases", () => {
    // Test i alias
    const result1 = hulla.parse(["i", "package1", "--verbose"])
    expect(result1.commands.install.detected).toBe(true)
    expect(result1.commands.install.arguments.packages.value).toEqual(["package1"])
    expect(result1.commands.install.arguments.verbose.value).toBe(true)

    // Test add alias
    const result2 = hulla.parse(["add", "package1", "package2"])
    expect(result2.commands.install.detected).toBe(true)
    expect(result2.commands.install.arguments.packages.value).toEqual(["package1", "package2"])
  })

  test("remove command with packages", () => {
    const result = hulla.parse(["remove", "package1", "package2", "--verbose"])
    expect(result.commands.remove.detected).toBe(true)
    expect(result.commands.remove.arguments.packages.value).toEqual(["package1", "package2"])
    expect(result.commands.remove.arguments.verbose.value).toBe(true)
  })

  test("remove command with aliases", () => {
    // Test rm alias
    const result = hulla.parse(["rm", "package1", "--force"])
    expect(result.commands.remove.detected).toBe(true)
    expect(result.commands.remove.arguments.packages.value).toEqual(["package1"])
    expect(result.commands.remove.arguments.force.value).toBe(true)
  })

  test("upgrade command with packages", () => {
    const result = hulla.parse(["upgrade", "package1", "package2", "--force", "--verbose"])
    expect(result.commands.upgrade.detected).toBe(true)
    expect(result.commands.upgrade.arguments.packages.value).toEqual(["package1", "package2"])
    expect(result.commands.upgrade.arguments.force.value).toBe(true)
    expect(result.commands.upgrade.arguments.verbose.value).toBe(true)
  })

  test("upgrade command with aliases", () => {
    // Test up alias
    const result = hulla.parse(["up", "package1"])
    expect(result.commands.upgrade.detected).toBe(true)
    expect(result.commands.upgrade.arguments.packages.value).toEqual(["package1"])
  })

  // 3. UI Command and nested subcommands
  test("ui command with flags", () => {
    const result = hulla.parse(["ui", "--help"])
    expect(result.commands.ui.detected).toBe(true)
    expect(result.commands.ui.arguments.help.value).toBe(true)
    expect(result.commands.ui.arguments.version.value).toBe(false)
  })

  // Nested commands tests using the hulla CLI directly
  test("nested ui install command", () => {
    const result = hulla.parse(["ui", "install", "button", "card", "--force"])

    expect(result.commands.ui.detected).toBe(true)
    expect(result.commands.ui.commands.install.detected).toBe(true)
    expect(result.commands.ui.commands.install.arguments.components.value).toEqual([
      "button",
      "card",
    ])
    expect(result.commands.ui.commands.install.arguments.force.value).toBe(true)
  })

  test("nested ui remove command with alias", () => {
    const result = hulla.parse(["ui", "rm", "button"])

    expect(result.commands.ui.detected).toBe(true)
    expect(result.commands.ui.commands.remove.detected).toBe(true)
    expect(result.commands.ui.commands.remove.arguments.components.value).toEqual(["button"])
  })

  test("nested ui init command with options", () => {
    const result = hulla.parse([
      "ui",
      "init",
      "--style",
      "tailwind",
      "--frameworks",
      "react",
      "--template",
      "blog",
    ])

    expect(result.commands.ui.detected).toBe(true)
    expect(result.commands.ui.commands.init.detected).toBe(true)
    expect(result.commands.ui.commands.init.arguments.style.value).toBe("tailwind")
    expect(result.commands.ui.commands.init.arguments.frameworks.value).toBe("react")
    expect(result.commands.ui.commands.init.arguments.template.value).toBe("blog")
  })

  test("nested command with conflict", () => {
    // This test verifies that nested commands with the same name as top-level commands work correctly
    const result = hulla.parse(["ui", "install", "button"])

    expect(result.commands.ui.detected).toBe(true)
    expect(result.commands.ui.commands.install.detected).toBe(true)
    expect(result.commands.ui.commands.install.arguments.components.value).toEqual(["button"])
    expect(result.commands.install.detected).toBe(false)
  })

  // 4. Error handling and edge cases
  test("invalid command", () => {
    expect(() => hulla.parse(["invalid-command"])).toThrow()
  })

  test("invalid nested command", () => {
    expect(() => hulla.parse(["ui", "invalid-command"])).toThrow()
  })

  test("flags in incorrect position", () => {
    // This should parse correctly since flags can be anywhere
    const result = hulla.parse(["--help", "install", "package1"])
    expect(result.arguments.help.value).toBe(true)
    expect(result.commands.install.detected).toBe(true)
    expect(result.commands.install.arguments.packages.value).toEqual(["package1"])
  })

  test("similar but invalid command name", () => {
    expect(() => hulla.parse(["instll"])).toThrow() // typo in install
  })

  test("commands with no arguments", () => {
    const result = hulla.parse(["install"])
    expect(result.commands.install.detected).toBe(true)
    expect(result.commands.install.arguments.packages.value).toEqual([])
  })

  test("nested commands with no arguments", () => {
    // Test UI commands with no arguments
    const result = hulla.parse(["ui", "install"])
    expect(result.commands.ui.detected).toBe(true)
    expect(result.commands.ui.commands.install.detected).toBe(true)
    expect(result.commands.ui.commands.install.arguments.components.value).toEqual([])
  })

  test("flags at different positions", () => {
    const result = hulla.parse(["install", "--force", "package1", "--verbose", "package2"])
    expect(result.commands.install.detected).toBe(true)
    expect(result.commands.install.arguments.force.value).toBe(true)
    expect(result.commands.install.arguments.verbose.value).toBe(true)
    expect(result.commands.install.arguments.packages.value).toEqual(["package1", "package2"])
  })

  test("different flag and option combinations", () => {
    const result = hulla.parse(["install", "--force", "--verbose", "package1"])
    expect(result.commands.install.detected).toBe(true)
    expect(result.commands.install.arguments.force.value).toBe(true)
    expect(result.commands.install.arguments.verbose.value).toBe(true)
    expect(result.commands.install.arguments.packages.value).toEqual(["package1"])
  })

  // 5. Additional edge cases with nested commands
  test("nested command with global flags", () => {
    const result = hulla.parse(["--help", "ui", "install", "button"])
    expect(result.arguments.help.value).toBe(true)
    expect(result.commands.ui.detected).toBe(true)
    expect(result.commands.ui.commands.install.detected).toBe(true)
    expect(result.commands.ui.commands.install.arguments.components.value).toEqual(["button"])
  })

  test("complex nested command with flags at multiple levels", () => {
    const result = hulla.parse([
      "--help",
      "ui",
      "--version",
      "install",
      "button",
      "card",
      "--force",
    ])

    expect(result.arguments.help.value).toBe(true)
    expect(result.commands.ui.detected).toBe(true)
    expect(result.commands.ui.arguments.version.value).toBe(true)
    expect(result.commands.ui.commands.install.detected).toBe(true)
    expect(result.commands.ui.commands.install.arguments.components.value).toEqual([
      "button",
      "card",
    ])
    expect(result.commands.ui.commands.install.arguments.force.value).toBe(true)
  })
})
