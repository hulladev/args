import { command } from "@/args/command"
import { flag } from "@/args/flag"
import { positional } from "@/index"
import { parser } from "@/parser/parser"
import { describe, expect, test } from "vitest"

describe("commands", () => {
  test("should create", () => {
    const p = parser({
      name: "parser",
      arguments: [],
      commands: [
        command({
          name: "test",
          arguments: [],
        }),
      ],
    })
    expect(p.parse(["test"])).toEqual({
      argv: ["test"],
      arguments: {},
      commands: {
        test: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {},
        },
      },
    })
  })
  test("should parse arguments", () => {
    const p = parser({
      name: "parser",
      arguments: [],
      commands: [
        command({
          name: "test",
          arguments: [flag({ name: "help" })],
        }),
      ],
    })
    expect(p.parse(["test", "--help"])).toEqual({
      argv: ["test", "--help"],
      arguments: {},
      commands: {
        test: {
          detected: true,
          index: 0,
          arguments: {
            help: {
              value: true,
              raw: "--help",
              index: 1,
              detected: true,
              parser: "parser.test",
            },
          },
          commands: {},
        },
      },
    })
  })
  test("arguments at parser and at command", () => {
    const p = parser({
      name: "parser",
      arguments: [flag({ name: "verbose" })],
      commands: [command({ name: "test", arguments: [flag({ name: "help" })] })],
    })
    expect(p.parse(["--verbose", "test", "--help"])).toEqual({
      argv: ["--verbose", "test", "--help"],
      arguments: {
        verbose: { value: true, raw: "--verbose", index: 0, detected: true, parser: "parser" },
      },
      commands: {
        test: {
          detected: true,
          index: 1,
          arguments: {
            help: { value: true, raw: "--help", index: 2, detected: true, parser: "parser.test" },
          },
          commands: {},
        },
      },
    })
    expect(p.parse(["test", "--help"])).toEqual({
      argv: ["test", "--help"],
      arguments: {
        verbose: { value: false, raw: undefined, index: -1, detected: false, parser: "parser" },
      },
      commands: {
        test: {
          detected: true,
          index: 0,
          arguments: {
            help: { value: true, raw: "--help", index: 1, detected: true, parser: "parser.test" },
          },
          commands: {},
        },
      },
    })
    expect(p.parse(["--verbose", "test"])).toEqual({
      argv: ["--verbose", "test"],
      arguments: {
        verbose: { value: true, raw: "--verbose", index: 0, detected: true, parser: "parser" },
      },
      commands: {
        test: {
          detected: true,
          index: 1,
          arguments: {
            help: {
              value: false,
              raw: undefined,
              index: -1,
              detected: false,
              parser: "parser.test",
            },
          },
          commands: {},
        },
      },
    })
    expect(p.parse(["test"])).toEqual({
      argv: ["test"],
      arguments: {
        verbose: { value: false, raw: undefined, index: -1, detected: false, parser: "parser" },
      },
      commands: {
        test: {
          detected: true,
          index: 0,
          arguments: {
            help: {
              value: false,
              raw: undefined,
              index: -1,
              detected: false,
              parser: "parser.test",
            },
          },
          commands: {},
        },
      },
    })
    expect(p.parse(["--verbose"])).toEqual({
      argv: ["--verbose"],
      arguments: {
        verbose: { value: true, raw: "--verbose", index: 0, detected: true, parser: "parser" },
      },
      commands: {
        test: {
          detected: false,
          index: -1,
          arguments: {
            help: {
              value: false,
              raw: undefined,
              index: -1,
              detected: false,
              parser: "parser.test",
            },
          },
          commands: {},
        },
      },
    })
    expect(() => p.parse(["test", "--verbose"])).toThrow("Unhandled argument: --verbose")
  })
})

