import Controller from "@cartridge/controller";
import { ACTIONS_ADDRESS, KATANA_RPC, CHAIN_ID } from "../config.js";

// Lazy singleton — don't open any popups until the user clicks "Connect"
let ctrl = null;
let account = null;    // WalletAccount returned by connect()
let username = null;   // cached username string

function getCtrl() {
  if (!ctrl) {
    const policies = {
      contracts: {
        [ACTIONS_ADDRESS]: {
          name: "Flag Trivia Actions",
          methods: [
            { name: "Start Game",    entrypoint: "start_game"    },
            { name: "Submit Answer", entrypoint: "submit_answer" },
          ],
        },
      },
    };
    ctrl = new Controller({
      policies,
      chains: [{ rpcUrl: KATANA_RPC }],
      defaultChainId: CHAIN_ID,
    });
  }
  return ctrl;
}

export async function connect() {
  try {
    account = await getCtrl().connect();
    if (!account) throw new Error("connect() returned undefined");

    // Fetch username (fire-and-forget; best effort)
    try {
      const result = await getCtrl().username();
      username = result ?? null;
    } catch {
      username = null;
    }

    console.log("[Controller] Connected:", account.address, "| user:", username);
    return account;
  } catch (err) {
    console.error("[Controller] connect failed:", err);
    account  = null;
    username = null;
    return null;
  }
}

export function isConnected() {
  return account !== null;
}

export function getAddress() {
  return account?.address ?? null;
}

export function getUsername() {
  return username;
}

export function getShortAddress() {
  const addr = getAddress();
  if (!addr) return null;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export function getDisplayName() {
  return username ?? getShortAddress() ?? null;
}

export async function callStartGame(sessionId) {
  if (!account) return null;
  try {
    const result = await account.execute([
      {
        contractAddress: ACTIONS_ADDRESS,
        entrypoint: "start_game",
        calldata: [BigInt(sessionId).toString()],
      },
    ]);
    console.log("[Controller] start_game tx:", result?.transaction_hash);
    return result;
  } catch (err) {
    console.error("[Controller] start_game failed:", err);
    return null;
  }
}

export async function callSubmitAnswer(sessionId, isCorrect) {
  if (!account) return null;
  try {
    // 0 = correct, 1 = wrong  (matches Unity contract convention)
    const answerIndex = isCorrect ? 0 : 1;
    const result = await account.execute([
      {
        contractAddress: ACTIONS_ADDRESS,
        entrypoint: "submit_answer",
        calldata: [BigInt(sessionId).toString(), answerIndex.toString()],
      },
    ]);
    console.log("[Controller] submit_answer tx:", result?.transaction_hash);
    return result;
  } catch (err) {
    console.error("[Controller] submit_answer failed:", err);
    return null;
  }
}
