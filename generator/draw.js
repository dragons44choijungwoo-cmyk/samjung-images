// Canvas drawing for 삼정 post images (1080 x 1080). Runs in a browser page; used by render.js.
// Assets (logo, model photos) arrive as loaded <img> elements in ASSETS.
const C = { bg: "#16233f", bg2: "#1e2f54", y: "#ffc93c", w: "#ffffff", m: "#aeb8cc", line: "#33466f" };
const FONT = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const S = 1080;
const KAKAO_SHORT = "open.kakao.com/o/sWb5ALAi";
const PHONE = "010-8076-5711";
const ASSETS = {};

function f(weight, px) { return `${weight} ${px}px ${FONT}`; }
function wrap(ctx, text, maxW) {
  const words = text.split(" "); const lines = []; let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width <= maxW) { cur = test; continue; }
    if (cur) lines.push(cur);
    if (ctx.measureText(w).width <= maxW) { cur = w; continue; }
    let piece = "";
    for (const ch of w) { if (ctx.measureText(piece + ch).width > maxW) { lines.push(piece); piece = ch; } else piece += ch; }
    cur = piece;
  }
  if (cur) lines.push(cur);
  return lines;
}
function base(ctx) { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, S, S); ctx.textBaseline = "alphabetic"; }
function bubble(ctx, x, y, w, h, color) {
  ctx.fillStyle = color; ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + w * 0.22, y + h * 0.78); ctx.lineTo(x + w * 0.12, y + h * 1.12); ctx.lineTo(x + w * 0.45, y + h * 0.9); ctx.fill();
}
function phoneIcon(ctx, x, y, s, color) {
  // simple handset: rounded bar with two ear/mouth blobs
  ctx.save(); ctx.translate(x + s / 2, y + s / 2); ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = color; ctx.beginPath();
  ctx.roundRect(-s * 0.5, -s * 0.13, s, s * 0.26, s * 0.13); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-s * 0.5, -s * 0.13, s * 0.26, s * 0.42, s * 0.1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(s * 0.24, -s * 0.13, s * 0.26, s * 0.42, s * 0.1); ctx.fill();
  ctx.restore();
}
function footer(ctx) {
  ctx.fillStyle = C.line; ctx.fillRect(80, S - 120, S - 160, 2);
  bubble(ctx, 80, S - 96, 46, 36, C.y);
  ctx.textAlign = "left";
  ctx.fillStyle = C.y; ctx.font = f(700, 30); ctx.fillText("카톡", 140, S - 66);
  const lw = ctx.measureText("카톡").width;
  ctx.fillStyle = C.w; ctx.font = f(500, 30); ctx.fillText(KAKAO_SHORT, 140 + lw + 12, S - 66);
  ctx.font = f(700, 30);
  const pw = ctx.measureText(PHONE).width;
  ctx.fillStyle = C.w; ctx.textAlign = "right"; ctx.fillText(PHONE, S - 80, S - 66); ctx.textAlign = "left";
  phoneIcon(ctx, S - 80 - pw - 46, S - 98, 36, C.y);
}
function logo(ctx, x, y, h) {
  const im = ASSETS.logo; if (!im) return;
  const w = h * im.naturalWidth / im.naturalHeight;
  ctx.drawImage(im, x, y, w, h);
  return w;
}
function logoTopRight(ctx) {
  const im = ASSETS.logo; if (!im) return;
  const h = 44, w = h * im.naturalWidth / im.naturalHeight;
  ctx.drawImage(im, S - 80 - w, 48, w, h);
}
// Draw img into box (x,y,w,h) like CSS object-fit: cover, keeping focus point (fx, fy in 0..1) in view.
function cover(ctx, im, x, y, w, h, fx, fy, zoom) {
  const iw = im.naturalWidth, ih = im.naturalHeight;
  const sc = Math.max(w / iw, h / ih) * (zoom || 1);
  const sw = w / sc, sh = h / sc;
  let sx = iw * fx - sw / 2, sy = ih * fy - sh / 2;
  sx = Math.max(0, Math.min(iw - sw, sx)); sy = Math.max(0, Math.min(ih - sh, sy));
  ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
}
function fadeLeft(ctx, x0, x1, y0, y1) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, "rgba(22,35,63,1)"); g.addColorStop(1, "rgba(22,35,63,0)");
  ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
}
function fadeBottom(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, "rgba(22,35,63,0)"); g.addColorStop(1, "rgba(22,35,63,1)");
  ctx.fillStyle = g; ctx.fillRect(0, y0, S, y1 - y0);
}
function heading(ctx, text, y) {
  ctx.fillStyle = C.y; ctx.fillRect(80, y - 58, 12, 70);
  ctx.fillStyle = C.w; ctx.font = f(900, 58); ctx.fillText(text, 116, y);
}
function shadowText(ctx, text, x, y) {
  ctx.save(); ctx.shadowColor = "rgba(10,18,36,0.75)"; ctx.shadowBlur = 18; ctx.fillText(text, x, y); ctx.restore();
}

