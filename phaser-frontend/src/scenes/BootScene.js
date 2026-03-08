import { COUNTRIES, flagUrl } from "../data/countries.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "Boot" });
  }

  preload() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Loading bar
    const bar = this.add.graphics();
    const box = this.add.graphics();
    box.fillStyle(0x222244, 1);
    box.fillRect(W / 2 - 155, H / 2 - 20, 310, 40);

    this.add
      .text(W / 2, H / 2 - 60, "Flag Trivia", {
        fontSize: "32px",
        fontFamily: "Arial",
        color: "#5b8dee",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const statusText = this.add
      .text(W / 2, H / 2 + 40, "Loading flags...", {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#aaaacc",
      })
      .setOrigin(0.5);

    this.load.on("progress", (v) => {
      bar.clear();
      bar.fillStyle(0x5b8dee, 1);
      bar.fillRect(W / 2 - 150, H / 2 - 15, 300 * v, 30);
      statusText.setText(`Loading flags... ${Math.round(v * 100)}%`);
    });

    // Load all 54 flags
    COUNTRIES.forEach((c) => {
      this.load.image(`flag_${c.code}`, flagUrl(c.code));
    });
  }

  create() {
    this.scene.start("Menu");
  }
}
