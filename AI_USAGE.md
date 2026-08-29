# How I used AI on this project

AI assistance is allowed and expected for this assessment. What matters is that I understood, reviewed, and owned everything in the submission. This document is an honest account of that process.

---

## Tools I used

| Tool | What I used it for |
|------|-------------------|
| **Cursor** (primary) | Scaffolding, boilerplate, debugging TypeScript errors, component styling suggestions, writing initial test files |
| **ChatGPT** | Quick lookups — e.g. Mongoose `toJSON` transform behavior with strict TypeScript |

---

## Where AI helped most

- **Project setup** — initial folder structure, `tsconfig`, Vite config, Tailwind config
- **Backend boilerplate** — Express middleware wiring, Mongoose schemas, JWT helpers
- **Test skeletons** — first pass at auth/task/comment test files with Jest + supertest
- **UI styling** — Tailwind class suggestions for cards, badges, forms
- **TypeScript fixes** — strict-mode cast patterns for Mongoose documents

---

## How I reviewed AI output

I didn't copy-paste blindly. For each suggestion:

1. Read it line by line
2. Ran `tsc` / `npm test` / manual API checks to confirm it actually works
3. Changed it when the data shapes or behavior didn't match what the app needed

---

## Things I changed or rejected

### 1. Removing password from JSON — `delete` vs `undefined`

**AI suggested:**
```ts
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  }
});
```

**Problem:** With `"strict": true`, TypeScript complains — you can't `delete` a required property.

**What I did instead:**
```ts
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const r = ret as unknown as Record<string, unknown>;
    r['password'] = undefined;
    return r;
  }
});
```
Same outcome in JSON output, compiles cleanly.

---

### 2. Updating task fields with a dynamic key loop

**AI suggested** casting the Mongoose document directly to `Record<string, unknown>`.

**Problem:** TypeScript strict mode rejects that cast — the document type doesn't overlap with a generic record.

**What I did:** Used `as const` on the allowed field list and a narrow union type for the cast. Safer and still flexible.

---

### 3. Sorting priority in MongoDB

**AI suggested:** `sort({ priority: 1 })` in the query.

**Problem:** Mongo sorts strings alphabetically. `high < low < medium` — useless for priority.

**What I did:** Fetch first, then sort in memory with `{ high: 3, medium: 2, low: 1 }`. I also documented the pagination caveat in `DECISIONS.md` once I realized in-memory sort only applies to the current page.

This is a good example of AI giving a *technically valid* answer that's *semantically wrong* for the domain.

---

### 4. HttpOnly cookies for JWT

**AI suggested** storing the token in an HttpOnly cookie with a logout endpoint.

**Why I skipped it:** Correct for production, but it adds CORS cookie config, `credentials: true` everywhere, and Vite proxy header tweaks. For a timed assessment, `localStorage` + Bearer header is simpler and the tradeoff is documented. I made that call consciously — not because I didn't understand the suggestion.

---

## What I designed myself

These weren't "generate and accept" — I thought through them first:

- Overall architecture (folder layout, layer boundaries)
- REST route design, especially nesting comments under `/tasks/:taskId/comments`
- Priority sort workaround and its pagination limitation
- Debounced search (400 ms, resets page to 1 on filter change)
- Which UI pieces to extract vs keep page-local
- All of `DECISIONS.md` — the tradeoffs are my reasoning
- Test scope — which scenarios actually matter for this app

---

## Takeaway for reviewers

AI sped up boilerplate and caught me on TypeScript edge cases. The architectural calls, security tradeoffs, and bug fixes (like priority sort) came from reading the output critically and testing it. If you ask me to walk through any file or change something live, I can — that's the bar I held myself to.
