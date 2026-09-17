# AI evaluation

Written from `docs/prompt-log.txt` only. Times come from that log and are all on 2026-09-16.

## Setup

- **Tool:** Claude Code in the terminal, over 4 sessions between 12:28 and 19:25. From 16:55, a second session worked on the API in parallel, on the same branch.
- **Stack:** Playwright 1.63, TypeScript, Zod and ESLint.
- **Inputs:**
  - the exercise PDF (12:33)
  - `CLAUDE.md` (from 12:49): working rules, branch naming, framework layout, and rules added after reviews
  - `docs/guidelines/` for general, UI and API testing, written by the AI from general knowledge and the Playwright docs (12:49)
  - layout brainstorm pages in a gitignored `artifacts/` folder (13:23)
- **Skills:**
  - `/prompt-log` rebuilds this log (12:36).
  - `/create-pr` checks branch names, stages by path and writes the PR summary (13:04). A scan blocking passwords, secrets and PHI was added at 16:55.
- **Playwright test agents:** planner, generator and healer, through the `playwright-test` MCP server (15:34). UI only.
- **CI:** API and UI QA gates, run in parallel on every pull request (18:28).

## What worked

- **Synthetic oracles found real bugs.** At 16:32 I told the AI to treat the store's data as seeded by the tests and never to hardcode SauceDemo's planted mistakes. Expected values come from oracle files, so any difference fails a test. That found 6 UI bugs:
  - the Onesie typo (16:28)
  - an item total of `$105.96000000000001`, Checkout enabled with an empty cart, and stale rows after Reset App State (17:07)
  - checkout pages that open by URL in any state, and fields of only spaces accepted (17:51)

  The 2 API bugs were ones I already knew and asked it to pin (18:15).
- **Proving tests can fail.** The AI broke tests on purpose before trusting them, then repeated them 10 times (15:58, 16:28, 17:07). It used a wrong password, changed error texts, removed clicks and set a 9% tax rate.
- **The AI caught some of its own mistakes:**
  - Both apps wrote test output to the repo root and overwrote each other (13:48).
  - The agents' `.playwright-mcp/` snapshots contained the password shown on the login page. It gitignored the folder (15:43).
  - Details-page checks could match list cards mid-navigation, a race the generator's drafts also had (16:28).
- **Commit guardrails.** Files were staged by path, so commits left out the other session's work (17:48, 18:26). The scan blocked all 16 fake secrets planted in a throwaway repo, including a password committed and then deleted (16:55).

## What didn't work, and what I changed

| When | What the AI did | How it was caught | What changed |
|---|---|---|---|
| 12:28 | Pointed at the PDF, it started exploring the repo and toolchain | I interrupted it (12:29) | I scope prompts with "do nothing else". `CLAUDE.md` says "do only what's asked" (12:49) |
| 15:15–15:29 | Put the setup files in `tests/`, then in `tests/setup/` after my first correction | My review, twice: "wrong again" (15:29) | `setup/` sits next to `tests/` in both apps, and `CLAUDE.md` says so |
| 16:28 | Kept a `@smoke` tag copied from a placeholder test. Its own guidelines also said to tag tests | I asked why (16:57) | Tags and the tagging advice were removed. Tags came back at 19:20, for priority only |
| 16:28, 19:09 | The auth plan kept a wrong planner claim: every link is a full page load | The AI noticed at 16:28 but left it. A clean-up check found it again at 19:09 | A rewrite of `specs/auth.md` was proposed but not done by the last log entry |
| 17:51 | A test failed once in about 150 runs. The AI added a wait for a suspected layout shift | Its own check: 200 more runs, and a forced shift, didn't reproduce it | The unproven wait was removed and the flake written up in the plan. The cause is still unknown |
| 17:55–18:31 | The first API suite only checked response shape and CRUD echoes, both in one `contract/` folder | My review | Split into `schema/` and `functional/`, and real functional tests added: persistence, filters, nested routes, paging, sorting (18:09–18:31) |
| 18:40 | The logout "Back" test was flaky on CI. The AI's first guess was the back-forward cache. The healer ruled that out, then blamed a slow app | The AI checked the evidence: the URL stayed wrong through 14 checks over 5 seconds, and the CI snapshot still showed the product list | It was a race in the test, fixed by waiting for the login form. With the CPU slowed 20×, the old steps failed 10/10 and the fixed ones passed 10/10 |
| 19:14 | Everything was automated without a risk-based order | I noticed at the end | A risk table was added to the README after the fact, and tests were tagged `@p1`–`@p3` with no logic changes |

**Other weak spots:**

- **The generator added little.** Its drafts were rewritten to the framework rules, then deleted (15:58, 16:28, 17:07). The checkout tests were written without it.
- **Two sessions on one branch.** Both edited `CLAUDE.md` at the same time, so commits had to hold back part of the file (18:26). They also left two known-bug conventions: `test.fixme()` for the UI and `test.fail()` for the API (18:34). These were never unified.
- **`test.fixme()` has a cost.** Three "every product" tests are skipped whole because of one typo, so the other 5 products go unchecked (18:28). A skipped test also never reports that its bug was fixed (18:35).
- **Friction.** New skills and agents only loaded after a session restart (13:06, 15:41).

## Takeaways

- **Put corrections in files, not only in chat.** Most corrections became a `CLAUDE.md` rule, so later sessions kept to them.
- **Ask for evidence, not conclusions.** Both guesses about the flaky test were wrong: the AI's and the healer's. The CI snapshot and a slowed-down reproduction settled it.
- **Make tests prove they can fail.** Breaking them on purpose and repeating runs made the results trustworthy, and kept an unproven wait out of the suite.
- **Treat agent output as a draft.** The planner was useful for exploring the site. The generator's drafts were all rewritten, and one planner error still reached a committed plan.
- **Settle the test strategy before automating.** Risk priorities and a single known-bug convention came after the tests were written, or not at all.
