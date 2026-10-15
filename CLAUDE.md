# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Omni Embed Demo — a Next.js 14 (Pages Router) app demonstrating secure SSO embedding of Omni BI analytics. It uses the `@omni-co/embed` SDK server-side to generate signed URLs, which are rendered client-side in iframes. This is an open-source reference implementation for Omni customers.

For Omni work in this repository, prefer the Embed SDK and embed docs over the Omni REST API. Use `@omni-co/embed` plus `docs.omni.co/embed` first; use `docs.omni.co/api` only when the task is explicitly about REST endpoints rather than embedding.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

Diagnostic endpoint to verify env config: `curl http://localhost:3000/api/test-env`

## Environment Setup

Copy `env.example` to `.env` and set:
- `OMNI_SECRET` — exactly 32 characters, from Admin > Embed in Omni
- `OMNI_ORGANIZATION_NAME` — for standard domains (`org.embed-omniapp.co`)
- `OMNI_HOST` — for vanity/custom domains (use one or the other, not both)

## Architecture

The embed flow is a server-signed URL pattern:

```
index.tsx (user/config selection)
  → OmniEmbed.tsx (POST /api/embed-url with { config, user })
    → api/embed-url.ts (validates, dispatches by contentType)
      → lib/omni-embed.ts (calls @omni-co/embed SDK with secret)
    ← returns { url }
  ← renders iframe with signed URL
```

### Key Files

- **`src/lib/omni-embed.ts`** — SDK wrapper. Calls `embedSsoDashboard`, `embedSsoWorkbook`, or `embedSsoContentDiscovery` based on `contentType`. Contains the `EmbedConfig` discriminated union type. This is the only file that touches `OMNI_SECRET`.
- **`src/pages/api/embed-url.ts`** — API route. Handles three content type branches: `navigation` (maps to dashboard + Application mode), `content-discovery`, and standard dashboard/workbook.
- **`src/components/OmniEmbed.tsx`** — Client-side React component. Fetches signed URL from the API, renders an iframe with sandbox attributes.
- **`src/types/omni.ts`** — Shared types (`OmniEmbedConfig`, `OmniUser`, `OmniError`) used across client and server.
- **`src/config/demo-ids.ts`** — All Omni instance-specific IDs (dashboard, workbook, connection, theme). Users edit this single file to connect to their own Omni instance.
- **`src/pages/index.tsx`** — Demo page with `DEMO_USERS` array, `EMBED_CONFIGS` array, and `USER_CONNECTION_ROLES` mapping. Content IDs are imported from `config/demo-ids.ts`.

### Content Types

The app supports these embed modes via `contentType`:
- `dashboard` — single dashboard embed
- `workbook` — single workbook embed
- `navigation` — custom type that uses dashboard SDK with `EmbedSessionMode.Application` for full nav
- `content-discovery` — Hub/home page embed using `embedSsoContentDiscovery` with a `path` param

### Path alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

## Security Rules

- All secrets stay server-side in `lib/omni-embed.ts` — never import it from client code
- Signed URL generation must only happen in API routes
- `.env` files are gitignored; never commit secrets
- API routes have security headers (nosniff, DENY framing, XSS protection) via `next.config.js`

## SDK signing

The app pins `@omni-co/embed` 1.1.0 and uses its v1 signers. `lib/omni-embed.ts` narrows the mutually exclusive `host`/`organizationName` environment paths without TypeScript suppressions and sets a five-minute URL expiry.

## Agents

Two documentation agents are available in `.claude/agents/` for looking up Omni docs:

- **`omni-embed-docs`** — Omni embedding docs and full `@omni-co/embed` SDK reference (function signatures, enums, custom theme properties, 2-step SSO flow). Use this for any embed-related questions.
- **`omni-docs`** — Full Omni platform docs (modeling, API, AI, administration, connections, integrations, etc.). Use this for broader Omni questions beyond embedding.

## Stack

- Next.js 14 (Pages Router, not App Router)
- React 18
- TypeScript (strict mode)
- Tailwind CSS 3
- `@omni-co/embed` SDK 1.1.0
