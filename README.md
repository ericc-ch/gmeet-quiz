# gmeet-quiz

> a collaborative quiz game that runs inside google meet, where participants answer questions through chat while a 2d game world displays the action in real-time

## features

- **real-time 2d visualization** using pixi.js
- **ai-powered answer evaluation** using google gemini
- **automated chat monitoring** via playwright browser automation
- **sequential judging system** where players take turns answering
- **visual feedback** with player sprites, animations, and chat bubbles

## getting started

### prerequisites

- [bun](https://bun.sh) runtime
- chromium browser
- google gemini api key

### installation

```bash
bun install
```

### configuration

create a `.env` file in the root directory:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### running the game

```bash
# start with hot reload
bun run start

# or run directly
bun src/main.tsx
```

the application runs on:

- **http://localhost:4000** - frontend game display
- **http://localhost:3000** - backend api with sse endpoints

## how to play

1. **setup**: start the application and navigate to a google meet tab using the terminal ui
2. **select tab**: use ↑/↓ to navigate, enter to select the google meet page
3. **start game**: press `g` to begin monitoring chat messages
4. **join**: players are automatically detected when they type in chat
5. **answer questions**: players submit answers with `!<answer>` format
6. **watch the action**: view the game display at http://localhost:4000

### terminal ui controls

| key   | action                                 |
| ----- | -------------------------------------- |
| ↑/↓   | navigate browser tabs                  |
| enter | select browser tab for game monitoring |
| n     | create new browser page                |
| r     | refresh page list                      |
| g     | start game monitoring on selected page |
| q     | quit application                       |
| f12   | toggle console                         |

## game mechanics

### answering questions

players submit answers by typing in google meet chat with the `!` prefix:

```
!malware
!secure
!ddos
```

### judging system

1. answers are queued in order of submission
2. each player is judged sequentially with ai evaluation
3. correct answers advance everyone to the next level
4. incorrect answers "kill" that player for the current level
5. all players are revived when advancing to new levels

### ai evaluation

the game uses google gemini 2.5 flash to evaluate answers based on semantic meaning rather than exact text matching. this allows for:

- different wording and phrasing
- synonyms and alternative expressions
- natural language understanding

## architecture

### tech stack

- **runtime**: bun
- **backend**: hono web framework with sse streaming
- **frontend**: pixi.js for 2d rendering
- **state management**: zustand
- **ai**: google gemini 2.5 flash via vercel ai sdk
- **browser automation**: playwright with persistent chromium context
- **terminal ui**: opentui

### project structure

```
src/
├── assets/           # game sprites and fonts
│   ├── walk-1.svg
│   ├── walk-2.svg
│   ├── dead.svg
│   ├── background.svg
│   └── WalterTurncoat-Regular.ttf
├── components/       # react components for terminal ui
│   └── last-action.tsx
├── lib/             # core game logic and utilities
│   ├── ai.ts        # gemini api integration
│   ├── browser.ts   # playwright setup
│   ├── game.ts      # game loop and message polling
│   ├── levels.ts    # quiz level definitions
│   └── types.ts     # typescript interfaces
├── stores/          # zustand state management
│   ├── game.ts      # game state and event system
│   └── ui.ts        # ui state
├── app.tsx          # terminal ui application
├── frontend.ts      # pixi.js game client
├── server.ts        # hono backend with sse
└── main.tsx         # application entry point
```

### event system

the game uses server-sent events (sse) to communicate between backend and frontend:

- `game-state` - initial connection sync with full game state
- `player-joined` - new player detected in chat
- `new-message` - regular chat message (non-answer)
- `answer-submitted` - player submitted an answer
- `start-judging` - begin answer evaluation animation
- `judge-result` - answer correctness result
- `load-level` - transition to new level with revived players
- `queue-updated` - current answer queue state

## customization

### adding levels

edit `src/lib/levels.ts` to add new quiz questions:

```typescript
{
  levelNumber: 6,
  question: "your question here?",
  correctAnswer: "detailed explanation of the correct answer",
}
```

### modifying ai personality

edit the prompt in `src/lib/ai.ts` to customize the ai's tone and evaluation style.

## development

### type checking

```bash
bun run typecheck
```

### formatting

```bash
bun run format
```
