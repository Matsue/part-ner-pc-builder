# Recommendation follow-ups

## Contract

`recommend_products({ category, count? })` is the default action for part-selection
questions (including “CPUはどれがいい？” and “Which CPU would you recommend?”).
It reads the live build and goal, ranks the catalog, and displays three options
unless the user requests one or two. It changes the active category and candidate
cards only. It never adds parts, changes goals, or creates/applies a preview.

The original six tools remain available. `find_products` remains genuinely
read-only for factual lookup and explicit chat-only requests. Custom shortlists
can still use `show_product_candidates`. Selection changes retain the existing
preview/approval flow.

Ranking is deterministic: compatibility errors, power warnings, over-budget
amount, theme and game-target fit (unless budget-first), performance score when
requested, then price. Totals are for selected parts plus a candidate, not an
automatically completed build. Alternatives may miss goals; returned facts and
the visible cards expose their trade-offs. CPU scores do not change this demo's
GPU-based FPS estimates. Presentation copy remains English.

## Automated regression coverage

- White case and V70 White already selected: recommending CPUs displays three
  CPU cards, with CorePeak A6-65 first; selected parts, goal, preview, and version
  remain unchanged.
- A newly selected motherboard affects the next recommendation's socket ranking.
- A CPU follow-up replaces GPU candidates and switches the visible category.
- All five categories return distinct candidates; a smaller requested count works.
- Invalid inputs fail before mutation; raw catalog lookup stays read-only.

## Browser verification — 2026-09-03

In the in-app browser, the new tool was discovered via the real WebMCP registry
and invoked via its tool-call interface, not a debug callback or a DOM fallback.
Calling it with `{ category: 'cpu' }` displayed three CPU cards and read-back
confirmed an unchanged selected build. An invalid count was rejected without
changing candidates. A subsequent read-only GPU lookup left the CPU cards intact.

The screenshot's preselected two-part fixture is covered by the automated test.
Applying that fixture in the browser was denied by the browser's approval check;
it was not bypassed. Browser candidate verification used the unmodified empty
selected build instead.

These checks verify execution and state behavior, **not** an independent
natural-language ChatGPT routing evaluation. Do not describe description-string
tests or manually chosen tool calls as evidence of Japanese/English routing
success.

## Natural-language acceptance check

Reload the deployed page so the current tool definitions are discovered. With
the same model/settings and a fresh conversation for each language:

1. Choose the white case and V70 White, keeping the $2,000 white-build goal.
2. Ask only `CPUはどれがいい？` or `Which CPU would you recommend?`.
3. Check the activity log: `recommend_products` with `category: cpu` should be
   invoked without the user naming it, and three CPU cards should appear.
4. Verify no CPU is selected automatically and the existing parts remain intact.
5. Repeat after changing the motherboard; also try a GPU recommendation and an
   explicit “answer in chat only; do not change the page” request.

Tool selection remains controlled by the host agent. Record actual calls and
visible results; investigate skipped tools rather than counting a text answer as
a successful on-page recommendation.
