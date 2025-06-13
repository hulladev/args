import type { ZodIssueCode } from "zod"

export type Code =
  | ZodIssueCode
  | "missing_required_argument"
  | "ambiguous_arguments"
  | "banned_combined_arguments"

export type ParserErrorConstructor = {
  parser: string
  message: string
  from: "parser" | "zod" | "runtime"
  code: Code
  argvIndex: number
  argumentName: string
  path: Array<string | number>
}

export class ParserError extends Error {
  public parser: string
  public from: "parser" | "zod" | "runtime"
  public code: Code
  public argvIndex: number
  public argumentName: string
  public path: Array<string | number>
  constructor(init: ParserErrorConstructor) {
    super(init.message)
    this.name = "ParserError"
    this.message = init.message
    this.parser = init.parser
    this.from = init.from
    this.code = init.code
    this.argvIndex = init.argvIndex
    this.argumentName = init.argumentName
    this.path = init.path
  }

  public toString() {
    return `${this.name}: ${this.message} (parser: ${this.parser}, from: ${this.from}, code: ${this.code}, argvIndex: ${this.argvIndex}, argumentName: ${this.argumentName}, path: ${JSON.stringify(
      this.path
    )})`
  }
}
