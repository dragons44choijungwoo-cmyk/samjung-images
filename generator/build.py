"""Builds the 삼정 cafe post page from posts/*.json and checks every post against the format rules.

Usage (from this folder): python3 build.py
Writes out/samjung-cafe-post.html. Stops with a list of problems if any post breaks a rule.
"""
import glob
import html
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
KAKAO = "https://open.kakao.com/o/sWb5ALAi"
PHONE = "010-8076-5711"
MIN_CHARS, MAX_CHARS = 1900, 2000
MIN_QUOTES = 7


def plain(h):
    return html.unescape(re.sub(r"<[^>]+>", "", h))


def body_text(post):
    """The text the page counts: every block but images, contact lines included (page.js countChars)."""
    out = []
    for b in post["blocks"]:
        t = b["t"]
        if t in ("p", "quote", "h2"):
            out.append(plain(b["h"]))
        elif t == "ul":
            out.extend(plain(i) for i in b["items"])
        elif t == "kakao":
            out.append("💬 카톡 상담: " + KAKAO)
        elif t == "phone":
            out.append("📞 전화 상담: " + PHONE)
        elif t == "link":
            out.append("👉 상담 바로가기: " + post["link"])
    return "".join(out)


def check(post):
    errs = []
    blocks = post["blocks"]
    text = body_text(post)
    n = len(text)
    quotes = sum(b["t"] == "quote" for b in blocks)
    raw = json.dumps(blocks, ensure_ascii=False)

    if not MIN_CHARS <= n <= MAX_CHARS:
        errs.append(f"글자수 {n}자: {MIN_CHARS}~{MAX_CHARS}자여야 합니다")
    if quotes < MIN_QUOTES:
        errs.append(f"인용구 {quotes}개: {MIN_QUOTES}개 이상이어야 합니다")
    if "<r>" not in raw or "<n>" not in raw:
        errs.append("빨간색(<r>)과 남색(<n>) 포인트가 모두 있어야 합니다")
    if post["keyword"] not in post["title"]:
        errs.append("제목에 키워드가 없습니다")
    if post["region"].split()[-1] not in post["title"]:
        errs.append("제목에 지역(동)이 없습니다")
    if post["link"] != "https://samjung.ai.kr/?ref=" + post["keyword"]:
        errs.append("link는 https://samjung.ai.kr/?ref=<키워드> 여야 합니다")
    for must in ("5만 원", "70%"):
        if must not in text:
            errs.append(f"삼정 영업 문구 '{must}'가 없습니다")
    if [b["t"] for b in blocks[-4:]] != ["img", "kakao", "phone", "link"] or blocks[-4].get("id") != "cta":
        errs.append("마지막은 cta 이미지, kakao, phone, link 순서여야 합니다")
    if blocks[0]["t"] != "img":
        errs.append("첫 블록은 대표 이미지여야 합니다")
    for b in blocks:
        if b["t"] == "img" and b["id"] not in post["images"]:
            errs.append(f"이미지 '{b['id']}' 설정이 images에 없습니다")
    for spec in post["images"].values():
        if not re.search(r"-v\d+\.png$", spec["file"]):
            errs.append(f"{spec['file']}: 파일 이름은 -v<번호>.png 로 끝나야 합니다")
        if not os.path.exists(os.path.join(REPO, post["imgDir"], spec["file"])):
            errs.append(f"{post['imgDir']}{spec['file']} 이미지가 없습니다 (node render.js 먼저 실행)")
    return errs, n, quotes


def main():
    posts = [json.load(open(f, encoding="utf-8")) for f in sorted(glob.glob(os.path.join(HERE, "posts", "*.json")))]
    failed = False
    for p in posts:
        errs, n, quotes = check(p)
        print(f"{p['date']} {p['keyword']}: {n}자, 인용구 {quotes}개" + ("" if errs else " OK"))
        for e in errs:
            print("  - " + e)
        failed |= bool(errs)
    if failed:
        sys.exit("규칙에 맞지 않는 글이 있어 페이지를 만들지 않았습니다.")

    js = open(os.path.join(HERE, "page.js"), encoding="utf-8").read()
    js = js.replace("/*POSTS*/[]", json.dumps(posts, ensure_ascii=False, indent=1))
    page = open(os.path.join(HERE, "shell.html"), encoding="utf-8").read().replace("/*PAGE_JS*/", js)
    os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
    open(os.path.join(HERE, "out", "samjung-cafe-post.html"), "w", encoding="utf-8").write(page)
    files = [p["imgDir"] + s["file"] for p in posts for s in p["images"].values()]
    json.dump(files, open(os.path.join(HERE, "out", "images.json"), "w"), ensure_ascii=False, indent=1)
    print(f"out/samjung-cafe-post.html ({len(posts)}개 글, 이미지 {len(files)}장)")


if __name__ == "__main__":
    main()
