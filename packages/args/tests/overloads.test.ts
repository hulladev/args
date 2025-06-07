import { command, flag, option, parser, positional } from "@/index"
import { describe, expect, test } from "vitest"

describe("function overloads type inference", () => {
  test("parser with only name should work", () => {
    const p = parser({ name: "test", arguments: [] })
    expect(p.name).toBe("test")
    expect(p.parse([])).toEqual({
      argv: [],
      arguments: {},
      commands: {},
    })
  })

  test("parser with arguments only should work", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "help" }), option({ name: "config" })],
    })
    expect(p.name).toBe("test")
    const result = p.parse(["--help"])
    expect(result.arguments.help.value).toBe(true)
    expect(result.arguments.config.value).toBe(undefined)
  })

  test("command with only name should work", () => {
    const cmd = command({ name: "build" })
    expect(cmd.name).toBe("build")
    expect(cmd.type).toBe("command")
    expect(cmd.arguments).toEqual([])
    expect(cmd.commands).toEqual([])
  })

  test("command with arguments only should work", () => {
    const cmd = command({
      name: "build",
      arguments: [flag({ name: "watch" }), positional({ name: "file" })],
    })
    expect(cmd.name).toBe("build")
    expect(cmd.arguments).toHaveLength(2)
    expect(cmd.commands).toEqual([])
  })

  test("command with commands only should work", () => {
    const cmd = command({
      name: "build",
      commands: [command({ name: "dev" })],
    })
    expect(cmd.name).toBe("build")
    expect(cmd.arguments).toEqual([])
    expect(cmd.commands).toHaveLength(1)
  })
})
