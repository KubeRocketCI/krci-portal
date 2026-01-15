# React/TypeScript Code Quality Rules

## TypeScript Strictness

- **Never use `any`** — use `unknown`, generics, or proper types instead
- **Avoid type assertions** (`as Type`) — fix the type flow; use type guards when narrowing is needed
- **Prefer `interface` for objects**, `type` for unions/intersections/primitives
- **Use `const` assertions** for literal types: `as const`
- **Infer types when obvious** — don't over-annotate (`useState<string>('')` → `useState('')`)

## React Patterns

- **`useEffect` is a last resort** — trigger side effects in event handlers, callbacks, or derived state
- **Derive state instead of syncing** — compute values inline or with `useMemo`, don't `useEffect` to sync state
- **Lift state up or use context** instead of prop drilling beyond 2-3 levels
- **Use controlled components** — avoid refs for form values unless measuring/focusing
- **Prefer composition over props** — pass children/render props instead of boolean flags
- **Single responsibility** — one component = one purpose; extract when logic diverges

## State Management

- **Colocate state** — keep state as close to where it's used as possible
- **Avoid redundant state** — if it can be computed from other state/props, compute it
- **Batch related state** into objects when they change together
- **Use reducers** for complex state transitions with multiple sub-values

## Code Style

- **Write declarative code** — describe *what*, not *how*; avoid imperative loops when `.map/.filter/.reduce` suffice
- **Early returns** — exit early to reduce nesting
- **Destructure props/state** at the top of components
- **Name booleans with `is/has/should`** prefix
- **Use named exports** — avoid default exports for better refactoring

## Performance

- **Memoize expensive computations** with `useMemo`
- **Memoize callbacks passed to children** with `useCallback` only when necessary (child is memoized or in deps array)
- **Avoid inline object/array literals** in JSX props for memoized children
- **Virtualize long lists** — don't render 1000+ items

## Error Handling

- **Handle loading/error/empty states** explicitly
- **Use error boundaries** for UI crashes
- **Validate at boundaries** — sanitize API responses, user inputs; trust internal code

## Modern React (18+)

- **Use `useTransition`** for non-blocking state updates (tabs, filters, navigation)
- **Use `useDeferredValue`** to defer expensive re-renders while keeping UI responsive
- **Use `Suspense`** for async boundaries — loading states belong in the tree, not in components
- **Prefer `use()` hook** for reading promises/context in render (React 19)
- **Use form actions** with `useActionState`/`useFormStatus` instead of manual `onSubmit` handlers (React 19)
- **Use `useOptimistic`** for instant UI feedback on mutations (React 19)
- **Automatic batching** — don't manually batch; React 18+ batches all state updates

## Accessibility (a11y)

- **Use semantic HTML** — `<button>`, `<nav>`, `<main>`, `<article>` over generic `<div>`/`<span>`
- **Interactive elements must be focusable** — don't add `onClick` to `<div>`; use `<button>` or add `tabIndex`, `role`, keyboard handlers
- **Always provide `alt` text** for images; use `alt=""` for decorative images
- **Associate labels with inputs** — use `<label htmlFor>` or wrap input in `<label>`
- **Manage focus** on route changes and modal open/close
- **Use ARIA sparingly** — prefer semantic HTML; ARIA is a last resort, not a first tool
- **Support keyboard navigation** — ensure all interactive elements work with Enter/Space/Escape/Arrow keys
- **Test with screen readers** — don't assume; verify with VoiceOver/NVDA

## Security

- **Never use `dangerouslySetInnerHTML`** unless absolutely necessary; sanitize with DOMPurify if you must
- **Sanitize user input** before displaying — prevent XSS attacks
- **Don't store sensitive data** in localStorage/sessionStorage — use httpOnly cookies for auth tokens
- **Validate on the server** — client validation is UX, not security
- **Avoid `eval()` and `new Function()`** — never execute dynamic strings as code
- **Use `rel="noopener noreferrer"`** on external links with `target="_blank"`
- **Don't expose secrets** in client-side code — env vars prefixed with `VITE_`/`NEXT_PUBLIC_` are public

## General

- **DRY, but not prematurely** — extract only after 2-3 repetitions with clear patterns
- **No magic numbers/strings** — use named constants
- **Prefer async/await** over `.then()` chains
- **Keep functions pure** when possible — same input = same output, no side effects
- **Delete dead code** — don't comment out, remove it

