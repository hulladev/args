# 🚀 @hulla/args

A modern, type-safe, and powerful command-line argument parser for Node.js.

`@hulla/args` provides a declarative API to define your CLI's arguments and commands, with strong TypeScript support to catch errors at compile time and provide a great developer experience with autocompletion.

## ✨ Features

- 🛡️ **Type-Safe**: Written in TypeScript for complete type safety.
- 💧 **Declarative API**: A clean and declarative API for defining arguments and commands.
- ✅ **Validation**: Built-in support for `zod` for powerful schema validation.
- 📦 **Sub-commands**: Support for nested commands.
- 📌 **Argument Types**: Handles flags, options, positionals, and sequences.
- 🆘 **Auto-generated Help**: (Coming soon) Automatic help message generation.

## 📦 Installation

You can install `@hulla/args` using your favorite package manager:

```bash
# pnpm
pnpm add @hulla/args

# npm
npm install @hulla/args

# yarn
yarn add @hulla/args

# bun
bun add @hulla/args
```

## 🚀 Quick Start

Here's a simple example of how to define and parse command-line arguments.

```typescript
// cli.ts
import { parser, positional, flag, option } from '@hulla/args';
import { z } from 'zod';
import { argv } from 'node:process' // can use node/deno/bun or even custom input

const cli = parser({
  name: 'my-app',
  arguments: [
    positional({
      name: 'name',
      description: 'The name to greet.',
      schema: z.string().default('World'),
    }),
    option({
      name: 'greeting',
      description: 'The greeting to use.',
      schema: z.string().default('Hello'),
    }),
    flag({
      name: 'yell',
      description: 'Print the greeting in uppercase.',
      short: 'y',
    }),
  ],
}).parse(argv);

const { name, greeting, yell } = cli.arguments;
let message = `${greeting.value}, ${name.value}!`;

if (yell.value) {
  message = message.toUpperCase();
}

console.log(message);
```

You can run this CLI from your terminal:

```bash
# Basic usage
$ ts-node cli.ts Alice
# Output: Hello, Alice!

# Using an option and a flag
$ ts-node cli.ts Bob --greeting=Hi -y
# Output: HI, BOB!

# Using the default value
$ ts-node cli.ts
# Output: Hello, World!
```

## 📚 Documentation

For more detailed information and advanced usage, please visit the official documentation at **[hulla.dev/docs/args](https://hulla.dev/docs/args)**.

---

