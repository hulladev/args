import { describe, expect, test } from "vitest"

import { command, flag, infiniteSequence, option, parser, positional, sequence } from "@/index"

describe("basic parser", () => {
  const p = parser({
    name: "test",
    arguments: [
      flag({ name: "flag" }),
      option({ name: "option" }),
      positional({ name: "positional" }),
    ],
  })
  test("parser init", () => {
    expect(p).toBeDefined()
  })
  test("parser settings", () => {
    expect(p.settings).toEqual({
      caseSensitive: false,
      startIndex: 0,
      stopIndex: null,
      requireEquals: false,
      mode: "both",
      keepOnlyDetected: false,
    })
  })
  test("read", () => {
    expect(p.read(["--test", "test"])).toEqual(["--test", "test"])
  })
  test("only positionals", () => {
    expect(p.parse(["hello"])).toEqual({
      argv: ["hello"],
      arguments: {
        flag: {
          value: false,
          raw: undefined,
          index: -1,
          detected: false,
          parser: "test",
        },
        option: {
          value: undefined,
          raw: undefined,
          index: -1,
          detected: false,
          parser: "test",
        },
        positional: {
          value: "hello",
          raw: "hello",
          index: 0,
          detected: true,
          parser: "test",
        },
      },
      commands: {},
    })
  })
  test("only flags", () => {
    expect(p.parse(["--flag"])).toEqual({
      argv: ["--flag"],
      arguments: {
        flag: {
          value: true,
          raw: "--flag",
          index: 0,
          detected: true,
          parser: "test",
        },
        option: {
          value: undefined,
          raw: undefined,
          index: -1,
          detected: false,
          parser: "test",
        },
        positional: {
          value: undefined,
          raw: undefined,
          index: -1,
          detected: false,
          parser: "test",
        },
      },
      commands: {},
    })
  })
  test("only options", () => {
    expect(p.parse(["--option", "value"])).toEqual({
      argv: ["--option", "value"],
      arguments: {
        flag: {
          value: false,
          raw: undefined,
          index: -1,
          detected: false,
          parser: "test",
        },
        option: {
          value: "value",
          raw: "--option value",
          index: 0,
          detected: true,
          parser: "test",
        },
        positional: {
          value: undefined,
          raw: undefined,
          index: -1,
          detected: false,
          parser: "test",
        },
      },
      commands: {},
    })
  })
  test("option with equals", () => {
    expect(p.parse(["--option=value"])).toEqual({
      argv: ["--option=value"],
      arguments: {
        flag: {
          value: false,
          raw: undefined,
          index: -1,
          detected: false,
          parser: "test",
        },
        option: {
          value: "value",
          raw: "--option=value",
          index: 0,
          detected: true,
          parser: "test",
        },
        positional: {
          value: undefined,
          raw: undefined,
          index: -1,
          detected: false,
          parser: "test",
        },
      },
      commands: {},
    })
  })
  test("only positionals", () => {
    expect(p.parse(["hello"])).toEqual({
      argv: ["hello"],
      arguments: {
        flag: {
          value: false,
          raw: undefined,
          index: -1,
          detected: false,
          parser: "test",
        },
        option: {
          value: undefined,
          raw: undefined,
          index: -1,
          detected: false,
          parser: "test",
        },
        positional: {
          value: "hello",
          raw: "hello",
          index: 0,
          detected: true,
          parser: "test",
        },
      },
      commands: {},
    })
  })
})

