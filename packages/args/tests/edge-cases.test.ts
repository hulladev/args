import { describe, expect, test } from "vitest"
import z from "zod"
import { command, flag, option, parser } from "../src"

describe("edge-cases", () => {
  test("command name is a prefix of another command", () => {
    const prefixParser = parser({
      name: "prefix-test",
      commands: [
        command({ name: "up", arguments: [] }),
        command({ name: "update", arguments: [] }),
      ],
    })

    const result = prefixParser.parse(["up"])
    expect(result.commands.up.detected).toBe(true)
    expect(result.commands.update.detected).toBe(false)
  })

  test("invalid option value for enum", () => {
    const enumParser = parser({
      name: "ui",
      commands: [
        command({
          name: "init",
          arguments: [
            option({ name: "style", schema: z.enum(["tailwind", "stylex"]) }),
          ],
        }),
      ],
    })

    expect(() => enumParser.parse(["init", "--style", "invalid-style"])).toThrow()
  })

  test("missing required option value", () => {
    const requireEqualsParser = parser({
      name: "ui",
      settings: {
        requireEquals: true
      },
      commands: [
        command({
          name: "init",
          arguments: [
            option({ name: "style" }),
          ],
        }),
      ],
    })

    // This should throw an error since with requireEquals=true, 
    // the parser will expect --style=value instead of --style value
    expect(() => requireEqualsParser.parse(["init", "--style"])).toThrow()
  })

  test("deeply nested commands hierarchy", () => {
    // Create a CLI with deeper nesting
    const deeplyNestedCli = parser({
      name: "deep",
      commands: [
        command({
          name: "level1",
          commands: [
            command({
              name: "level2",
              commands: [
                command({
                  name: "level3",
                  arguments: [flag({ name: "flag" })]
                })
              ]
            })
          ]
        })
      ]
    })
    
    const result = deeplyNestedCli.parse(["level1", "level2", "level3", "--flag"])
    expect(result.commands.level1.detected).toBe(true)
    expect(result.commands.level1.commands.level2.detected).toBe(true)
    expect(result.commands.level1.commands.level2.commands.level3.detected).toBe(true)
    expect(result.commands.level1.commands.level2.commands.level3.arguments.flag.value).toBe(true)
  })

  test("equal sign in option values", () => {
    // Create a parser that accepts equal signs in options
    const equalSignParser = parser({
      name: "equalTest",
      commands: [
        command({
          name: "test",
          arguments: [
            option({ name: "config" })
          ]
        })
      ]
    })
    
    const result = equalSignParser.parse(["test", "--config=path/to/config.json"])
    expect(result.commands.test.detected).toBe(true)
    expect(result.commands.test.arguments.config.value).toBe("path/to/config.json")
  })
  
  test("command name collisions with argument values", () => {
    // Create a parser where an argument value could be mistaken for a command
    const collisionParser = parser({
      name: "collision",
      settings: {
        requireEquals: true
      },
      arguments: [option({ name: "mode" })],
      commands: [
        command({ name: "install", arguments: [] }),
        command({ name: "remove", arguments: [] })
      ]
    })
    
    // Using the equals format to properly set the value
    const result = collisionParser.parse(["--mode=install"])
    expect(result.arguments.mode.detected).toBe(true)
    expect(result.arguments.mode.value).toBe("install")
    expect(result.commands.install.detected).toBe(false)
  })
  
  test("case sensitivity handling", () => {
    // Create a case-sensitive parser
    const caseSensitiveParser = parser({
      name: "case-test",
      settings: { caseSensitive: true },
      commands: [
        command({ name: "Install", arguments: [] }),
        command({ name: "install", arguments: [] })
      ]
    })
    
    // Should detect lowercase "install" but not uppercase "Install"
    const result1 = caseSensitiveParser.parse(["install"])
    expect(result1.commands.install.detected).toBe(true)
    expect(result1.commands.Install.detected).toBe(false)
    
    // Should detect uppercase "Install" but not lowercase "install"
    const result2 = caseSensitiveParser.parse(["Install"])
    expect(result2.commands.Install.detected).toBe(true)
    expect(result2.commands.install.detected).toBe(false)
  })

  test("overlapping option and command names", () => {
    // Test CLI with overlapping option and command names
    const overlapCli = parser({
      name: "overlap",
      arguments: [option({ name: "install" })],
      commands: [
        command({ 
          name: "install", 
          arguments: [flag({ name: "force" })] 
        })
      ]
    })
    
    // Command should take precedence
    const result1 = overlapCli.parse(["install", "--force"])
    expect(result1.commands.install.detected).toBe(true)
    expect(result1.commands.install.arguments.force.value).toBe(true)
    
    // Option should be detected
    const result2 = overlapCli.parse(["--install=value"])
    expect(result2.arguments.install.detected).toBe(true)
    expect(result2.arguments.install.value).toBe("value")
    expect(result2.commands.install.detected).toBe(false)
  })
  
  test("nested command with empty arguments array", () => {
    // Test CLI with empty arguments array
    const emptyArgsCli = parser({
      name: "empty-args",
      arguments: [],
      commands: [
        command({
          name: "cmd",
          arguments: [],
          commands: [
            command({
              name: "subcmd",
              arguments: []
            })
          ]
        })
      ]
    })
    
    const result = emptyArgsCli.parse(["cmd", "subcmd"])
    expect(result.commands.cmd.detected).toBe(true)
    expect(result.commands.cmd.commands.subcmd.detected).toBe(true)
  })
  
  test("unicode characters in command and argument names", () => {
    // Test CLI with unicode characters
    const unicodeCli = parser({
      name: "unicode",
      commands: [
        command({
          name: "安装", // "install" in Chinese
          arguments: [flag({ name: "強制" })] // "force" in Japanese
        })
      ]
    })
    
    const result = unicodeCli.parse(["安装", "--強制"])
    expect(result.commands.安装.detected).toBe(true)
    expect(result.commands.安装.arguments.強制.value).toBe(true)
  })
}) 