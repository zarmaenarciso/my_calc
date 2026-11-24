# AGENTS.md — Autonomous Coding Agent & Security Guardrails

This file defines mandatory architectural conventions, security boundaries, and verification workflows for any engineer or autonomous coding agent working in this repository.

---

## 1. Tech Stack

- **Frontend:** React 19, TypeScript (strict + `noUncheckedIndexedAccess`), Vite, React Router (`react-router`), TanStack Query (`@tanstack/react-query`), Zod (`zod`)
- **Styling & Icons:** Tailwind CSS v4 (`@tailwindcss/vite`), `lucide-react`, `clsx`, `tailwind-merge`
- **Backend & Database:** Firebase (Firebase Authentication, Cloud Firestore with Security Rules)
- **Edge & Deployment:** Cloudflare Workers with Static Assets (`wrangler`, `@cloudflare/vite-plugin`), optional Worker API routes in `worker/index.ts`
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`)

---

## 2. Folder Conventions

```text
src/
  components/
    ui/            # Reusable, domain-agnostic UI primitives (Button, Card, Input, etc.)
    layout/        # App shell, responsive navigation, error boundaries
  features/
    <feature>/     # Domain-colocated modules:
      api.ts       #   Firestore queries & mutations + TanStack Query hooks
      schemas.ts   #   Zod schemas & inferred types
      components/  #   Feature-specific UI components
  lib/             # Singletons & utilities (firebase.ts, query-client.ts, env.ts, utils.ts)
  types/           # Firestore document interfaces & shared domain types
worker/
  index.ts         # Cloudflare Worker entrypoint for privileged/edge API endpoints
firestore.rules    # Version-controlled Cloud Firestore Security Rules
firebase.json      # Firebase CLI configuration (Firestore rules & indexes)
```

---

## 3. Standard Commands

| Action | Command |
| :--- | :--- |
| Start local dev server | `npm run dev` |
| Type-check (all project references) | `npx tsc -b --noEmit` (or `npx tsc --noEmit -p tsconfig.app.json`) |
| Lint | `npm run lint` |
| Production build | `npm run build` |
| Deploy Firestore security rules | `npx firebase deploy --only firestore:rules` |
| Generate Cloudflare Worker types | `npx wrangler types` |
| Deploy to Cloudflare Workers | `npx wrangler deploy` |

---

## 4. Non-Negotiable Rules

1. **Zero Exposed Secrets:**
   - NEVER commit `.env`, `.env.*` (except `.env.example`), or `.dev.vars`.
   - NEVER place `FIREBASE_SERVICE_ACCOUNT_JSON`, private keys, or any privileged Admin SDK credentials in a `VITE_*` environment variable or frontend code.
   - Privileged server-side operations MUST live in `worker/index.ts` and read secrets exclusively from Cloudflare Worker Secrets (`env.FIREBASE_SERVICE_ACCOUNT_JSON`).

2. **Database & Firestore Security Rules:**
   - Every new Firestore collection MUST be explicitly defined in `firestore.rules` with granular `read`, `create`, `update`, and `delete` rules scoped to `request.auth`.
   - Keep the default deny-all fallback (`match /{document=**} { allow read, write: if false; }`) intact.

3. **Strict Input & Payload Validation:**
   - All external inputs, Firestore payloads, API responses, and form data MUST be validated with **Zod** (`src/features/<feature>/schemas.ts` or `src/lib/env.ts`).

4. **Mobile-First Responsiveness:**
   - All UI components and layouts MUST be responsive down to `320px` viewport width with zero horizontal overflow (`overflow-x-hidden` is not a substitute for proper responsive layout).
   - Use `min-h-dvh` for full-viewport shells, fluid spacing, and accessible focus rings and ARIA attributes on all interactive elements.

5. **Data Fetching Abstraction:**
   - NEVER call Firebase SDKs (`auth`, `db`, `firestore`) directly inside React UI components.
   - Keep all Firebase queries, mutations, and auth state listeners abstracted inside `src/features/<feature>/api.ts` and expose them via TanStack Query hooks (`useQuery` / `useMutation`).

6. **Verification Gate:**
   - Run `npx tsc -b --noEmit`, `npm run lint`, and `npm run build` after every task and verify **zero** errors before finishing.