describe("seuence", () => {
  const p = parser({
    name: "test",
    arguments: [
      sequence({
        name: "sequence",
        arguments: [positional({ name: "input" }), positional({ name: "output" })],
      }),
    ],
  })
  test("read", () => {
    expect(p.read(["hello", "world"])).toEqual(["hello", "world"])
  })
  test("parse", () => {
    expect(p.parse(["hello", "world"])).toEqual({
      argv: ["hello", "world"],
      arguments: {
        sequence: {
          value: {
            input: {
              value: "hello",
              raw: "hello",
              index: 0,
              detected: true,
              parser: "test.input",
            },
            output: {
              value: "world",
              raw: "world",
              index: 1,
              detected: true,
              parser: "test.output",
            },
          },
          raw: "hello world",
          index: 0,
          detected: true,
          parser: "test",
        },
      },
      commands: {},
    })
  })
  test("sequence in combination with other arguments", () => {
    const np = parser({
      name: "test",
      arguments: [
        flag({ name: "help" }),
        option({ name: "option" }),
        sequence({
          name: "sequence",
          arguments: [positional({ name: "input" }), positional({ name: "output" })],
        }),
      ],
    })
    expect(np.parse(["--help", "--option", "value", "hello", "world"])).toEqual({
      argv: ["--help", "--option", "value", "hello", "world"],
      arguments: {
        help: { value: true, raw: "--help", index: 0, detected: true, parser: "test" },
        option: { value: "value", raw: "--option value", index: 1, detected: true, parser: "test" },
        sequence: {
          value: {
            input: { value: "hello", raw: "hello", index: 3, detected: true, parser: "test.input" },
            output: {
              value: "world",
              raw: "world",
              index: 4,
              detected: true,
              parser: "test.output",
            },
          },
          raw: "hello world",
          index: 3,
          detected: true,
          parser: "test",
        },
      },
      commands: {},
    })
  })
  test("sequence with positional arguments", () => {
    const np = parser({
      name: "test",
      arguments: [
        positional({ name: "pos1" }),
        option({ name: "option" }),
        sequence({
          name: "sequence",
          arguments: [positional({ name: "input" }), positional({ name: "output" })],
        }),
        positional({ name: "pos2" }),
      ],
    })
    expect(np.parse(["pos1", "--option", "value", "hello", "world", "pos2"])).toEqual({
      argv: ["pos1", "--option", "value", "hello", "world", "pos2"],
      arguments: {
        pos1: { value: "pos1", raw: "pos1", index: 0, detected: true, parser: "test" },
        option: { value: "value", raw: "--option value", index: 1, detected: true, parser: "test" },
        sequence: {
          detected: true,
          index: 3,
          parser: "test",
          raw: "hello world",
          value: {
            input: { value: "hello", raw: "hello", index: 3, detected: true, parser: "test.input" },
            output: {
              value: "world",
              raw: "world",
              index: 4,
              detected: true,
              parser: "test.output",
            },
          },
        },
        pos2: { value: "pos2", raw: "pos2", index: 5, detected: true, parser: "test" },
      },
      commands: {},
    })
  })
})

