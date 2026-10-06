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
PLACE_NAME = "부산광고 삼정"
MIN_CHARS, MAX_CHARS = 1900, 2000
MIN_QUOTES = 7
# 부산 구/동 names from the keyword sheet (rows 1-9). Posts name the city only.
DISTRICTS = """중앙동 동광동 대청동 보수동 부평동 광복동 남포동 영주동 동대신동 서대신동 부민동 아미동 초장동 충무동 남부민동 암남동
초량동 수정동 좌천동 범일동 남항동 영선동 신선동 봉래동 청학동 동삼동 대연동 용호동 용당동 감만동 우암동 문현동
남천동 수영동 망미동 광안동 민락동 부전동 연지동 초읍동 양정동 전포동 부암동 당감동 가야동 개금동 범천동
수민동 복산동 명륜동 온천동 사직동 안락동 명장동 거제동 연산동 금사동 부곡동 장전동 선두구동 청룡남산동 구서동 금성동
좌동 송정동 반여동 반송동 재송동 구포동 금곡동 화명동 덕천동 만덕동 대저동 강동동 명지동 가락동 녹산동 가덕도동
삼락동 모라동 덕포동 괘법동 감전동 주례동 학장동 엄궁동 괴정동 당리동 하단동 신평동 장림동 다대동 구평동 감천동
부산진구 동래구 해운대구 사하구 금정구 연제구 수영구 사상구 영도구 강서구 기장군 해운대 광안리 서면""".split()


def plain(h):
    return html.unescape(re.sub(r"<[^>]+>", "", h))


def body_text(post):
    """The text the page counts: everything pasted as text (closing contact lines too), no images (page.js countChars)."""
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
        elif t == "place":
            out.append("📍 네이버 플레이스: " + PLACE_NAME)
        elif t == "link":
            out.append("👉 상담 바로가기: " + post["link"])
    return "".join(out)


def check(post):
    errs = []
    blocks = post["blocks"]
    text = body_text(post)
    # Counted without spaces, like the counter choi checks posts with (2026-10-05).
    n = len(re.sub(r"\s", "", text))
    quotes = sum(b["t"] == "quote" for b in blocks)
    raw = json.dumps(blocks, ensure_ascii=False)

    if not MIN_CHARS <= n <= MAX_CHARS:
        errs.append(f"글자수(공백 제외) {n}자: {MIN_CHARS}~{MAX_CHARS}자여야 합니다")
    if quotes < MIN_QUOTES:
        errs.append(f"인용구 {quotes}개: {MIN_QUOTES}개 이상이어야 합니다")
    if "<r>" not in raw or "<n>" not in raw:
        errs.append("빨간색(<r>)과 남색(<n>) 포인트가 모두 있어야 합니다")
    if post["keyword"] not in post["title"]:
        errs.append("제목에 키워드가 없습니다")
    if "부산" not in post["title"]:
        errs.append("제목에 '부산'이 없습니다")
    # choi: region is city level only, so no 구/동 names anywhere in the post.
    raw_all = json.dumps(post, ensure_ascii=False)
    for name in DISTRICTS:
        if name in raw_all:
            errs.append(f"구·동 이름 '{name}'이 들어 있습니다 (지역은 '부산'까지만)")
    if post["link"] != "https://samjung.ai.kr/?ref=" + post["keyword"]:
        errs.append("link는 https://samjung.ai.kr/?ref=<키워드> 여야 합니다")
    for must in ("5만 원", "70%"):
        if must not in text:
            errs.append(f"삼정 영업 문구 '{must}'가 없습니다")
    if [b["t"] for b in blocks[-5:]] != ["img", "kakao", "phone", "place", "link"] or blocks[-5].get("id") != "cta":
        errs.append("마지막은 cta 이미지, kakao, phone, place, link 순서여야 합니다")
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
    seen = {}
    for p in posts:
        if p["keyword"] in seen:
            print(f"키워드 '{p['keyword']}'가 {seen[p['keyword']]}와 겹칩니다: 글마다 새 키워드를 써야 합니다")
            failed = True
        seen[p["keyword"]] = p["date"]
    for p in posts:
        errs, n, quotes = check(p)
        print(f"{p['date']} {p['keyword']}: 공백 제외 {n}자, 인용구 {quotes}개" + ("" if errs else " OK"))
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
