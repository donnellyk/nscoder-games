# Timeline

> **Completed 2026-09-20.**
>
> Deviations:
> - Process was kept light at the user's request (throwaway code): no per-phase verifier agents, no `local-review`, no comment-hygiene pass. A grep found no plan references in the source.
> - The repo is not under git, so nothing was committed.
> - Phase 7 ran as headless Chrome screenshots at 1280x720 (game view) and 1440x900 (admin), plus a simulated pointer drag, because the Chrome extension was not connected. No 1920x1080 screenshot was captured. Nobody has played a full game by hand, and Safari is untested.
> - The result panel on the game view hides the category icon and label so the date and fact fit above a full timeline at 720p.
> - Compact timeline cards set the name vertically. Long names truncate with an ellipsis.
> - Dataset: 161 items. Macintosh SE and Smart Keyboard were left out because each shares an on-sale date with another item. Products that launched the same day as another item (FaceTime, Siri, visionOS, Studio Display, AirPods 4, Pro Display XDR, Apple Pencil) carry month precision, so either order is accepted.
>
> Lingering issues:
> - Dates kept at month or year precision because sources disagree or give no day: apple-i, apple-lisa, power-mac-g4-cube, macbook-pro-touch-bar, system-6, final-cut-pro, opendoc, testflight, magsafe-charger, apple-mouse, apple-iie.
> - The FLIP slide of a wrong card and the hover glow were checked only as still frames. Watch them once on the real projector.

> **Changed after completion (2026-09-20), at the user's direction. The plan text below is superseded where it disagrees:**
> - Drops are provisional. The host confirms with a Confirm button (`place` and `confirm` actions); the card can be moved until then.
> - The game view is a 16:9 stage sized in container units. The admin view embeds the same stage, and the dragged card's position is broadcast as a fraction of the stage box, so the projector mirrors the drag.
> - Timeline on top, current card at the bottom, light Apple Store style.
> - The reveal shows a product image (`scripts/fetch-images.mjs` downloads Wikipedia lead images; 123 of 140 items have one).
> - Categories are a single choice (Everything, Hardware, Software, Accessories). Setup choices live in shared state (`configure` action) and show on the game view.
> - The admin setup screen has a master item list; removed ids are stored in `settings.excluded`.
> - Dataset rule: official Apple names, first release of each product line only. 140 items.
> - Sessions: a manually started and ended run of games in which shown items never repeat (`session` in state, `startSession` / `endSession`, `unavailableIds`).
> - Three themes chosen at setup (`settings.theme`: `store`, `dark`, `gameshow`), applied to the stage in both windows.
> - Reveal effects on the stage: confetti for a correct answer, a frowning-emoji shower for a wrong one.

Code must not cite this document. Comments state the reason, never the phase or this path.

## Goal

A repo of meetup games that run on one laptop with no internet. The first game is a timeline game about Apple release dates, inspired by the Vergecast gadget-memory quiz. The host drags a product card into a gap on a growing timeline. The drop reveals the release date at once and shows whether the placement was correct. A wrong card slides to its true spot.

Two browser windows share state: an admin view on the laptop screen and a game view on the projector.

## Decisions from the interview

- Growing timeline. Every placed card stays. The next card goes into one of the gaps.
- The host drags on the admin view. The game view mirrors the drag and the result.
- Head-to-head: any number of named players, alternating turns on one shared timeline, 1 point per correct drop. The game ends after a set number of cards.
- Mass mode: no players and no score. The host drags where the crowd shouts.
- Cards show name, category, and a drawn icon. The reveal adds the release date and a one-line fact. No product photos.
- Order is judged by exact on-sale date, so iPad (April 2010) goes before iPhone 4 (June 2010).
- The reveal happens at once on drop, and drops are final. There is no Undo.
- The game is called "Timeline". The name shows on the launcher and the game view's waiting screen.
- Services such as the App Store and iCloud count as software.
- No sound.
- The game runs from a local web server started with one command. No build step, no npm dependencies.

## Phase overview