describe("with positionals cases", () => {
  test("should parse command with no arguments", () => {
    const p = parser({
      name: "parser",
      arguments: [],
      commands: [command({ name: "test", arguments: [] })],
    })
    expect(p.parse(["test"])).toEqual({
      argv: ["test"],
      arguments: {},
      commands: {
        test: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {},
        },
      },
    })
  })
  test("command preceeded by positional should work", () => {
    const p = parser({
      name: "parser",
      arguments: [positional({ name: "pos" })],
      commands: [command({ name: "test", arguments: [] })],
    })
    expect(p.parse(["abc123", "test"])).toEqual({
      argv: ["abc123", "test"],
      arguments: {
        pos: { value: "abc123", raw: "abc123", index: 0, detected: true, parser: "parser" },
      },
      commands: {
        test: {
          detected: true,
          index: 1,
          arguments: {},
          commands: {},
        },
      },
    })
  })
  test("positional has value of command gets treated as command", () => {
    const p = parser({
      name: "parser",
      arguments: [positional({ name: "pos" })],
      commands: [
        command({
          name: "test",
          arguments: [positional({ name: "pos" })],
        }),
      ],
    })
    expect(p.parse(["test", "abc123"])).toEqual({
      argv: ["test", "abc123"],
      arguments: {
        pos: { value: undefined, raw: undefined, index: -1, detected: false, parser: "parser" },
      },
      commands: {
        test: {
          detected: true,
          index: 0,
          arguments: {
            pos: {
              value: "abc123",
              raw: "abc123",
              index: 1,
              detected: true,
              parser: "parser.test",
            },
          },
          commands: {},
        },
      },
    })
  })
  test("parser throws parser error if position arg does not exist in command", () => {
    const p = parser({
      name: "parser",
      arguments: [positional({ name: "pos" })],
      commands: [command({ name: "test", arguments: [] })],
    })
    expect(() => p.parse(["abc123", "test", "another"])).toThrow("Unhandled argument: another")
  })
})

describe("nested and multiple commands", () => {
  test("should parse mutiple commands", () => {
    const p = parser({
      name: "parser",
      arguments: [],
      commands: [
        command({ name: "test", arguments: [] }),
        command({ name: "test2", arguments: [] }),
      ],
    })
    expect(p.parse(["test"])).toEqual({
      argv: ["test"],
      arguments: {},
      commands: {
        test: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {},
        },
        test2: {
          detected: false,
          index: -1,
          arguments: {},
          commands: {},
        },
      },
    })
    expect(p.parse(["test2"])).toEqual({
      argv: ["test2"],
      arguments: {},
      commands: {
        test: {
          detected: false,
          index: -1,
          arguments: {},
          commands: {},
        },
        test2: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {},
        },
      },
    })
  })
  test("multiple commands with arguments", () => {
    const p = parser({
      name: "parser",
      arguments: [],
      commands: [
        command({
          name: "test",
          arguments: [flag({ name: "help" })],
        }),
        command({
          name: "test2",
          arguments: [flag({ name: "help" })],
        }),
      ],
    })
    expect(p.parse(["test", "--help"])).toEqual({
      argv: ["test", "--help"],
      arguments: {},
      commands: {
        test: {
          detected: true,
          index: 0,
          arguments: {
            help: {
              value: true,
              raw: "--help",
              index: 1,
              detected: true,
              parser: "parser.test",
            },
          },
          commands: {},
        },
        test2: {
          detected: false,
          index: -1,
          arguments: {
            help: {
              value: false,
              raw: undefined,
              index: -1,
              detected: false,
              parser: "parser.test2",
            },
          },
          commands: {},
        },
      },
    })
    expect(p.parse(["test2", "--help"])).toEqual({
      argv: ["test2", "--help"],
      arguments: {},
      commands: {
        test: {
          detected: false,
          index: -1,
          arguments: {
            help: {
              value: false,
              raw: undefined,
              index: -1,
              detected: false,
              parser: "parser.test",
            },
          },
          commands: {},
        },
        test2: {
          detected: true,
          index: 0,
          arguments: {
            help: {
              value: true,
              raw: "--help",
              index: 1,
              detected: true,
              parser: "parser.test2",
            },
          },
          commands: {},
        },
      },
    })
  })
  test("nested arguments", () => {
    const p = parser({
      name: "parser",
      arguments: [],
      commands: [
        command({
          name: "ui",
          arguments: [],
          commands: [
            command({
              name: "add",
              arguments: [positional({ name: "components" }), flag({ name: "help" })],
            }),
            command({
              name: "remove",
              arguments: [positional({ name: "components" }), flag({ name: "help" })],
            }),
          ],
        }),
      ],
    })
    expect(p.parse(["ui", "add", "button"])).toEqual({
      argv: ["ui", "add", "button"],
      arguments: {},
      commands: {
        ui: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {
            add: {
              detected: true,
              index: 1,
              arguments: {
                components: {
                  detected: true,
                  index: 2,
                  parser: "parser.ui.add",
                  raw: "button",
                  value: "button",
                },
                help: {
                  detected: false,
                  index: -1,
                  parser: "parser.ui.add",
                  raw: undefined,
                  value: false,
                },
              },
              commands: {},
            },
            remove: {
              detected: false,
              index: -1,
              arguments: {
                components: {
                  detected: false,
                  index: -1,
                  parser: "parser.ui.remove",
                  raw: undefined,
                  value: undefined,
                },
                help: {
                  detected: false,
                  index: -1,
                  parser: "parser.ui.remove",
                  raw: undefined,
                  value: false,
                },
              },
              commands: {},
            },
          },
        },
      },
    })
  })
  test("command alias", () => {
    const p = parser({
      name: "parser",
      arguments: [],
      commands: [command({ name: "test", arguments: [], alias: ["t"] })],
    })

    // Test that both the full command name and alias work
    expect(p.parse(["test"])).toEqual({
      argv: ["test"],
      arguments: {},
      commands: {
        test: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {},
        },
      },
    })

    expect(p.parse(["t"])).toEqual({
      argv: ["t"],
      arguments: {},
      commands: {
        test: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {},
        },
      },
    })
  })

  test("command alias with single string", () => {
    const p = parser({
      name: "parser",
      arguments: [],
      commands: [command({ name: "build", arguments: [], alias: "b" })],
    })

    expect(p.parse(["b"])).toEqual({
      argv: ["b"],
      arguments: {},
      commands: {
        build: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {},
        },
      },
    })
  })

  test("command alias with arguments", () => {
    const p = parser({
      name: "parser",
      arguments: [],
      commands: [
        command({ name: "test", arguments: [flag({ name: "help" })], alias: ["t", "testing"] }),
      ],
    })

    expect(p.parse(["t", "--help"])).toEqual({
      argv: ["t", "--help"],
      arguments: {},
      commands: {
        test: {
          detected: true,
          index: 0,
          arguments: {
            help: {
              value: true,
              raw: "--help",
              index: 1,
              detected: true,
              parser: "parser.test",
            },
          },
          commands: {},
        },
      },
    })

    expect(p.parse(["testing", "--help"])).toEqual({
      argv: ["testing", "--help"],
      arguments: {},
      commands: {
        test: {
          detected: true,
          index: 0,
          arguments: {
            help: {
              value: true,
              raw: "--help",
              index: 1,
              detected: true,
              parser: "parser.test",
            },
          },
          commands: {},
        },
      },
    })
  })
})

