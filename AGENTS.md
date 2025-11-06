# Agent Guidelines

## Build/Test Commands
- **Run:** `bun src/main.ts` or `bun --hot src/main.ts` (with hot reload)
- **Test:** `bun test` (automated tests only) or `bun test <file.test.ts>` (single test)
- **Build:** `bun build <file.ts>` or `bun build <file.html>`
- **Install:** `bun install`
- **Note:** Do not test interactive applications - ask the user to test the implementation manually

## Runtime & APIs
- Use **Bun** instead of Node.js (no `node`, `npm`, `express`, `dotenv`, `ws`, `better-sqlite3`, `pg`, `ioredis`, `execa`)
- Prefer Bun APIs: `Bun.serve()`, `Bun.file`, `bun:sqlite`, `Bun.redis`, `Bun.sql`, built-in `WebSocket`, `Bun.$\`cmd\``
- Bun auto-loads `.env` files

## Code Style
- **TypeScript:** Strict mode enabled (`strict: true`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `noImplicitOverride`)
- **Imports:** Use ES modules (`import`/`export`), `.ts` extensions allowed, verbatim module syntax
- **Formatting:** Follow tsconfig.json bundler mode conventions
- **Naming:** Use `main.ts` for entry points, not `index.ts`
- **Testing:** Use `import { test, expect } from "bun:test"`
- **Frontend:** Import HTML files directly in `Bun.serve()`, use HTML imports for React/CSS/Tailwind (no Vite)
- **Error Handling:** TypeScript strict mode enforces null/undefined checks
- **Operators:** Always use `??` (nullish coalescing) over `||` (logical OR) for default values
- **Variable Naming:** Never use single letter variables except for well-known cases like `i` in for loops
