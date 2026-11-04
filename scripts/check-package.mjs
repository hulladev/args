import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const temporary = await mkdtemp(path.join(tmpdir(), "hulla-args-consumers-"))
const run = (binary, args, cwd) => execFileSync(binary, args, { cwd, stdio: "inherit" })

try {
  const manifest = JSON.parse(await readFile("packages/args/package.json", "utf8"))
  run("pnpm", ["--dir", "packages/args", "pack", "--pack-destination", temporary], root)
  const archive = path.join(temporary, `hulla-args-${manifest.version}.tgz`)
  for (const version of [3, 4]) {
    const consumer = path.join(temporary, `zod-${version}`)
    await mkdir(consumer)
    await writeFile(
      path.join(consumer, "package.json"),
      JSON.stringify({ private: true, type: "module" })
    )
    run(
      "npm",
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        archive,
        `zod@^${version}`,
        "typescript@^5.8",
      ],
      consumer
    )
    await writeFile(
      path.join(consumer, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          skipLibCheck: false,
          outDir: "build",
        },
        include: ["consumer.ts"],
      })
    )
    await writeFile(
      path.join(consumer, "consumer.ts"),
      `
import { option, parser, ParserError } from '@hulla/args';
import { z } from 'zod';
const cli = parser({ name: 'sample', settings: { startIndex: 0 }, arguments: [option({ name: 'count', schema: z.coerce.number().int().min(1) })] });
const result = cli.parse(['--count', '2']);
if (result.arguments.count.value !== 2) throw new Error('Coerced option was not returned');
try {
  cli.parse(['--count', '0']);
  throw new Error('Invalid input was accepted');
} catch (error) {
  if (!(error instanceof ParserError) || error.code !== 'too_small') throw error;
}
`
    )
    run(process.execPath, ["node_modules/typescript/bin/tsc"], consumer)
    run(process.execPath, ["build/consumer.js"], consumer)
    const installed = JSON.parse(
      await readFile(path.join(consumer, "node_modules/@hulla/args/package.json"), "utf8")
    )
    assert.equal(installed.version, manifest.version)
  }
} finally {
  await rm(temporary, { recursive: true, force: true })
}
