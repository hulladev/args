import type { ZodIssue, ZodTypeAny } from "zod"
import { ParserError } from "../../lib/errors"

export function handleSchema<T extends ZodTypeAny>({
  schema,
  value,
  path,
}: {
  schema: T
  value: string | boolean
  path: string
}) {
  const result = schema.safeParse(value)
  if (result.success) {
    return result.data
  }
  const error = result.error.issues[0] as ZodIssue
  throw new ParserError({
    message: error.message,
    code: error.code,
    parser: "args",
    from: "zod",
    argvIndex: -1,
    argumentName: "",
    path: [path, ...error.path],
  })
}
