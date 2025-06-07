import type { ReadyParserConfig } from "@/types/types.private"
import type { ParserConfig } from "@/types/types.public"

export function createRead<C extends ParserConfig>(config: ReadyParserConfig<C>) {
  return (argv: string[]): string[] => {
    const { startIndex, stopIndex } = config.settings
    const stop = stopIndex ?? argv.length
    const args = argv.slice(startIndex, stop)
    return args
  }
}