describe("flag and option short/long forms", () => {
  describe("flag short/long specifiers", () => {
    test("flag with custom short form", () => {
      const p = parser({
        name: "parser",
        arguments: [flag({ name: "verbose", short: "v" })],
      })

      expect(p.parse(["-v"])).toEqual({
        argv: ["-v"],
        arguments: {
          verbose: {
            value: true,
            raw: "-v",
            index: 0,
            detected: true,
            parser: "parser",
          },
        },
        commands: {},
      })

      expect(p.parse(["--verbose"])).toEqual({
        argv: ["--verbose"],
        arguments: {
          verbose: {
            value: true,
            raw: "--verbose",
            index: 0,
            detected: true,
            parser: "parser",
          },
        },
        commands: {},
      })
    })

    test("flag with both short and long default forms", () => {
      const p = parser({
        name: "parser",
        arguments: [flag({ name: "debug" })],
      })

      expect(p.parse(["-d"])).toEqual({
        argv: ["-d"],
        arguments: {
          debug: {
            value: true,
            raw: "-d",
            index: 0,
            detected: true,
            parser: "parser",
          },
        },
        commands: {},
      })

      expect(p.parse(["--debug"])).toEqual({
        argv: ["--debug"],
        arguments: {
          debug: {
            value: true,
            raw: "--debug",
            index: 0,
            detected: true,
            parser: "parser",
          },
        },
        commands: {},
      })
    })

    test("flag with array of long options", () => {
      const p = parser({
        name: "parser",
        arguments: [
          flag({
            name: "verbose",
            long: ["verbose", "v", "verbosity"],
          }),
        ],
      })

      expect(p.parse(["--verbose"]).arguments.verbose.value).toBe(true)
      expect(p.parse(["--v"]).arguments.verbose.value).toBe(true)
      expect(p.parse(["--verbosity"]).arguments.verbose.value).toBe(true)
    })

    test("flag with array of short options", () => {
      const p = parser({
        name: "parser",
        arguments: [
          flag({
            name: "debug",
            short: ["d", "D", "dbg"],
          }),
        ],
      })

      expect(p.parse(["-d"]).arguments.debug.value).toBe(true)
      expect(p.parse(["-D"]).arguments.debug.value).toBe(true)
      expect(p.parse(["-dbg"]).arguments.debug.value).toBe(true)
    })
  })

  describe("option short/long specifiers", () => {
    test("option with custom short form", () => {
      const p = parser({
        name: "parser",
        arguments: [option({ name: "file", short: "f" })],
      })

      expect(p.parse(["-f", "input.txt"])).toEqual({
        argv: ["-f", "input.txt"],
        arguments: {
          file: {
            value: "input.txt",
            raw: "-f input.txt",
            index: 0,
            detected: true,
            parser: "parser",
          },
        },
        commands: {},
      })

      expect(p.parse(["-f=input.txt"])).toEqual({
        argv: ["-f=input.txt"],
        arguments: {
          file: {
            value: "input.txt",
            raw: "-f=input.txt",
            index: 0,
            detected: true,
            parser: "parser",
          },
        },
        commands: {},
      })
    })

    test("option with custom long form", () => {
      const p = parser({
        name: "parser",
        arguments: [option({ name: "file", long: "filename" })],
      })

      expect(p.parse(["--filename", "input.txt"])).toEqual({
        argv: ["--filename", "input.txt"],
        arguments: {
          file: {
            value: "input.txt",
            raw: "--filename input.txt",
            index: 0,
            detected: true,
            parser: "parser",
          },
        },
        commands: {},
      })

      expect(p.parse(["--filename=input.txt"])).toEqual({
        argv: ["--filename=input.txt"],
        arguments: {
          file: {
            value: "input.txt",
            raw: "--filename=input.txt",
            index: 0,
            detected: true,
            parser: "parser",
          },
        },
        commands: {},
      })

      expect(p.parse(["--file", "input.txt"])).toEqual({
        argv: ["--file", "input.txt"],
        arguments: {
          file: {
            value: "input.txt",
            raw: "--file input.txt",
            index: 0,
            detected: true,
            parser: "parser",
          },
        },
        commands: {},
      })

      expect(p.parse(["--file=input.txt"])).toEqual({
        argv: ["--file=input.txt"],
        arguments: {
          file: {
            value: "input.txt",
            raw: "--file=input.txt",
            index: 0,
            detected: true,
            parser: "parser",
          },
        },
        commands: {},
      })
    })

    test("option with array of long options", () => {
      const p = parser({
        name: "parser",
        arguments: [
          option({
            name: "output",
            long: ["output", "out", "o"],
          }),
        ],
      })

      expect(p.parse(["--output", "file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["--out", "file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["--o", "file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["--output=file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["--out=file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["--o=file.txt"]).arguments.output.value).toBe("file.txt")
    })

    test("option with array of short options", () => {
      const p = parser({
        name: "parser",
        arguments: [
          option({
            name: "input",
            short: ["i", "I", "in"],
          }),
        ],
      })

      expect(p.parse(["-i", "file.txt"]).arguments.input.value).toBe("file.txt")
      expect(p.parse(["-I", "file.txt"]).arguments.input.value).toBe("file.txt")
      expect(p.parse(["-in", "file.txt"]).arguments.input.value).toBe("file.txt")
      expect(p.parse(["-i=file.txt"]).arguments.input.value).toBe("file.txt")
      expect(p.parse(["-I=file.txt"]).arguments.input.value).toBe("file.txt")
      expect(p.parse(["-in=file.txt"]).arguments.input.value).toBe("file.txt")
    })

    test("option with default forms", () => {
      const p = parser({
        name: "parser",
        arguments: [option({ name: "output" })],
      })

      expect(p.parse(["-o", "result.txt"])).toEqual({
        argv: ["-o", "result.txt"],
        arguments: {
          output: {
            value: "result.txt",
            raw: "-o result.txt",
            index: 0,
            detected: true,
            parser: "parser",
          },
        },
        commands: {},
      })

      expect(p.parse(["--output=result.txt"])).toEqual({
        argv: ["--output=result.txt"],
        arguments: {
          output: {
            value: "result.txt",
            raw: "--output=result.txt",
            index: 0,
            detected: true,
            parser: "parser",
          },
        },
        commands: {},
      })
    })
  })

  describe("complex combinations", () => {
    test("options and flags with multiple aliases", () => {
      const p = parser({
        name: "parser",
        arguments: [
          flag({
            name: "verbose",
            long: ["verbose", "details", "v"],
            short: ["V", "vb"],
          }),
          option({
            name: "output",
            long: ["output", "out", "o"],
            short: ["O", "op"],
          }),
        ],
      })

      // Test flag aliases
      expect(p.parse(["--verbose"]).arguments.verbose.value).toBe(true)
      expect(p.parse(["--details"]).arguments.verbose.value).toBe(true)
      expect(p.parse(["--v"]).arguments.verbose.value).toBe(true)
      expect(p.parse(["-V"]).arguments.verbose.value).toBe(true)
      expect(p.parse(["-vb"]).arguments.verbose.value).toBe(true)

      // Test option aliases
      expect(p.parse(["--output", "file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["--out", "file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["--o", "file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["-O", "file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["-op", "file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["--output=file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["--out=file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["--o=file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["-O=file.txt"]).arguments.output.value).toBe("file.txt")
      expect(p.parse(["-op=file.txt"]).arguments.output.value).toBe("file.txt")
    })
  })
})

describe("infinite sequence", () => {
  describe("basic infinite sequence functionality", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "verbose" }), infiniteSequence({ name: "files" })],
    })

    test("infinite sequence with multiple files", () => {
      expect(p.parse(["file1.txt", "file2.txt", "file3.txt"])).toEqual({
        argv: ["file1.txt", "file2.txt", "file3.txt"],
        arguments: {
          verbose: {
            value: false,
            raw: undefined,
            index: -1,
            detected: false,
            parser: "test",
          },
          files: {
            value: ["file1.txt", "file2.txt", "file3.txt"],
            raw: "file1.txt file2.txt file3.txt",
            index: 0,
            detected: true,
            parser: "test",
          },
        },
        commands: {},
      })
    })

    test("infinite sequence with single file", () => {
      expect(p.parse(["single.txt"])).toEqual({
        argv: ["single.txt"],
        arguments: {
          verbose: {
            value: false,
            raw: undefined,
            index: -1,
            detected: false,
            parser: "test",
          },
          files: {
            value: ["single.txt"],
            raw: "single.txt",
            index: 0,
            detected: true,
            parser: "test",
          },
        },
        commands: {},
      })
    })

    test("infinite sequence with no files", () => {
      expect(p.parse([])).toEqual({
        argv: [],
        arguments: {
          verbose: {
            value: false,
            raw: undefined,
            index: -1,
            detected: false,
            parser: "test",
          },
          files: {
            value: [],
            raw: undefined,
            index: -1,
            detected: false,
            parser: "test",
          },
        },
        commands: {},
      })
    })

    test("infinite sequence with flag", () => {
      expect(p.parse(["--verbose", "file1.txt", "file2.txt"])).toEqual({
        argv: ["--verbose", "file1.txt", "file2.txt"],
        arguments: {
          verbose: {
            value: true,
            raw: "--verbose",
            index: 0,
            detected: true,
            parser: "test",
          },
          files: {
            value: ["file1.txt", "file2.txt"],
            raw: "file1.txt file2.txt",
            index: 1,
            detected: true,
            parser: "test",
          },
        },
        commands: {},
      })
      expect(p.parse(["file1.txt", "--verbose", "file2.txt"])).toEqual({
        argv: ["file1.txt", "--verbose", "file2.txt"],
        arguments: {
          verbose: {
            value: true,
            raw: "--verbose",
            index: 1,
            detected: true,
            parser: "test",
          },
          files: {
            value: ["file1.txt", "file2.txt"],
            raw: "file1.txt file2.txt",
            index: 0,
            detected: true,
            parser: "test",
          },
        },
        commands: {},
      })
    })
  })

  describe("infinite sequence with commands", () => {
    const p = parser({
      name: "test",
      arguments: [flag({ name: "verbose" }), infiniteSequence({ name: "files" })],
      commands: [command({ name: "compress" }), command({ name: "analyze" })],
    })

    test("infinite sequence stops at command", () => {
      expect(p.parse(["file1.txt", "file2.txt", "compress"])).toEqual({
        argv: ["file1.txt", "file2.txt", "compress"],
        arguments: {
          verbose: {
            value: false,
            raw: undefined,
            index: -1,
            detected: false,
            parser: "test",
          },
          files: {
            value: ["file1.txt", "file2.txt"],
            raw: "file1.txt file2.txt",
            index: 0,
            detected: true,
            parser: "test",
          },
        },
        commands: {
          compress: {
            detected: true,
            index: 2,
            arguments: {},
            commands: {},
          },
          analyze: {
            detected: false,
            index: -1,
            arguments: {},
            commands: {},
          },
        },
      })
    })

    test("infinite sequence with flag before command", () => {
      expect(p.parse(["--verbose", "file1.txt", "file2.txt", "analyze"])).toEqual({
        argv: ["--verbose", "file1.txt", "file2.txt", "analyze"],
        arguments: {
          verbose: {
            value: true,
            raw: "--verbose",
            index: 0,
            detected: true,
            parser: "test",
          },
          files: {
            value: ["file1.txt", "file2.txt"],
            raw: "file1.txt file2.txt",
            index: 1,
            detected: true,
            parser: "test",
          },
        },
        commands: {
          compress: {
            detected: false,
            index: -1,
            arguments: {},
            commands: {},
          },
          analyze: {
            detected: true,
            index: 3,
            arguments: {},
            commands: {},
          },
        },
      })
    })

    test("command without infinite sequence files", () => {
      expect(p.parse(["compress"])).toEqual({
        argv: ["compress"],
        arguments: {
          verbose: {
            value: false,
            raw: undefined,
            index: -1,
            detected: false,
            parser: "test",
          },
          files: {
            value: [],
            raw: undefined,
            index: -1,
            detected: false,
            parser: "test",
          },
        },
        commands: {
          compress: {
            detected: true,
            index: 0,
            arguments: {},
            commands: {},
          },
          analyze: {
            detected: false,
            index: -1,
            arguments: {},
            commands: {},
          },
        },
      })
    })
  })

  describe("infinite sequence with other argument types", () => {
    const p = parser({
      name: "test",
      arguments: [
        positional({ name: "input" }),
        flag({ name: "verbose" }),
        option({ name: "output" }),
        infiniteSequence({ name: "files" }),
      ],
    })

    test("infinite sequence with positional before", () => {
      expect(
        p.parse([
          "input.txt",
          "--verbose",
          "--output",
          "result.txt",
          "file1.txt",
          "file2.txt",
          "file3.txt",
          "dest.txt",
        ])
      ).toEqual({
        argv: [
          "input.txt",
          "--verbose",
          "--output",
          "result.txt",
          "file1.txt",
          "file2.txt",
          "file3.txt",
          "dest.txt",
        ],
        arguments: {
          input: {
            value: "input.txt",
            raw: "input.txt",
            index: 0,
            detected: true,
            parser: "test",
          },
          verbose: {
            value: true,
            raw: "--verbose",
            index: 1,
            detected: true,
            parser: "test",
          },
          output: {
            value: "result.txt",
            raw: "--output result.txt",
            index: 2,
            detected: true,
            parser: "test",
          },
          files: {
            value: ["file1.txt", "file2.txt", "file3.txt", "dest.txt"],
            raw: "file1.txt file2.txt file3.txt dest.txt",
            index: 4,
            detected: true,
            parser: "test",
          },
        },
        commands: {},
      })
    })
  })

  describe("flags mixed within infinite sequence positionals", () => {
    const p = parser({
      name: "test",
      arguments: [
        flag({ name: "verbose" }),
        flag({ name: "debug" }),
        infiniteSequence({ name: "files" }),
      ],
    })

    test("flag after infinite sequence files should be detected separately", () => {
      // Note: This tests whether flags are correctly identified even when they appear
      // after some positional arguments that could be consumed by infinite sequence
      expect(p.parse(["file1.txt", "--verbose", "file2.txt", "--debug", "file3.txt"])).toEqual({
        argv: ["file1.txt", "--verbose", "file2.txt", "--debug", "file3.txt"],
        arguments: {
          verbose: {
            value: true,
            raw: "--verbose",
            index: 1,
            detected: true,
            parser: "test",
          },
          debug: {
            value: true,
            raw: "--debug",
            index: 3,
            detected: true,
            parser: "test",
          },
          files: {
            value: ["file1.txt", "file2.txt", "file3.txt"],
            raw: "file1.txt file2.txt file3.txt",
            index: 0,
            detected: true,
            parser: "test",
          },
        },
        commands: {},
      })
    })

    test("multiple flags before infinite sequence", () => {
      expect(p.parse(["--verbose", "--debug", "file1.txt", "file2.txt"])).toEqual({
        argv: ["--verbose", "--debug", "file1.txt", "file2.txt"],
        arguments: {
          verbose: {
            value: true,
            raw: "--verbose",
            index: 0,
            detected: true,
            parser: "test",
          },
          debug: {
            value: true,
            raw: "--debug",
            index: 1,
            detected: true,
            parser: "test",
          },
          files: {
            value: ["file1.txt", "file2.txt"],
            raw: "file1.txt file2.txt",
            index: 2,
            detected: true,
            parser: "test",
          },
        },
        commands: {},
      })
    })
  })

  describe("infinite sequence with complex scenarios", () => {
    const p = parser({
      name: "test",
      arguments: [
        flag({ name: "force" }),
        option({ name: "config" }),
        infiniteSequence({ name: "files" }),
      ],
      commands: [
        command({
          name: "process",
          arguments: [option({ name: "threads" }), flag({ name: "parallel" })],
        }),
      ],
    })

    test("complex scenario with command and command arguments", () => {
      expect(
        p.parse(["--force", "--config", "config.json", "file1.txt", "file2.txt", "process"])
      ).toEqual({
        argv: ["--force", "--config", "config.json", "file1.txt", "file2.txt", "process"],
        arguments: {
          force: {
            value: true,
            raw: "--force",
            index: 0,
            detected: true,
            parser: "test",
          },
          config: {
            value: "config.json",
            raw: "--config config.json",
            index: 1,
            detected: true,
            parser: "test",
          },
          files: {
            value: ["file1.txt", "file2.txt"],
            raw: "file1.txt file2.txt",
            index: 3,
            detected: true,
            parser: "test",
          },
        },
        commands: {
          process: {
            detected: true,
            index: 5,
            arguments: {
              threads: {
                value: undefined,
                raw: undefined,
                index: -1,
                detected: false,
                parser: "test.process",
              },
              parallel: {
                value: false,
                raw: undefined,
                index: -1,
                detected: false,
                parser: "test.process",
              },
            },
            commands: {},
          },
        },
      })
    })
  })

  describe("edge cases", () => {
    test("infinite sequence with sequence argument", () => {
      const p = parser({
        name: "test",
        arguments: [
          sequence({
            name: "inputOutput",
            arguments: [positional({ name: "input" }), positional({ name: "output" })],
          }),
          infiniteSequence({ name: "extraFiles" }),
        ],
      })

      expect(p.parse(["input.txt", "output.txt", "extra1.txt", "extra2.txt"])).toEqual({
        argv: ["input.txt", "output.txt", "extra1.txt", "extra2.txt"],
        arguments: {
          inputOutput: {
            value: {
              input: {
                value: "input.txt",
                raw: "input.txt",
                index: 0,
                detected: true,
                parser: "test.input",
              },
              output: {
                value: "output.txt",
                raw: "output.txt",
                index: 1,
                detected: true,
                parser: "test.output",
              },
            },
            raw: "input.txt output.txt",
            index: 0,
            detected: true,
            parser: "test",
          },
          extraFiles: {
            value: ["extra1.txt", "extra2.txt"],
            raw: "extra1.txt extra2.txt",
            index: 2,
            detected: true,
            parser: "test",
          },
        },
        commands: {},
      })
    })

    test("infinite sequence with only flags and options", () => {
      const p = parser({
        name: "test",
        arguments: [
          flag({ name: "verbose" }),
          option({ name: "config" }),
          infiniteSequence({ name: "files" }),
        ],
      })

      expect(p.parse(["--verbose", "--config", "config.json"])).toEqual({
        argv: ["--verbose", "--config", "config.json"],
        arguments: {
          verbose: {
            value: true,
            raw: "--verbose",
            index: 0,
            detected: true,
            parser: "test",
          },
          config: {
            value: "config.json",
            raw: "--config config.json",
            index: 1,
            detected: true,
            parser: "test",
          },
          files: {
            value: [],
            raw: undefined,
            index: -1,
            detected: false,
            parser: "test",
          },
        },
        commands: {},
      })
    })

    test("multiple infinite sequences are not allowed in the same parser", () => {
      // This should throw an error with the new validation rule
      expect(() => {
        parser({
          name: "test",
          arguments: [
            infiniteSequence({ name: "inputFiles" }),
            infiniteSequence({ name: "outputFiles" }),
          ],
        })
      }).toThrow('Cannot define infiniteSequence "outputFiles" after an infiniteSequence')
    })
  })
})

describe("infinite sequence validation", () => {
  test("throws error when positional is defined after infiniteSequence", () => {
    expect(() => {
      parser({
        name: "test",
        arguments: [infiniteSequence({ name: "files" }), positional({ name: "output" })],
      })
    }).toThrow('Cannot define positional "output" after an infiniteSequence')
  })

  test("throws error when sequence is defined after infiniteSequence", () => {
    expect(() => {
      parser({
        name: "test",
        arguments: [
          infiniteSequence({ name: "files" }),
          sequence({
            name: "pair",
            arguments: [positional({ name: "input" }), positional({ name: "output" })],
          }),
        ],
      })
    }).toThrow('Cannot define sequence "pair" after an infiniteSequence')
  })

  test("throws error when another infiniteSequence is defined after infiniteSequence", () => {
    expect(() => {
      parser({
        name: "test",
        arguments: [infiniteSequence({ name: "files" }), infiniteSequence({ name: "extras" })],
      })
    }).toThrow('Cannot define infiniteSequence "extras" after an infiniteSequence')
  })

  test("allows infiniteSequence in parent parser and another in command", () => {
    // This should not throw an error
    const p = parser({
      name: "test",
      arguments: [infiniteSequence({ name: "files" })],
      commands: [
        command({
          name: "process",
          arguments: [infiniteSequence({ name: "outputs" })],
        }),
      ],
    })

    expect(p).toBeDefined()

    // Test that both infiniteSequences work correctly
    expect(p.parse(["file1.txt", "file2.txt", "process", "output1.txt", "output2.txt"])).toEqual({
      argv: ["file1.txt", "file2.txt", "process", "output1.txt", "output2.txt"],
      arguments: {
        files: {
          value: ["file1.txt", "file2.txt"],
          raw: "file1.txt file2.txt",
          index: 0,
          detected: true,
          parser: "test",
        },
      },
      commands: {
        process: {
          detected: true,
          index: 2,
          arguments: {
            outputs: {
              value: ["output1.txt", "output2.txt"],
              raw: "output1.txt output2.txt",
              index: 3,
              detected: true,
              parser: "test.process",
            },
          },
          commands: {},
        },
      },
    })
  })
})
