Here is the complete README document based on our refinements.

---

# AI-Assisted Game: Google Meet Quiz Adventure

## 1. Project Overview

This project is a collaborative quiz game designed to run inside a Google Meet. A host shares their screen, which shows a 2D game world. The 15 participants play by typing in the Google Meet chat. A Playwright bot reads the chat, a backend server manages game state, and the Pixi.js frontend renders the game.

Participants are all on one team. They must collectively find one correct answer to a question to advance to the next "room" (level). Incorrect answers, submitted sequentially, will "kill" the player for that level.

## 2. Core Components

### Backend (Node.js / Python)
* **Game State Machine:** Manages the core game state.
* **WebSocket Server:** The single source of truth for the frontend.
* **Playwright Bot:** Launches a headless browser, joins the Google Meet, and scrapes all chat messages.

### Frontend (Pixi.js)
* **Render-Only:** This is a "dumb" client. It **must not** contain any game logic.
* **WebSocket Client:** Connects to the backend server.
* **Renderer:** Uses Pixi.js to render sprites (players, NPCs, levels) and play animations based *only* on commands from the backend.

## 3. Game State Schema (Backend)

The backend must be the authoritative source of truth for the game. It will need to manage several key pieces of information:

* **Game Status:** A variable to track the game's overall state. This will be either **`ACTIVE`** (level is running, answers are accepted) or **`LEVEL_TRANSITION`** (a cutscene is playing, input is ignored).
* **Judging Lock:** A simple boolean flag (e.g., `is_judging_loop_active`). This is critical. It acts as a "lock" to ensure the judging loop only runs one at a time, preventing multiple players from being judged simultaneously.
* **Level Information:** The backend needs to know the **`current_level`** and its associated data, most importantly the **`correct_answer`** for that level.
* **Player Data:** A collection (like a dictionary or map) that stores information about each player, keyed by their Google Meet username. This should track their **`display_name`** and whether they are **`is_alive`** for the current level.
* **Guessing Queue:** An ordered list or array. When a player submits an answer, they are added to this queue as an object containing their **`player_name`** and their **`answer`**.

## 4. Game Flow & Logic (Backend Responsibility)

This section describes the core logic the backend must execute.

### 4.1. Player Management & Answer Queuing

The backend must listen for all chat messages coming from the Playwright bot.

* **For *any* message:** Check the username. If this player isn't in the **Player Data** collection yet, create a new entry for them and send a `NEW_PLAYER` event.
* **If it's regular chat (no `!`):** Send a `SHOW_CHAT_BUBBLE` event so the frontend can display it.
* **If it's an answer (`!<answer>`):**
    * `if game_status is ACTIVE:`
        * Add the `{ player_name, answer }` to the end of the **`guessing_queue`**.
        * Send a `QUEUE_UPDATED` event to the frontend so it can animate the player getting in line.
        * **Trigger the loop:** Check if the **`judging_lock`** is `false`. If it is, start the *Sequential Judging Loop* (see 4.2).

### 4.2. Sequential Judging Loop (Core Logic)

This is the main "game" loop. It should be designed as a process that can "pause" and "resume."

* `Set the judging_lock to true.` (So this loop can't be triggered again while it's running).
* `while the guessing_queue is not empty:`
    * `Get the first guess (player, answer) from the front of the queue.`
    * `Send the START_JUDGING event` (telling the frontend to animate this player walking to the judge).
    * `PAUSE the backend logic` (e.g., `sleep`, `setTimeout`) for a set time (e.g., 2 seconds) to match the frontend's walk animation.
    * `Check if the player's answer is correct:`
        * **If CORRECT:**
            * `Send JUDGE_RESULT ("correct") event.`
            * `PAUSE backend` for a "success" animation (e.g., 1 second).
            * `Empty the guessing_queue` (the level is over).
            * `Call the Level Transition logic` (see 4.3).
            * `break` (exit this `while` loop).
        * **If WRONG:**
            * `Send JUDGE_RESULT ("wrong") event.`
            * `Update the player's status in Player Data to is_alive = false.`
            * `PAUSE backend` for a "die" animation (e.g., 1 second).
            * (The `while` loop will now automatically continue to the next person in the queue).
* `Set the judging_lock to false.` (The loop is finished and is ready to be triggered again).

### 4.3. Level Transition Logic

This logic is called after a correct answer.

* `Set game_status to LEVEL_TRANSITION.`
* `Load the data for the next level` (e.g., `level_2`, new `correct_answer`).
* `Loop through all players in Player Data and set their is_alive status back to true.` (Revive everyone).
* `Send the LOAD_LEVEL event` to the frontend with all the new level data and the full (revived) player list.
* `PAUSE backend` for a transition animation (e.g., 3 seconds).
* `Set game_status back to ACTIVE.` (The new level is now ready to accept guesses).

## 5. WebSocket API (Backend -> Frontend)

The frontend should be a "dumb client" that only handles commands from the backend. The backend must send the following messages:

* **`FULL_STATE_SYNC(state)`:** Sent on initial connection. Contains the entire game state object (current level, all players, queue, etc.).
* **`NEW_PLAYER(player_object)`:** Tells frontend to add a new player sprite.
* **`SHOW_CHAT_BUBBLE(player_name, message)`:** Display a chat bubble over the player's sprite.
* **`QUEUE_UPDATED(queue_array)`:** Provides the new list of names in the queue. (Frontend uses this to animate the line-up).
* **`START_JUDGING(player_name)`:** Animate this player's sprite walking to the judge NPC.
* **`JUDGE_RESULT(player_name, "correct" | "wrong")`:** Play the corresponding success or fail animation on that player.
* **`LOAD_LEVEL(new_level_data, all_players)`:** Clear old level, render new one, move all players to start positions. (This message also implicitly revives everyone).