const DRAW = {
  cover(ctx, d) {
    base(ctx);
    const ph = ASSETS[d.photo];
    if (ph) { cover(ctx, ph, 500, 0, S - 500, S - 122, d.fx, d.fy, d.zoom); fadeLeft(ctx, 500, 760, 0, S - 122); fadeBottom(ctx, S - 300, S - 122); }
    logo(ctx, 80, 80, 58);
    ctx.fillStyle = C.y; ctx.font = f(700, 38); shadowText(ctx, d.label, 80, 260);
    ctx.fillStyle = C.w; ctx.font = f(900, 92); shadowText(ctx, d.big, 80, 380);
    ctx.font = f(900, 62);
    ctx.fillStyle = C.y; shadowText(ctx, d.hl, 80, 480);
    ctx.fillStyle = C.w; shadowText(ctx, d.rest, 80, 560);
    ctx.fillStyle = C.m; ctx.font = f(500, 32);
    wrap(ctx, d.sub, 470).forEach((ln, k) => shadowText(ctx, ln, 80, 650 + k * 46));
    footer(ctx);
  },
  rows(ctx, d) {
    base(ctx); logoTopRight(ctx); heading(ctx, d.title, 170);
    const h = d.rows.length > 3 ? 175 : 215;
    let y = 250;
    d.rows.forEach((r, i) => {
      ctx.fillStyle = i % 2 ? C.bg : C.bg2; ctx.fillRect(80, y, S - 160, h - 14);
      const mid = y + (h - 14) / 2;
      ctx.fillStyle = C.y; ctx.font = f(900, 46); ctx.fillText(r[0], 116, mid - 12);
      ctx.fillStyle = C.w; ctx.font = f(700, 36); ctx.fillText(r[1], 116, mid + 42);
      ctx.fillStyle = C.m; ctx.font = f(500, 28); ctx.textAlign = "right";
      ctx.fillText(d.tag, S - 116, mid - 18);
      ctx.fillStyle = C.w; ctx.font = f(500, 30);
      wrap(ctx, r[2], 480).forEach((ln, k) => ctx.fillText(ln, S - 116, mid + 24 + k * 38));
      ctx.textAlign = "left";
      y += h;
    });
    footer(ctx);
  },
  steps(ctx, d) {
    base(ctx); logoTopRight(ctx); heading(ctx, d.title, 170);
    let y = 270;
    d.steps.forEach((s, i) => {
      ctx.fillStyle = C.y; ctx.font = f(900, 150); ctx.fillText(String(i + 1), 80, y + 130);
      ctx.fillStyle = C.w; ctx.font = f(900, 50); ctx.fillText(s[0], 220, y + 54);
      ctx.fillStyle = C.m; ctx.font = f(500, 32);
      wrap(ctx, s[1], S - 300).forEach((ln, k) => ctx.fillText(ln, 220, y + 108 + k * 44));
      if (i < d.steps.length - 1) { ctx.fillStyle = C.line; ctx.fillRect(220, y + 196, S - 300, 2); }
      y += 230;
    });
    footer(ctx);
  },
  check(ctx, d) {
    base(ctx); logoTopRight(ctx); heading(ctx, d.title, 170);
    let y = 280;
    d.items.forEach(t => {
      ctx.strokeStyle = C.y; ctx.lineWidth = 6; ctx.strokeRect(86, y, 64, 64);
      ctx.beginPath(); ctx.moveTo(100, y + 34); ctx.lineTo(114, y + 50); ctx.lineTo(138, y + 16); ctx.stroke();
      ctx.fillStyle = C.w; ctx.font = f(700, 40);
      const lines = wrap(ctx, t, S - 300);
      lines.forEach((ln, k) => ctx.fillText(ln, 186, y + 46 + k * 54));
      y += Math.max(1, lines.length) * 54 + 96;
    });
    footer(ctx);
  },
  cta(ctx, d) {
    base(ctx);
    const ph = ASSETS[d.photo];
    if (ph) { cover(ctx, ph, 560, 0, S - 560, S - 122, d.fx, d.fy, d.zoom); fadeLeft(ctx, 560, 720, 0, S - 122); fadeBottom(ctx, S - 260, S - 122); }
    logo(ctx, 80, 80, 58);
    ctx.fillStyle = C.w; ctx.font = f(900, 78); shadowText(ctx, d.line1, 80, 300);
    ctx.fillStyle = C.y; shadowText(ctx, d.line2, 80, 395);
    ctx.fillStyle = C.m; ctx.font = f(500, 30);
    wrap(ctx, d.sub, 470).forEach((ln, k) => shadowText(ctx, ln, 80, 470 + k * 44));
    // kakao button
    const bx = 80, bw = 540, by = 600, bh = 104, r = 52;
    ctx.fillStyle = C.y; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, r); ctx.fill();
    bubble(ctx, bx + 40, by + 32, 48, 38, C.bg);
    ctx.fillStyle = C.bg; ctx.font = f(900, 40); ctx.fillText(d.btn + " →", bx + 106, by + 66);
    // phone line
    phoneIcon(ctx, 86, 760, 44, C.y);
    ctx.fillStyle = C.m; ctx.font = f(500, 28); ctx.fillText("전화 상담", 146, 776);
    ctx.fillStyle = C.w; ctx.font = f(900, 46); shadowText(ctx, PHONE, 146, 828);
    footer(ctx);
  }
};

async function renderAll(posts, assetUrls) {
  await Promise.all(Object.entries(assetUrls).map(([k, url]) => new Promise((res, rej) => {
    const im = new Image(); im.onload = () => { ASSETS[k] = im; res(); }; im.onerror = rej; im.src = url;
  })));
  await Promise.all([900, 700, 500].map(w => document.fonts.load(f(w, 40), "가나바이럴")));
  const out = {};
  for (const post of posts) {
    for (const spec of Object.values(post.images)) {
      const cv = document.createElement("canvas"); cv.width = S; cv.height = S;
      DRAW[spec.kind](cv.getContext("2d"), spec.data);
      out[post.imgDir + spec.file] = cv.toDataURL("image/png");
    }
  }
  return out;
}
