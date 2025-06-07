import type {
  ArgHandlerOutput,
  MergedConfig,
  NormalizedParserConfig,
  ValueParams,
} from "@/types/types.private"
import type {
  ArgOutput,
  ArgType,
  Argument,
  Flag,
  InfiniteSequence,
  Option,
  Positional,
  Sequence,
} from "@/types/types.public"
import type { ZodTypeAny } from "zod"
import { ParserError } from "../../lib/errors"
import { parseFlag } from "./parseFlag"
import { parseInfiniteSequence } from "./parseInfiniteSequence"
import { parseOption } from "./parseOption"
import { parsePositional } from "./parsePositional"
import { parseSequence } from "./parseSequence"
import { Parsers } from "./parsers"

export function parseArg<C extends NormalizedParserConfig<MergedConfig>>(
  params: ValueParams<C["arguments"][number]>
): ArgHandlerOutput<ArgOutput<C, C["arguments"][number]["name"]>> {
  const { arg, path } = params
  switch (arg.type) {
    case "flag": {
      return parseFlag<C, Flag<C["arguments"][number]["name"], C["arguments"][number]["schema"]>>(
        params as ValueParams<
          Flag<C["arguments"][number]["name"], C["arguments"][number]["schema"]>
        >
      )
    }
    case "option": {
      return parseOption<
        C,
        Option<C["arguments"][number]["name"], C["arguments"][number]["schema"]>
      >(
        params as ValueParams<
          Option<C["arguments"][number]["name"], C["arguments"][number]["schema"]>
        >
      )
    }
    case "positional": {
      return parsePositional<
        C,
        Positional<C["arguments"][number]["name"], C["arguments"][number]["schema"]>
      >(
        params as ValueParams<
          Positional<C["arguments"][number]["name"], C["arguments"][number]["schema"]>
        >
      )
    }
    case "sequence": {
      return parseSequence<
        C,
        Sequence<
          C["arguments"][number]["name"],
          C["arguments"][number]["schema"],
          Argument<string, "positional", ZodTypeAny>[]
        >
      >(
        params as ValueParams<
          Sequence<
            C["arguments"][number]["name"],
            C["arguments"][number]["schema"],
            Argument<string, "positional", ZodTypeAny>[]
          >
        >
      )
    }
    case "infiniteSequence": {
      return parseInfiniteSequence<C, InfiniteSequence<C["arguments"][number]["name"]>>(
        params as ValueParams<InfiniteSequence<C["arguments"][number]["name"]>>
      )
    }
    default: {
      throw new ParserError({
        message: `Unknown argument type: ${(arg as Argument<string, ArgType, ZodTypeAny>).type}`,
        code: "invalid_arguments",
        parser: path,
        path: [path],
        from: "parser",
        argvIndex: -1,
        argumentName: (arg as Argument<string, ArgType, ZodTypeAny>).name,
      })
    }
  }
}

// Register parseArg with the parser registry
Parsers.getInstance().registerParseArg(parseArg)
