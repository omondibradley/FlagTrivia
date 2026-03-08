# Dojo Integration Session Notes

## Architecture Overview

### Services & Ports
- **Katana** (port 5050) — local Starknet node, handles transactions
- **Torii** (port 8080) — world state indexer, used by WorldManager for entity sync
- These are two separate services and must both be running during play

### Contract
- **Actions address:** `0x22f68cba17ad857e0d4380dc8f31cc6fa0a5f62abcb7400cd366f7225070e95`
- **World address:** `0x00cf2b11877677298bd2a683abc7530a6d354f7c86fc884de83e0441bdfc5769`
- **Entry points:** `seed_question`, `start_game`, `submit_answer`

### Answer Index Convention
Correct answer is **always seeded as index 0** on-chain. Unity sends:
- `0` if the player answered correctly
- `1` if the player answered wrong

This removes any manual per-question index tracking from the Unity side.

---

## Files Changed

### `Assets/Scripts/DojoGameClient.cs`
- Added `using dojo_bindings;`
- Added public `rpcUrl` field (replaces missing `worldManager.dojoConfig.rpcUrl`)
- Changed `Call` → `dojo.Call` (fully qualified type)
- Changed `new Call[]` → `new dojo.Call[]`
- Changed `new FieldElement(...)` → `new FieldElement(...).Inner` for `dojo.Call` fields
  - `dojo.Call.to` expects `dojo_bindings.dojo.FieldElement`, not `Dojo.Starknet.FieldElement`
  - `.Inner` exposes the underlying raw struct

### `Assets/Scripts/FlagQuestion.cs`
- Removed `onChainCorrectIndex` field (no longer needed)

### `Assets/Scripts/QuestionBank.cs` *(new file)*
- Split out from `FlagQuestion.cs` — Unity requires each ScriptableObject class to be in its own file matching the class name

### `Assets/Scripts/GameManager.cs`
- Removed duplicate `FlagQuestion q` declaration inside the Dojo block (was already declared earlier in the same scope)
- Updated submit answer: `isCorrect ? (byte)0 : (byte)1` instead of using `onChainCorrectIndex`

### `Assets/Editor/DojoSeedExporter.cs` *(new file)*
- Unity Editor window: **Dojo → Seed Question Exporter**
- Drag in your QuestionBank asset, set base points, export a `.sh` seed script
- Always seeds with `correct_answer_index = 0`
- QuestionBank is the single source of truth for question IDs and country names

---

## Dojo CLI Notes

### Sozo execute syntax (current version)
```bash
# Correct format — tag, entrypoint, and calldata as positional args
sozo execute --dev flag_trivia-actions seed_question 1 0 100

# Seed all 54 questions
for i in $(seq 1 54); do sozo execute --dev flag_trivia-actions seed_question $i 0 100; done
```

### Query models
```bash
sozo model get flag_trivia-Question 1 --profile dev
sozo model get flag_trivia-GameSession <player_address> <session_id> --profile dev
sozo model get flag_trivia-LeaderboardEntry <player_address> <session_id> --profile dev
```

### Get actions address from manifest
```bash
cat ~/flag_trivia/manifest_dev.json | grep -B5 "flag_trivia-actions" | grep "address"
```

---

## Important: Katana Resets on Restart
Every time Katana is restarted, all state is lost. You must:
1. `sozo migrate --profile dev`
2. Re-seed all questions

---

## Testing Checklist
1. Start Katana: `katana --dev`
2. Start Torii: `torii --config torii_dev.toml`
3. Verify questions seeded: `sozo model get flag_trivia-Question 1 --profile dev` (answer_hash should be non-zero)
4. Hit Play in Unity — check Console for `Dojo connected! Burner account deployed.`
5. Play through 10 questions — check Console for `start_game called` and `submit_answer called` with no errors
6. After game ends, verify LeaderboardEntry on-chain — `score` and `correct_count` should match Unity results screen
