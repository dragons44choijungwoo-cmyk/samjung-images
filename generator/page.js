// Images are rendered ahead of time (render.js + draw.js). The page shows its own published copies;
// the copied HTML points at the public GitHub copies so Naver can fetch them (it drops data: images).
const RAW = "https://raw.githubusercontent.com/dragons44choijungwoo-cmyk/samjung-images/main/";
// KakaoTalk open chat and phone given by choi; every image links to the chat.
const KAKAO = "https://open.kakao.com/o/sWb5ALAi";
const PHONE = "010-8076-5711";
// Point colors for pasted text (inline, since the editor keeps no stylesheet).
const PASTE_COLOR = { r: "#d92b2b", n: "#1b3a8a" };

const POSTS = /*POSTS*/[];

let cur = POSTS[POSTS.length - 1];
function imgNo(post, id) { return post.blocks.filter(b => b.t === "img").findIndex(b => b.id === id) + 1; }
// <r>..</r> = red point, <n>..</n> = navy point
function paint(h, forCopy) {
  return h.replace(/<(r|n)>/g, (_, c) => forCopy ? `<b><span style="color:${PASTE_COLOR[c]}">` : `<b class="c-${c}">`)
          .replace(/<\/(r|n)>/g, forCopy ? "</span></b>" : "</b>");
}
function blockHTML(post, b, forCopy) {
  switch (b.t) {
    case "p": return `<p>${paint(b.h, forCopy)}</p>`;
    case "quote": return `<blockquote><p><strong>${paint(b.h, forCopy)}</strong></p></blockquote>`;
    case "h2": return forCopy ? `<p><br></p><h2>${b.h}</h2>` : `<h2>${b.h}</h2>`;
    case "ul": return `<ul>${b.items.map(i => `<li>${paint(i, forCopy)}</li>`).join("")}</ul>`;
    case "kakao": return `<p>💬 카톡 상담: <a href="${KAKAO}">${KAKAO}</a></p>`;
    case "phone": return `<p>📞 전화 상담: <b>${PHONE}</b></p>`;
    case "link": return `<p>👉 상담 바로가기: <a href="${encodeURI(post.link)}">${post.link}</a></p>`;
    case "img": {
      const file = post.imgDir + post.images[b.id].file;
      if (forCopy) return `<p><a href="${KAKAO}"><img src="${RAW + file}" alt="${b.alt}" width="1080" height="1080"></a></p>`;
      return `<figure><a href="${KAKAO}" target="_blank" rel="noopener"><img src="${file}" alt="${b.alt}" width="1080" height="1080" loading="lazy"></a><figcaption><b>사진 ${imgNo(post, b.id)}</b> · ${b.alt} · 누르면 카톡 상담으로 연결</figcaption></figure>`;
    }
  }
  return "";
}
function copyHTML(post) { return post.blocks.map(b => blockHTML(post, b, true)).join(""); }
function copyText(post) {
  const tmp = document.createElement("div"); tmp.innerHTML = copyHTML(post).replace(/<br>/g, "\n");
  return Array.from(tmp.children).map(el => el.tagName === "UL"
    ? Array.from(el.children).map(li => "- " + li.textContent).join("\n")
    : el.textContent).filter(s => s.trim()).join("\n\n");
}
function countChars(post) {
  const tmp = document.createElement("div");
  // Only the written body counts: no images (or the text on them) and no closing contact lines.
  tmp.innerHTML = post.blocks.filter(b => ["p", "quote", "h2", "ul"].includes(b.t)).map(b => blockHTML(post, b, true)).join("");
  // Count as people do (an emoji is one character), the same way build.py checks the length rule.
  const t = tmp.textContent;
  return { withSp: Array.from(t.replace(/\n/g, "")).length, noSp: Array.from(t.replace(/\s/g, "")).length };
}
function render() {
  const p = cur, c = countChars(p);
  document.getElementById("count").textContent = `글자수 ${c.withSp.toLocaleString()}자 (공백 제외 ${c.noSp.toLocaleString()}자)`;
  document.getElementById("mKeyword").textContent = `키워드 ${p.keyword}`;
  document.getElementById("mVolume").textContent = `월 검색량 ${p.volume}`;
  document.getElementById("mRegion").textContent = `지역 ${p.region}`;
  document.getElementById("title").textContent = p.title;
  document.getElementById("tags").textContent = p.tags.join(" ");
  document.getElementById("article").innerHTML = p.blocks.map(b => blockHTML(p, b, false)).join("");
}

/* ---------- clipboard ---------- */
let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast"); t.textContent = msg;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.textContent = ""; }, 6000);
}
function selectionCopy(html) {
  const box = document.getElementById("copybox"); box.innerHTML = html;
  const range = document.createRange(); range.selectNodeContents(box);
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  let ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  sel.removeAllRanges(); box.innerHTML = "";
  return ok;
}
async function copyRich(html, text, okMsg) {
  try {
    await navigator.clipboard.write([new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([text], { type: "text/plain" })
    })]);
    toast(okMsg); return;
  } catch (e) { /* fall through */ }
  if (selectionCopy(html)) toast(okMsg);
  else toast("이 화면에서는 자동 복사가 막혀 있어요. 본문을 드래그해서 복사해 주세요.");
}
async function copyPlain(text, okMsg) {
  try { await navigator.clipboard.writeText(text); toast(okMsg); return; } catch (e) { /* fall through */ }
  if (selectionCopy(text.replace(/&/g, "&amp;").replace(/</g, "&lt;"))) toast(okMsg);
  else toast("자동 복사가 막혀 있어요. 직접 드래그해서 복사해 주세요.");
}

document.getElementById("copyAll").addEventListener("click", () => {
  const n = Object.keys(cur.images).length;
  copyRich(copyHTML(cur), copyText(cur), `본문, 인용구, 사진 ${n}장을 복사했어요. 카페 글쓰기 본문 칸에 붙여넣으세요.`);
});
document.getElementById("copyTitle").addEventListener("click", () => copyPlain(cur.title, "제목을 복사했어요."));
document.getElementById("copyTags").addEventListener("click", () => copyPlain(cur.tags.join(" "), "해시태그를 복사했어요."));

const sel = document.getElementById("postSel");
sel.innerHTML = POSTS.map(p => `<option value="${p.id}">${p.date.slice(5).replace("-", "/")} · ${p.keyword}</option>`).join("");
sel.value = cur.id;
sel.addEventListener("change", () => {
  cur = POSTS.find(p => p.id === sel.value);
  render(); window.scrollTo(0, 0);
});

render();
