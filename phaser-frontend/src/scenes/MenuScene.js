import { connect, getDisplayName, isConnected } from "../dojo/controller.js";

const BG     = 0x1a1a2e;
const BLUE   = 0x5b8dee;
const DARK   = 0x16213e;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "Menu" });
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, BG);

    // Title
    this.add
      .text(W / 2, H * 0.18, "🏴 Flag Trivia", {
        fontSize: "42px",
        fontFamily: "Arial",
        color: "#5b8dee",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(W / 2, H * 0.27, "On-Chain Flag Quiz · Powered by Dojo", {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#6677aa",
      })
      .setOrigin(0.5);

    // Player status text
    this.playerText = this.add
      .text(W / 2, H * 0.38, "", {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#22cc55",
      })
      .setOrigin(0.5);

    // Connect Wallet button
    this.connectBtn = this.makeButton(W / 2, H * 0.48, "Connect Wallet", 0x2a3a6e, () =>
      this.onConnect()
    );

    // Start Game button
    this.startBtn = this.makeButton(W / 2, H * 0.60, "Start Game", BLUE, () =>
      this.scene.start("Game")
    );

    // Leaderboard button
    this.makeButton(W / 2, H * 0.72, "Leaderboard", DARK, () =>
      this.scene.start("Leaderboard")
    );

    // Restore connected state if returning from game
    this.refreshConnectionUI();
  }

  makeButton(x, y, label, color, callback) {
    const btn = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 220, 48, color, 1).setInteractive({ useHandCursor: true });
    const txt = this.add
      .text(0, 0, label, {
        fontSize: "18px",
        fontFamily: "Arial",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    bg.on("pointerover",  () => bg.setFillStyle(color === 0x16213e ? 0x2a3a5e : 0x4a7ade));
    bg.on("pointerout",   () => bg.setFillStyle(color));
    bg.on("pointerdown",  () => bg.setAlpha(0.7));
    bg.on("pointerup",    () => { bg.setAlpha(1); callback(); });

    btn.add([bg, txt]);
    return btn;
  }

  async onConnect() {
    // Disable button while connecting
    const [bg] = this.connectBtn.list;
    const [, txt] = this.connectBtn.list;
    bg.disableInteractive();
    txt.setText("Connecting...");

    const account = await connect();
    if (account) {
      this.refreshConnectionUI();
    } else {
      txt.setText("Connect Wallet");
      bg.setInteractive({ useHandCursor: true });
      this.showMessage("Connection failed. Try again.", "#ff6666");
    }
  }

  refreshConnectionUI() {
    if (isConnected()) {
      const name = getDisplayName() ?? "Connected";
      this.playerText.setText(`Connected: ${name}`);
      this.connectBtn.setVisible(false);
    }
  }

  showMessage(msg, color = "#ffffff") {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const t = this.add
      .text(W / 2, H * 0.86, msg, {
        fontSize: "14px",
        fontFamily: "Arial",
        color,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 300, yoyo: true, hold: 1500 });
  }
}
