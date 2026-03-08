# FlagTrivia - Local Testing Guide

This guide covers everything needed to run a full local test session from scratch.
Follow the steps in order every time you start a new session.

---

## Overview of Services

| Service | What it does | Port |
|---|---|---|
| Katana | Local Starknet blockchain | 5050 |
| Sozo migrate | Deploys your Cairo contracts | — |
| Torii | Indexes blockchain events for queries | 8080 |
| Unity | Game client | — |

---

## Part 1 — WSL: Start the Backend

Open WSL Ubuntu and run these commands in order.

### Step 1 — Navigate to the project

```bash
cd ~/flag_trivia
```

### Step 2 — Start Katana (local blockchain)

```bash
katana --dev --dev.seed 0 --dev.no-fee &
```

> `--dev.seed 0` keeps addresses consistent across restarts so you don't have to update Unity every time.
> `--dev.no-fee` disables gas fee validation, which is required for `sozo migrate` to succeed.
> Wait for the output to show accounts and settle before continuing.

### Step 3 — Deploy contracts

```bash
sozo migrate
```

Wait for it to finish. You should see output ending with something like:
```
No changes for world at address 0x...
```
or a successful migration summary.

### Step 4 — Get the addresses you need

```bash
python3 -c "import json; d=json.load(open('manifest_dev.json')); print('World address:', d.get('world',{}).get('address','NOT FOUND')); [print('Actions address:', c.get('address','N/A'), '|', c.get('tag')) for c in d.get('contracts',[])]"
```

Copy both addresses. You will need them in Unity (Part 2) and for Torii (Step 6 — the `--world` flag).

### Step 5 — Seed questions on-chain

**This must be done every time Katana is restarted.** All blockchain state is wiped on restart, so the 54 questions must be re-seeded after every `sozo migrate`.

```bash
for i in $(seq 1 54); do sozo execute --dev flag_trivia-actions seed_question $i 0 100; done
```

This takes about a minute. Verify one question was seeded correctly:

```bash
sozo model get flag_trivia-Question 1 --profile dev
```

The `answer_hash` field should be non-zero. If it is 0, the seed failed.

### Step 6 — Start Torii (blockchain indexer)

Pass the world address directly as a flag. Replace the address below with the World address from Step 4 if it differs:

```bash
torii --world 0x00cf2b11877677298bd2a683abc7530a6d354f7c86fc884de83e0441bdfc5769 --rpc http://localhost:5050 &
```

> Do not use `--config torii_dev.toml` — the config file's `[world]` section format is not recognised by Torii and models will not be indexed.

Within a second or two you should see lines like:
```
INFO torii::indexer::processors::register_model: Registered model. namespace=flag_trivia name=LeaderboardEntry
INFO torii::indexer::processors::register_model: Registered model. namespace=flag_trivia name=Question
INFO torii::indexer::processors::register_model: Registered model. namespace=flag_trivia name=GameSession
```

If you see all three, Torii is working. Verify with:

```bash
curl -s http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ models { edges { node { id name } } } }"}' \
  | python3 -m json.tool
```

You should see `LeaderboardEntry`, `Question`, and `GameSession` in the output.

---

## Part 2 — Unity: Update Inspector Addresses

Every time you run `sozo migrate` fresh (e.g. after restarting Katana without `--seed 0`), the contract addresses change and must be updated in Unity.

> If you used `--seed 0` each time, addresses stay the same and you only need to do this once.

### DojoGameClient GameObject

In the Unity Hierarchy, select the GameObject that has the `DojoGameClient` script.

In the Inspector, update:

| Field | Value |
|---|---|
| **Rpc Url** | `http://localhost:5050` |
| **Master Address** | `0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec` |
| **Master Private Key** | `0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912` |
| **Actions Address** | _(paste the Actions address from Step 4)_ |

> The Master Address and Master Private Key are Katana's default dev account and do not change when using `--seed 0`.

### WorldManager GameObject

In the Unity Hierarchy, select the `WorldManager` GameObject.

In the Inspector, update:

| Field | Value |
|---|---|
| **World Address** | _(paste the World address from Step 4)_ |
| **Torii Url** | `http://localhost:8080` |
| **Rpc Url** | `http://localhost:5050` |

---

## Part 3 — Play and Verify

### Step 7 — Press Play in Unity

- The console should log: `Dojo connected! Burner account deployed.`
- It should also log the burner address as a hex string (e.g. `0x03bd...`)
- If you see errors about contracts not deployed, re-check Part 2 addresses

### Step 8 — Play a full game

Start a game and answer all 10 questions through to the results screen.
Each answer fires a `submit_answer` transaction on-chain.

### Step 9 — Verify on-chain data in WSL

Check that your game session was recorded. Replace the values with your burner address and session ID (the session ID is a random number logged when the game starts if you add logging, or you can find it via sozo):

```bash
# List all leaderboard entries
sozo model get flag_trivia-LeaderboardEntry <BURNER_ADDRESS> <SESSION_ID> --profile dev
```

Or query all entities via Torii:

```bash
curl -s http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ entities(first: 100) { items { models { __typename } } } }"}' \
  | python3 -m json.tool
```

### Step 10 — Open the leaderboard in Unity

Click the leaderboard button from the results screen or main menu.
Rows should appear for each completed game session.

---

## Troubleshooting

### Score is 0 and correct_count is 0 after a game
- Questions were not seeded. Run Step 5 (the `for` loop) and play again.

### "Contract not deployed" error on start_game
- Katana was restarted — run `sozo migrate` again, re-seed questions (Step 5), and update the Actions Address and World Address in Unity (Part 2).

### Leaderboard shows 0 entries
1. Check Torii is running: `ps aux | grep torii`
2. Check the world address in the `--world` flag matches your current deployment (Step 4 output)
3. On startup, Torii should log `Registered model` for all 3 models — if not, it's not indexing correctly
4. Play a full game while Torii is running — it only indexes events that happen after it starts

### Burner address logs "Dojo.Starknet.FieldElement" instead of an address
- Already fixed in code. Make sure you have the latest `DojoGameClient.cs`.

### Torii fails to start with "Address already in use"
- A previous Torii instance is still running. Kill it first:
```bash
pkill torii
```
Then restart from Step 6.

### Katana fails to start with "Address already in use"
```bash
pkill katana
```
Then restart from Step 2.

---

## Quick Reference — Full Session Commands

```bash
cd ~/flag_trivia
katana --dev --dev.seed 0 --dev.no-fee &
sozo migrate
for i in $(seq 1 54); do sozo execute --dev flag_trivia-actions seed_question $i 0 100; done
torii --world 0x00cf2b11877677298bd2a683abc7530a6d354f7c86fc884de83e0441bdfc5769 --rpc http://localhost:5050 &
```

Then update Unity Inspector if needed, press Play, and test.
