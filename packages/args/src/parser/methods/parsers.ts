import { ParserError } from "@/lib/errors"
import type {
  ArgHandlerOutput,
  MergedConfig,
  NormalizedParserConfig,
  ValueParams,
} from "@/types/types.private"
import type { ArgOutput } from "@/types/types.public"

export type ParseFn = <C extends NormalizedParserConfig<MergedConfig>>(
  params: ValueParams<C["arguments"][number]>
) => ArgHandlerOutput<ArgOutput<C, C["arguments"][number]["name"]>>

export class Parsers {
  private static instance: Parsers
  private parseArgFn: ParseFn | null = null

  private constructor() {}

  static getInstance(): Parsers {
    if (!Parsers.instance) {
      Parsers.instance = new Parsers()
    }
    return Parsers.instance
  }

  registerParseArg(fn: ParseFn) {
    this.parseArgFn = fn
  }

  getParseArg(): ParseFn {
    if (!this.parseArgFn) {
      throw new ParserError({
        message: "parseArg function not registered",
        code: "invalid_arguments",
        parser: "parser",
        path: [],
        from: "parser",
        argvIndex: -1,
        argumentName: "",
      })
    }
    return this.parseArgFn
  }
}
