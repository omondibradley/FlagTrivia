import { TORII_URL, WORLD_ADDRESS } from "../config.js";

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

export async function fetchLeaderboard() {
  try {
    const client = await getClient();
    const query = {
      pagination: { limit: 20, offset: 0, order_by: [], direction: "Forward" },
      no_hashed_keys: false,
      models: ["flag_trivia-LeaderboardEntry"],
      historical: false,
    };
    const page = await client.getEntities(query);

    // Page may be { items: [...] } or an object keyed by entity hash
    const rawItems = page?.items ?? Object.values(page ?? {});

    const entries = rawItems
      .map((entity) => {
        const model = entity["flag_trivia-LeaderboardEntry"];
        if (!model) return null;
        const get = (key) => {
          const v = model[key];
          return typeof v === "object" ? Number(v.value ?? v) : Number(v ?? 0);
        };
        const getStr = (key) => {
          const v = model[key];
          return typeof v === "object" ? String(v.value ?? v) : String(v ?? "");
        };
        return {
          player:         getStr("player"),
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
