import Phaser from "phaser";
import { BootScene }        from "./scenes/BootScene.js";
import { MenuScene }        from "./scenes/MenuScene.js";
import { GameScene }        from "./scenes/GameScene.js";
import { ResultsScene }     from "./scenes/ResultsScene.js";
import { LeaderboardScene } from "./scenes/LeaderboardScene.js";

const statusEl = document.getElementById("loading-status");
const fillEl   = document.getElementById("loading-fill");

function setStatus(text, pct) {
  if (statusEl) statusEl.textContent = text;
  if (fillEl)   fillEl.style.width = pct + "%";
}

async function start() {
  setStatus("Loading Dojo...", 20);

  // Wait for the WASM init that started in init-dojo.js (public/)
  if (window.__dojoReady) {
    await window.__dojoReady;
  }

  setStatus("Starting game...", 80);

  const config = {
    type: Phaser.AUTO,
    width:  480,
    height: 760,
    backgroundColor: "#1a1a2e",
    parent: "game-container",
    scene: [BootScene, MenuScene, GameScene, ResultsScene, LeaderboardScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    callbacks: {
      postBoot: () => {
        fillEl.style.width = "100%";
        setTimeout(() => {
          const overlay = document.getElementById("loading-overlay");
          if (overlay) overlay.style.display = "none";
        }, 400);
      },
    },
  };

  new Phaser.Game(config);
}

start();
