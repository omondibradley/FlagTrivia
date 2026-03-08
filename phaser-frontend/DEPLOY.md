# Flag Trivia — Phaser Frontend

## 1. Testing Locally

You don't need to know anything about Phaser. Just follow these steps.

### Prerequisites
- [Node.js](https://nodejs.org/) must be installed (v18 or newer).
  Check by running: `node --version`

### Steps

1. Open a terminal and navigate to this folder:
   ```
   cd phaser-frontend
   ```

2. Install dependencies (only needed once):
   ```
   npm install
   ```

3. Start the dev server:
   ```
   npm run dev
   ```

4. Vite will print something like:
   ```
   VITE v6.x  ready in 300ms
   ➜  Local:   http://localhost:5173/
   ```

5. Open that URL in your browser. The game will load.

### What to expect on first load
- A loading bar appears while the Dojo WASM module and 54 flag images are downloaded.
- The **Menu screen** appears with three buttons: **Connect Wallet**, **Start Game**, and **Leaderboard**.
- Click **Connect Wallet** to log in with your Cartridge Controller account — a popup will open at `x.cartridge.gg`.
- Once connected your username (or shortened address) appears and the Connect button disappears.
- Click **Start Game** to play 10 flag questions. Scores are submitted on-chain automatically.
- Click **Leaderboard** to view the top 20 scores pulled from Torii.

> **Note:** You can play without connecting a wallet — scores just won't be recorded on-chain.

### Stopping the server
Press `Ctrl + C` in the terminal.

---

## 2. Building for Production

### Step 1 — Create the build

```
npm run build
```

This produces a `dist/` folder. That folder is your complete, self-contained game — just static files (HTML, JS, WASM, images).

### Step 2 — Verify the build works locally (optional but recommended)

```
npm run preview
```

Open the URL it prints (usually `http://localhost:4173`). If it works here, it will work on itch.io.

---

## 3. Deploying to itch.io

### Step 1 — Zip the `dist/` folder

Zip the **contents** of the `dist/` folder (not the folder itself). On Windows:
- Open `dist/`
- Select all files inside (`Ctrl + A`)
- Right-click → **Compress to ZIP file** (Windows 11) or **Send to → Compressed folder**

The ZIP should contain `index.html` at its root, not `dist/index.html`.

### Step 2 — Upload to itch.io

1. Go to [itch.io](https://itch.io) and log in.
2. Click your profile icon → **Dashboard** → **Create new project**.
3. Fill in:
   - **Title:** Flag Trivia
   - **Kind of project:** HTML
   - **Classification:** Games
4. Under **Uploads**, click **Upload files** and select your ZIP.
5. After uploading, check the box **This file will be played in the browser**.
6. Set **Viewport dimensions** to `480 × 760` (matches the game canvas).
7. Check **Mobile friendly** if you want it playable on phones.
8. Set the game to **Public** (or **Restricted** to test first).
9. Click **Save & view page**.

### Step 3 — Test on itch.io

Open your game page and click **Run game**. The game loads directly in the browser — no download needed.

> **Important:** itch.io serves files over HTTPS. The Cartridge Controller popup and Torii calls both require HTTPS to work, which itch.io provides automatically.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm: command not found` | Install Node.js from nodejs.org |
| Blank screen on load | Open browser DevTools (F12) → Console tab and check for errors |
| Flags not loading | Likely a network issue with flagcdn.com — try refreshing |
| Connect Wallet popup blocked | Allow popups for the site in your browser settings |
| Leaderboard shows "No scores yet" | Play a game while connected to record the first score |
| Build works locally but not on itch.io | Make sure you zipped the *contents* of `dist/`, not the folder itself |
