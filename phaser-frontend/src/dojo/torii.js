import { TORII_URL, WORLD_ADDRESS } from "../config.js";
import { getAddress, getUsername } from "./controller.js";

let toriiClient = null;

async function getClient() {
  if (toriiClient) return toriiClient;
  if (!window.wasm_bindgen?.ToriiClient) {
    throw new Error("Dojo WASM not initialized");
  }
  toriiClient = await new window.wasm_bindgen.ToriiClient({
    toriiUrl: TORII_URL,
    worldAddress: WORLD_ADDRESS,
  });
  return toriiClient;
}

// Model addresses are zero-padded to 32 bytes (0x0682e...).
// Controller reports them without padding (0x682e...).
function normalizeAddress(addr) {
  if (!addr) return "";
  const stripped = addr.replace(/^0x0*/, "");
  return "0x" + (stripped || "0");
}

export async function fetchLeaderboard() {
  try {
    const client = await getClient();
    const page = await client.getAllEntities(100, null);
    const rawItems = page?.items ?? Object.values(page ?? {});

    // Username is only available for the connected player.
    // Cartridge's API blocks cross-origin fetches from itch.io,
    // so other players fall back to shortened addresses.
    const connectedNorm = normalizeAddress(getAddress() ?? "");
    const connectedUsername = getUsername();

    const entries = rawItems
      .map((entity) => {
        const model = entity.models?.["flag_trivia-LeaderboardEntry"];
        if (!model) return null;
        const get = (key) => {
          const v = model[key];
          return typeof v === "object" ? Number(v.value ?? v) : Number(v ?? 0);
        };
        const getStr = (key) => {
          const v = model[key];
          return typeof v === "object" ? String(v.value ?? v) : String(v ?? "");
        };
        const norm = normalizeAddress(getStr("player"));
        const isMe = connectedNorm && norm === connectedNorm;
        const display = isMe && connectedUsername
          ? connectedUsername
          : norm.slice(0, 6) + "..." + norm.slice(-4);
        return {
          player:         display,
          score:          get("score"),
          correctCount:   get("correct_count"),
          totalQuestions: get("total_questions"),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return entries;
  } catch (err) {
    console.error("[Torii] fetchLeaderboard failed:", err);
    return [];
  }
}
