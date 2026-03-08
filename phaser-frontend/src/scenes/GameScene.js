import { COUNTRIES, shuffle } from "../data/countries.js";
import { QUESTIONS_PER_GAME, TIME_PER_QUESTION } from "../config.js";
import { getAddress, callStartGame, callSubmitAnswer } from "../dojo/controller.js";

const BG          = 0x1a1a2e;
const BLUE        = 0x5b8dee;
const BTN_DEFAULT = 0x16213e;
const BTN_CORRECT = 0x22ab44;
const BTN_WRONG   = 0xd63a3a;

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "Game" });
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.W = W;
    this.H = H;

    // Game state
    this.sessionId      = Math.floor(Math.random() * 999999) + 1;
    this.questions      = shuffle(COUNTRIES).slice(0, QUESTIONS_PER_GAME);
    this.questionIndex  = 0;
    this.score          = 0;
    this.correctCount   = 0;
    this.timeLeft       = TIME_PER_QUESTION;
    this.canAnswer      = false;

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, BG);

    // ── Top bar ─────────────────────────────────────────────────────────
    this.scoreText = this.add.text(16, 12, "Score: 0", {
      fontSize: "18px", fontFamily: "Arial", color: "#ffffff", fontStyle: "bold",
    });

    this.counterText = this.add.text(W - 16, 12, `1/${QUESTIONS_PER_GAME}`, {
      fontSize: "18px", fontFamily: "Arial", color: "#aaaacc",
    }).setOrigin(1, 0);

    // Timer bar background
    this.add.rectangle(W / 2, 52, W - 32, 10, 0x222244, 1);
    this.timerBar = this.add.rectangle(16 + (W - 32) / 2, 52, W - 32, 10, BLUE, 1);
    this.timerBar.setOrigin(0.5, 0.5);

    // ── Flag image (placeholder rect until loaded) ──────────────────────
    const flagY = H * 0.35;
    this.flagBg = this.add.rectangle(W / 2, flagY, 360, 220, 0x222244).setVisible(false);
    this.flagImg = this.add.image(W / 2, flagY, "").setVisible(false);

    // ── Feedback text ───────────────────────────────────────────────────
    this.feedbackText = this.add
      .text(W / 2, flagY, "", {
        fontSize: "28px", fontFamily: "Arial", fontStyle: "bold", color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(false);

    // ── Answer buttons (2×2 grid) ────────────────────────────────────────
    const btnW = (W - 48) / 2;
    const btnH = 52;
    const startX = 16 + btnW / 2;
    const startY = H * 0.66;
    const gap    = 12;

    this.answerBtns = [];
    this.answerBgs  = [];
    this.answerTxts = [];

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (btnW + gap);
      const y = startY + row * (btnH + gap);

      const bg = this.add
        .rectangle(x, y, btnW, btnH, BTN_DEFAULT)
        .setInteractive({ useHandCursor: true });

      const txt = this.add
        .text(x, y, "", {
          fontSize: "15px", fontFamily: "Arial", color: "#ffffff",
          wordWrap: { width: btnW - 16 }, align: "center",
        })
        .setOrigin(0.5);

      const idx = i;
      bg.on("pointerover",  () => { if (this.canAnswer) bg.setFillStyle(0x2a3a5e); });
      bg.on("pointerout",   () => { if (this.canAnswer) bg.setFillStyle(BTN_DEFAULT); });
      bg.on("pointerup",    () => this.onAnswer(idx));

      this.answerBgs.push(bg);
      this.answerTxts.push(txt);
    }

    // Start on-chain session (fire-and-forget)
    callStartGame(this.sessionId);

    this.showQuestion();
  }

  showQuestion() {
    if (this.questionIndex >= this.questions.length) {
      this.endGame();
      return;
    }

    const q = this.questions[this.questionIndex];

    // Update counter
    this.counterText.setText(`${this.questionIndex + 1}/${QUESTIONS_PER_GAME}`);

    // Reset timer
    this.timeLeft = TIME_PER_QUESTION;
    this.canAnswer = false;

    // Flag image: swap texture
    this.flagImg.setTexture(`flag_${q.code}`).setVisible(true);
    this.flagBg.setVisible(true);
    const scale = Math.min(340 / this.flagImg.width, 210 / this.flagImg.height, 1);
    this.flagImg.setScale(scale);

    // Pop-in animation
    this.flagImg.setScale(0);
    this.tweens.add({
      targets: this.flagImg,
      scaleX: scale, scaleY: scale,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => { this.canAnswer = true; },
    });

    this.feedbackText.setVisible(false);

    // Build answer options
    const wrongPool = shuffle(COUNTRIES.filter((c) => c.code !== q.code));
    const correctSlot = Math.floor(Math.random() * 4);
    const options = [];
    let wi = 0;
    for (let i = 0; i < 4; i++) {
      if (i === correctSlot) options.push(q.name);
      else options.push(wrongPool[wi++].name);
    }

    this.correctSlot = correctSlot;

    for (let i = 0; i < 4; i++) {
      this.answerBgs[i].setFillStyle(BTN_DEFAULT).setInteractive({ useHandCursor: true });
      this.answerTxts[i].setText(options[i]);
    }

    // Start per-frame timer
    if (this.timerEvent) this.timerEvent.destroy();
    this.timerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: this.tickTimer,
      callbackScope: this,
    });
  }

  tickTimer() {
    if (!this.canAnswer) return;
    this.timeLeft -= 0.1;

    const frac = Math.max(0, this.timeLeft / TIME_PER_QUESTION);
    this.timerBar.width = (this.W - 32) * frac;

    const color =
      frac < 0.25 ? 0xe63a3a :
      frac < 0.5  ? 0xf0a030 : BLUE;
    this.timerBar.setFillStyle(color);

    if (this.timeLeft <= 0) {
      this.canAnswer = false;
      this.timerEvent.destroy();
      this.showFeedback("TIME UP!", 0xe63a3a);
      // Show correct answer
      this.answerBgs[this.correctSlot].setFillStyle(BTN_CORRECT);
      // Submit wrong answer on-chain
      callSubmitAnswer(this.sessionId, false);
      this.time.delayedCall(1500, () => {
        this.questionIndex++;
        this.showQuestion();
      });
    }
  }

  onAnswer(index) {
    if (!this.canAnswer) return;
    this.canAnswer = false;
    if (this.timerEvent) this.timerEvent.destroy();

    // Disable all buttons
    this.answerBgs.forEach((b) => b.disableInteractive());

    const isCorrect = index === this.correctSlot;

    if (isCorrect) {
      const timeBonus = Math.floor(this.timeLeft * 10);
      const earned    = 100 + timeBonus;
      this.score     += earned;
      this.correctCount++;
      this.scoreText.setText(`Score: ${this.score}`);
      this.answerBgs[index].setFillStyle(BTN_CORRECT);
      this.showFeedback(`CORRECT! +${earned}`, BTN_CORRECT);
    } else {
      this.answerBgs[index].setFillStyle(BTN_WRONG);
      this.answerBgs[this.correctSlot].setFillStyle(BTN_CORRECT);
      this.showFeedback("WRONG!", BTN_WRONG);
    }

    callSubmitAnswer(this.sessionId, isCorrect);

    this.time.delayedCall(1500, () => {
      this.questionIndex++;
      this.showQuestion();
    });
  }

  showFeedback(msg, color) {
    this.feedbackText.setText(msg).setColor(Phaser.Display.Color.IntegerToColor(color).rgba).setVisible(true);
    this.feedbackText.setScale(0.5);
    this.tweens.add({
      targets: this.feedbackText,
      scaleX: 1, scaleY: 1,
      duration: 200,
      ease: "Back.easeOut",
    });
  }

  endGame() {
    if (this.timerEvent) this.timerEvent.destroy();
    this.scene.start("Results", {
      score:          this.score,
      correctCount:   this.correctCount,
      totalQuestions: QUESTIONS_PER_GAME,
    });
  }
}
