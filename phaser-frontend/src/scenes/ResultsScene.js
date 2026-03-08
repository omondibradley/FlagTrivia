const BG   = 0x1a1a2e;
const BLUE = 0x5b8dee;
const DARK = 0x16213e;

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super({ key: "Results" });
  }

  init(data) {
    this.finalScore      = data.score          ?? 0;
    this.correctCount    = data.correctCount   ?? 0;
    this.totalQuestions  = data.totalQuestions ?? 10;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.rectangle(W / 2, H / 2, W, H, BG);

    this.add
      .text(W / 2, H * 0.12, "Game Over!", {
        fontSize: "38px", fontFamily: "Arial", color: "#5b8dee", fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Animated score
    this.scoreDisplay = this.add
      .text(W / 2, H * 0.30, "0", {
        fontSize: "72px", fontFamily: "Arial", color: "#ffffff", fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(W / 2, H * 0.30 + 56, "points", {
        fontSize: "18px", fontFamily: "Arial", color: "#6677aa",
      })
      .setOrigin(0.5);

    this.add
      .text(W / 2, H * 0.50, `${this.correctCount} / ${this.totalQuestions} correct`, {
        fontSize: "22px", fontFamily: "Arial", color: "#aaaacc",
      })
      .setOrigin(0.5);

    // Animate score counter
    let displayed = 0;
    this.tweens.addCounter({
      from: 0,
      to: this.finalScore,
      duration: 1500,
      ease: "Quad.easeOut",
      onUpdate: (tween) => {
        displayed = Math.floor(tween.getValue());
        this.scoreDisplay.setText(displayed.toString());
      },
    });

    // Buttons
    this.makeButton(W / 2, H * 0.68, "Play Again",   BLUE, () => this.scene.start("Game"));
    this.makeButton(W / 2, H * 0.80, "Leaderboard",  DARK, () => this.scene.start("Leaderboard"));
    this.makeButton(W / 2, H * 0.91, "Main Menu",    DARK, () => this.scene.start("Menu"));
  }

  makeButton(x, y, label, color, callback) {
    const btn = this.add.container(x, y);
    const bg  = this.add.rectangle(0, 0, 220, 46, color).setInteractive({ useHandCursor: true });
    const txt = this.add
      .text(0, 0, label, {
        fontSize: "17px", fontFamily: "Arial", color: "#ffffff", fontStyle: "bold",
      })
      .setOrigin(0.5);

    bg.on("pointerover", () => bg.setFillStyle(color === DARK ? 0x2a3a5e : 0x4a7ade));
    bg.on("pointerout",  () => bg.setFillStyle(color));
    bg.on("pointerup",   () => callback());
    btn.add([bg, txt]);
  }
}
