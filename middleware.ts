// ✅ FIX C-3: Next.js App Router requires the middleware file to be named `middleware.ts`
// at the project root. proxy.ts handles all the logic — this file is the entry point.
export { middleware, config } from './proxy';