describe("command aliases", () => {
  test("command with string alias", () => {
    const p = parser({
      name: "parser",
      arguments: [],
      commands: [command({ name: "install", alias: "i", arguments: [] })],
    })

    // Original command name
    expect(p.parse(["install"])).toEqual({
      argv: ["install"],
      arguments: {},
      commands: {
        install: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {},
        },
      },
    })

    // Alias
    expect(p.parse(["i"])).toEqual({
      argv: ["i"],
      arguments: {},
      commands: {
        install: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {},
        },
      },
    })
  })

  test("command with array of aliases", () => {
    const p = parser({
      name: "parser",
      arguments: [],
      commands: [
        command({
          name: "install",
          alias: ["i", "add", "setup"],
          arguments: [],
        }),
      ],
    })

    // Original command name
    expect(p.parse(["install"])).toEqual({
      argv: ["install"],
      arguments: {},
      commands: {
        install: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {},
        },
      },
    })

    // First alias
    expect(p.parse(["i"])).toEqual({
      argv: ["i"],
      arguments: {},
      commands: {
        install: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {},
        },
      },
    })

    // Second alias
    expect(p.parse(["add"])).toEqual({
      argv: ["add"],
      arguments: {},
      commands: {
        install: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {},
        },
      },
    })

    // Third alias
    expect(p.parse(["setup"])).toEqual({
      argv: ["setup"],
      arguments: {},
      commands: {
        install: {
          detected: true,
          index: 0,
          arguments: {},
          commands: {},
        },
      },
    })
  })

  test("multiple commands with aliases", () => {
    const p = parser({
      name: "parser",
      arguments: [],
      commands: [
        command({
          name: "install",
          alias: ["i", "add"],
          arguments: [],
        }),
        command({
          name: "uninstall",
          alias: ["remove", "rm", "un"],
          arguments: [],
        }),
      ],
    })

    // Test install command and aliases
    expect(p.parse(["install"]).commands.install.detected).toBe(true)
    expect(p.parse(["i"]).commands.install.detected).toBe(true)
    expect(p.parse(["add"]).commands.install.detected).toBe(true)

    // Test uninstall command and aliases
    expect(p.parse(["uninstall"]).commands.uninstall.detected).toBe(true)
    expect(p.parse(["remove"]).commands.uninstall.detected).toBe(true)
    expect(p.parse(["rm"]).commands.uninstall.detected).toBe(true)
    expect(p.parse(["un"]).commands.uninstall.detected).toBe(true)
  })
})