1. **Skeleton and sync** — repo layout, start command, launcher page, the channel that shares state between windows. Independent.
2. **Rules core** — pure game logic with tests: judging a drop, the reducer, dealing a deck. Independent. Uses the Item shape defined under Nouns.
3. **Dataset** — about 150 Apple items with dates, facts, and sources, plus a validation test. Independent. Uses the Item shape defined under Nouns.
4. **Admin view** — setup form, drag and drop, host controls. Builds on 1, 2, 3.
5. **Game view** — projector display that renders state snapshots. Builds on 1, 2, 3. Can run in parallel with 4.
6. **Date verification** — check every date against its source. Builds on 3. Can run in parallel with 4 and 5.
7. **Projector playtest** — full games in both modes at projector resolutions, then fixes. Builds on 4, 5, 6.

## Nouns and Verbs

**Nouns**

- **Item** — one Apple product: `{ id, name, category, date, tier, fact, source }`.
  - `category`: `hardware`, `software`, or `accessory`. Services such as the App Store and iCloud count as `software`.
  - `date`: on-sale date as `YYYY-MM-DD`, `YYYY-MM`, or `YYYY`, as precise as the source supports.
  - `tier`: `1` (everyone knows it), `2` (Apple fans know it), `3` (deep cut).
  - `source`: URL used to verify the date.
- **Deck** — the shuffled list of item ids still to be dealt.
- **Timeline** — placed item ids, always in date order.
- **Gap** — a drop position on the timeline. A timeline of n cards has n + 1 gaps, numbered from 0 at the left.
- **Current card** — the dealt card waiting to be placed.
- **Player** — `{ name, score }`. Head-to-head only. A team name works as a player.
- **Result** — outcome of the last drop: `{ itemId, droppedGap, correctGap, correct }`.
- **Game state** — one plain object holding mode, players, turn, deck, timeline, current card, hovered gap, last result, and settings.
- **Snapshot** — a full copy of game state sent to the game view.
- **Admin view** — the host's window. The only writer of game state.
- **Game view** — the projector window. Renders snapshots and accepts no game input.

**Verbs**

- **Start game** — take mode, names, and deck settings; deal a seed card to the timeline and a first current card.
- **Hover** — record which gap the dragged card is over.
- **Drop** — place the current card in a gap. This judges, scores, and reveals in one step.
- **Judge** — decide whether a gap is a valid position for an item.
- **Next** — deal the next current card and pass the turn.
- **Skip** — discard the current card without scoring.
- **Adjust score** — host adds or removes a point by hand.
- **Broadcast** — send a snapshot to the game view.

## Phases

### Phase 1: Skeleton and sync

Layout:

```
index.html                 launcher that lists games
package.json               "type": "module", scripts: start, test
shared/
  channel.js               BroadcastChannel wrapper
  store.js                 reducer store with persistence
  projector.css            color, type, and spacing tokens for big screens
games/
  registry.js              list of games for the launcher
  timeline/
    admin.html  game.html
    js/   css/   data/
tests/
```

- `npm start` runs `python3 -m http.server 8000`. Python ships with macOS, so nothing needs installing. A server is required because browsers block ES module imports and cross-window messaging for pages opened as local files.
- `npm test` runs `node --test`. No test dependencies.
- `shared/channel.js` wraps `BroadcastChannel`, one channel name per game. Two message types: `state` (admin to game view, carries a snapshot) and `hello` (game view to admin, requests a snapshot). The game view sends `hello` on load so it can be opened or reloaded at any point in a game.
- The admin view is the only writer. With one writer there is never a conflict to merge, and the game view can be a plain renderer.
- `shared/store.js` takes a reducer and an initial state. On every change it broadcasts a snapshot and saves state to `localStorage`. Saving lets the host reload the admin window mid-game without losing the game.
- The launcher reads `games/registry.js`, so adding a second game later means adding a folder and one registry entry.

### Phase 2: Rules core

Pure modules under `games/timeline/js/`, each with tests. No DOM access, so they run under Node.

