import { fetchLeaderboard } from "../dojo/torii.js";
import { getDisplayName, isConnected } from "../dojo/controller.js";

const BG   = 0x1a1a2e;
const DARK = 0x16213e;
const BLUE = 0x5b8dee;

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: "Leaderboard" });
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.rectangle(W / 2, H / 2, W, H, BG);

    this.add
      .text(W / 2, 32, "Leaderboard", {
        fontSize: "32px", fontFamily: "Arial", color: "#5b8dee", fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Column headers
    const headerY = 74;
    this.add.text(40,       headerY, "#",       { fontSize: "13px", fontFamily: "Arial", color: "#6677aa" });
    this.add.text(70,       headerY, "Player",  { fontSize: "13px", fontFamily: "Arial", color: "#6677aa" });
    this.add.text(W - 110,  headerY, "Score",   { fontSize: "13px", fontFamily: "Arial", color: "#6677aa" });
    this.add.text(W - 50,   headerY, "Acc",     { fontSize: "13px", fontFamily: "Arial", color: "#6677aa" });

    this.statusText = this.add
      .text(W / 2, H / 2, "Fetching scores...", {
        fontSize: "16px", fontFamily: "Arial", color: "#6677aa",
      })
      .setOrigin(0.5);

    this.rowContainer = this.add.container(0, 0);

    // Back button
    const backBg = this.add.rectangle(W / 2, H - 36, 180, 40, DARK).setInteractive({ useHandCursor: true });
    const backTxt = this.add.text(W / 2, H - 36, "Back", {
      fontSize: "16px", fontFamily: "Arial", color: "#ffffff", fontStyle: "bold",
    }).setOrigin(0.5);
    backBg.on("pointerover", () => backBg.setFillStyle(0x2a3a5e));
    backBg.on("pointerout",  () => backBg.setFillStyle(DARK));
    backBg.on("pointerup",   () => this.scene.start("Menu"));

    // Player stats banner placeholder (filled after data loads)
    this.statsBg  = this.add.rectangle(W / 2, H - 82, W - 20, 36, 0x0d1f3c).setVisible(false);
    this.statsTxt = this.add.text(W / 2, H - 82, "", {
      fontSize: "13px", fontFamily: "Arial", color: "#5b8dee", align: "center",
    }).setOrigin(0.5).setVisible(false);

    // Load entries
    fetchLeaderboard().then((entries) => this.displayEntries(entries, W));
  }

  displayEntries(entries, W) {
    this.statusText.setVisible(false);
    this.rowContainer.removeAll(true);

    if (!entries.length) {
      this.add
        .text(W / 2, this.cameras.main.height / 2, "No scores yet.\nPlay a game to get on the board!", {
          fontSize: "16px", fontFamily: "Arial", color: "#6677aa", align: "center",
        })
        .setOrigin(0.5);
      return;
    }

    // Player stats banner
    if (isConnected()) {
      const myName = getDisplayName();
      const myIdx  = myName ? entries.findIndex((e) => e.player === myName) : -1;
      if (myIdx !== -1) {
        const rank  = myIdx + 1;
        const total = entries.length;
        const pct   = Math.ceil((rank / total) * 100);
        this.statsTxt.setText(`You (${myName})  ·  Rank #${rank} of ${total}  ·  Top ${pct}%`);
        this.statsBg.setVisible(true);
        this.statsTxt.setVisible(true);
      }
    }

    entries.forEach((entry, i) => {
      const y = 96 + i * 36;
      const rowBg = this.add.rectangle(W / 2, y + 14, W - 20, 32, i % 2 === 0 ? 0x111128 : 0x16213e);

      const rankColor = i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#aaaacc";
      const rank  = this.add.text(40,      y + 4, `${i + 1}`,           { fontSize: "14px", fontFamily: "Arial", color: rankColor, fontStyle: i < 3 ? "bold" : "normal" });
      const addr  = this.add.text(70,      y + 4, shortenAddress(entry.player), { fontSize: "13px", fontFamily: "Arial", color: "#ffffff" });
      const score = this.add.text(W - 110, y + 4, entry.score.toString(), { fontSize: "14px", fontFamily: "Arial", color: "#5b8dee", fontStyle: "bold" });
      const acc   = this.add.text(W - 50,  y + 4,
        entry.totalQuestions > 0
          ? `${Math.round((entry.correctCount / entry.totalQuestions) * 100)}%`
          : "-",
        { fontSize: "13px", fontFamily: "Arial", color: "#aaaacc" }
      );

      this.rowContainer.add([rowBg, rank, addr, score, acc]);
    });
  }
}

function shortenAddress(addr) {
  if (!addr || addr.length < 12) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}
