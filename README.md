# NSCoder Games

Browser games for a local Apple developer meetup. Each game has a host page that controls play and a game view meant for the projector. Both pages must run in the same browser so they share state.

## Games

- **Timeline**: Place Apple products on a timeline by release date.
- **Trivia**: 100 questions on Apple history, Swift, frameworks, tools, and platforms. Flip each card to reveal the answer.

## Running

There is no build step. Serve the repo root and open `http://localhost:8000`:

```sh
npm start
```

With [mise](https://mise.jdx.dev), these tasks start the server and open the host and game windows in Chrome:

```sh
mise run start    # Timeline
mise run trivia   # Trivia
```

Drag the game window to the projector and make it full screen.

## Tests

```sh
npm test
```

## Timeline images

`scripts/fetch-images.mjs` downloads each Timeline item's lead image from Wikipedia into `games/timeline/images/` and regenerates `games/timeline/data/images.js`. Existing images are kept.

```sh
node scripts/fetch-images.mjs
```
