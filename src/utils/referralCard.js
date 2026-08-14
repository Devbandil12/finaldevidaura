// src/utils/referralCard.js
//
// WhatsApp (and SMS, and most share targets) can't render styled text —
// the dark bubble in a WhatsApp screenshot is WhatsApp's own UI, not
// something any app sharing text into it can change. The only way to get
// an actual *designed* look is to share an image instead of text. This
// draws one on an offscreen <canvas> and returns it as a Blob, ready to
// hand to navigator.share({ files: [...] }).

const WIDTH = 1080;
const HEIGHT = 1080; // square — displays cleanly in every share target's preview, not just WhatsApp's

export async function generateReferralCardBlob(code, refereeBonus = 50) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");

  // Background
  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, "#0c1f18");
  bg.addColorStop(1, "#132e22");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Soft decorative glow (an emerald wash in one corner, echoes the site's accent color)
  const glow = ctx.createRadialGradient(WIDTH * 0.85, HEIGHT * 0.15, 0, WIDTH * 0.85, HEIGHT * 0.15, 500);
  glow.addColorStop(0, "rgba(16, 185, 129, 0.35)");
  glow.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Thin border frame
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, WIDTH - 80, HEIGHT - 80);

  // Wordmark
  ctx.fillStyle = "#ffffff";
  ctx.font = "300 40px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.fillText("DEVID AURA", WIDTH / 2, 190);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 20px Arial";
  ctx.letterSpacing = "4px";
  ctx.fillText("YOU'RE INVITED", WIDTH / 2, 240);
  ctx.letterSpacing = "0px";

  // Headline
  ctx.fillStyle = "#ffffff";
  ctx.font = "300 56px Georgia, 'Times New Roman', serif";
  ctx.fillText(`Get ₹${refereeBonus} on your`, WIDTH / 2, 400);
  ctx.fillText("first order", WIDTH / 2, 464);

  // Code pill
  const pillY = 560, pillH = 130, pillW = 620;
  const pillX = (WIDTH - pillW) / 2;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, pillX, pillY, pillW, pillH, 24);
  ctx.fill();
  ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
  ctx.lineWidth = 2;
  roundRect(ctx, pillX, pillY, pillW, pillH, 24);
  ctx.stroke();

  ctx.fillStyle = "#34d399";
  ctx.font = "700 56px 'Courier New', monospace";
  ctx.letterSpacing = "8px";
  ctx.fillText(code, WIDTH / 2, pillY + 82);
  ctx.letterSpacing = "0px";

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "400 26px Arial";
  ctx.fillText("www.devidaura.com", WIDTH / 2, 820);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