- `dates.js` — turn an item's `date` string into a range `[earliest, latest]`. `2010-04` becomes April 1 to April 30.
- `judge.js` — a gap is valid when no card to its left starts after the item's range ends, and no card to its right ends before the item's range starts. Two items whose ranges overlap accept either order. This rule exists because some old products only have a known month or year, and the game should never mark a player wrong on a date nobody can prove. `correctGap` is the valid gap nearest the drop, which keeps a correct card where the player put it.
- `deck.js` — filter items by category and tier, shuffle, and take the requested count. Shuffling happens here and the shuffled deck is passed into the Start game action. The reducer stays free of randomness so tests can assert exact outcomes.
- `reducer.js` — `(state, action) => state` for every verb above. Drop inserts the card at `correctGap`, so the timeline stays sorted without a separate sort step. Drop leaves the turn unchanged; Next passes it. The scoreboard can then show who just played while the result is on screen.
- The game ends when the deck is empty. State moves to `finished` and carries the final standings.

Tests cover: judging at both ends and in the middle, overlapping date ranges, scoring, turn rotation with 2 and 3 players, mass mode ignoring score, Skip, and game end.

### Phase 3: Dataset

- About 150 items across Apple's history, 1976 to the present. Rough split: 70 hardware, 45 software, 35 accessories.
- Stored as ES modules (`data/hardware.js`, `data/software.js`, `data/accessories.js`, combined in `data/items.js`). ES modules load the same way in the browser and in Node tests, with no fetch call.
- Spread items across decades. A deck with 40 items from 2015 to 2025 makes every gap a coin flip between adjacent years.
- Aim for about 50 tier-1 items so mass mode has a friendly deck.
- `fact` is one short sentence. It can carry the announcement date when that differs much from the on-sale date.
- A validation test checks: unique ids, category and tier in range, `date` parses, `source` is a URL, no two items share an exact date, and each decade from the 1980s on has at least 10 items.

### Phase 4: Admin view

- **Setup screen** — mode, player names (add and remove rows), card count (default 10, max 20), categories, tiers. Mass mode hides the player fields and defaults to tier 1.
- **Play screen** — the current card, a compact timeline with a drop zone in every gap, the score table with plus and minus buttons, and buttons for Next, Skip, and End game. Space bar triggers Next.
- **Drag and drop** uses Pointer Events in a small `drag.js`. The HTML drag-and-drop API gives little control over the dragged image and behaves differently on touch screens.
- While dragging, the view dispatches Hover only when the gap index changes. The game view gets a gap index and never pixel coordinates, because the two windows have different sizes.
- Drops are final. The host can correct a score with the plus and minus buttons, and the card stays where the rules put it.
- An "Open game view" button opens `game.html` in a new window. A status line shows whether a game view has said `hello`.
- A "show dates to host" toggle, off by default. Off lets the host play along.

### Phase 5: Game view

- Renders from snapshots only. Every screen is a function of state: waiting, playing, result, finished.
- Layout for 16:9 at 1280x720 and 1920x1080. Sizes use viewport units so text scales with the projector. Dark background and high contrast, since meetup projectors wash out pale colors. System font stack, so nothing downloads.
- The current card sits large at the top with the player's name ("Dana's turn"). The timeline runs along the bottom. The hovered gap opens up and glows.
- Placed cards show name and year. Above 8 placed cards they switch to a compact style so 21 cards fit in one row at 1280 wide.
- On a drop: the card flips to show its date and fact, flashes green or red, and a wrong card slides from the dropped gap to its correct gap. The score updates after the slide.
- Finished screen: standings and winner for head-to-head, "x of y correct" for mass mode.
- A fullscreen button that hides itself in fullscreen.
- Category icons are inline SVG. Use the `frontend-design` skill when building this view.

### Phase 6: Date verification

An audience of Apple developers will notice a wrong date, and a wrong date marks a correct player wrong.

- Check every item's date against its `source` page. Fix the date or lower its precision to month or year where sources disagree.
- Where on-sale dates differed by country, use the first country's date and say so in `fact`.
- Record the check date in a comment at the top of each data file.

### Phase 7: Projector playtest

- Play a full head-to-head game with 3 players and a full mass game, with the game view at 1280x720 and at 1920x1080.
- Check: a 20-card timeline stays readable, reload of either window recovers the game, closing and reopening the game view resyncs.
- Test in Safari and Chrome.
- Fix what the playtest finds. Write a failing test first for any rules bug.

## Open Questions

None.
