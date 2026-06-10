#!/usr/bin/env python3
"""
Browser-based card image downloader (beats Cloudflare).
Drives a real Chrome browser via Playwright, so image requests pass
TCDB's JavaScript browser check.

Setup (one time):
    pip3 install playwright
    python3 -m playwright install chromium

Usage:
    python3 browser_download.py --catalog ./1989-upper-deck-catalog.json --output ./cards/1989-upper-deck
    python3 browser_download.py --catalog ./1989-upper-deck-catalog.json --output ./cards/1989-upper-deck --resume
    python3 browser_download.py --catalog ./1989-upper-deck-catalog.json --output ./cards/1989-upper-deck --limit 5
"""

import argparse
import json
import re
import sys
import time
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Playwright is not installed. Run these two commands first:")
    print("  pip3 install playwright")
    print("  python3 -m playwright install chromium")
    sys.exit(1)

IMAGE_MAGIC = (b"\xff\xd8", b"\x89PN", b"GIF8", b"RIFF")
IMAGE_DELAY = 0.4  # seconds between downloads


def is_image(data):
    return data and len(data) > 500 and data[:2] in [m[:2] for m in IMAGE_MAGIC]


def main():
    ap = argparse.ArgumentParser(description="Browser-based TCDB image downloader")
    ap.add_argument("--catalog", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--resume", action="store_true")
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--front-only", action="store_true")
    ap.add_argument("--back-only", action="store_true")
    ap.add_argument("--show-browser", action="store_true",
                    help="Show the browser window (useful if downloads fail invisibly)")
    args = ap.parse_args()

    sides = ["front", "back"]
    if args.front_only:
        sides = ["front"]
    if args.back_only:
        sides = ["back"]

    cat = json.loads(Path(args.catalog).read_text())
    cards = cat["cards"]
    if args.limit:
        cards = cards[: args.limit]

    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    manifest_path = out / "manifest.json"
    manifest = {}
    if args.resume and manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())
        print("Resuming - {} cards in manifest".format(len(manifest)))

    print("Downloading {} cards -> {}".format(len(cards), out.resolve()))
    print("Sides: {}".format(", ".join(sides)))
    print("Opening browser...")

    stats = {"ok": 0, "missing": 0, "cached": 0}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not args.show_browser)
        context = browser.new_context(
            user_agent=("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36"),
            viewport={"width": 1280, "height": 800},
        )
        page = context.new_page()

        # Warm up: load the homepage and wait for any Cloudflare check to clear
        print("Passing browser check (may take ~10s)...")
        page.goto("https://www.tcdb.com/", timeout=60000, wait_until="domcontentloaded")
        for _ in range(30):
            if "just a moment" not in (page.title() or "").lower():
                break
            time.sleep(1)
        if "just a moment" in (page.title() or "").lower():
            print("")
            print("Cloudflare did not clear automatically.")
            print("Re-run with --show-browser and complete the check in the window:")
            print("  python3 browser_download.py --catalog {} --output {} --show-browser".format(
                args.catalog, args.output))
            browser.close()
            sys.exit(1)
        print("Browser check passed. Starting downloads...")
        print("")

        done = 0
        total = len(cards)
        for card in cards:
            cid = str(card["card_id"])
            card_num = card.get("card_num", "") or ""
            player = re.sub(r"[^\w\s-]", "", card.get("name", ""))[:50].strip().replace(" ", "_")
            num_prefix = card_num.zfill(4) + "_" if card_num else "{:08d}_".format(card["card_id"])

            if args.resume and cid in manifest:
                if all(manifest[cid].get(s) in ("ok", "cached") for s in sides):
                    stats["cached"] += len(sides)
                    done += 1
                    continue

            result = {}
            for side in sides:
                url = card.get(side + "_url")
                dest = out / (num_prefix + player + "_" + side + ".jpg")

                if dest.exists() and dest.stat().st_size > 500:
                    result[side] = "cached"
                    stats["cached"] += 1
                    continue
                if not url:
                    result[side] = "missing"
                    stats["missing"] += 1
                    continue

                ok = False
                # Try the Large URL, then the thumbnail fallback
                candidates = [url]
                thumb = card.get(side + "_url_thumb")
                if thumb and thumb != url:
                    candidates.append(thumb)

                for u in candidates:
                    try:
                        resp = page.request.get(u, headers={"Referer": card.get("page_url", "https://www.tcdb.com/")})
                        body = resp.body()
                        if resp.status == 200 and is_image(body):
                            dest.write_bytes(body)
                            ok = True
                            break
                    except Exception:
                        pass
                    time.sleep(0.2)

                result[side] = "ok" if ok else "missing"
                stats["ok" if ok else "missing"] += 1
                time.sleep(IMAGE_DELAY)

            manifest[cid] = result
            done += 1
            if done % 10 == 0 or done == total:
                print("  {}/{} cards  ({} images saved, {} missing)".format(
                    done, total, stats["ok"], stats["missing"]))
                manifest_path.write_text(json.dumps(manifest, indent=2))

        browser.close()

    manifest_path.write_text(json.dumps(manifest, indent=2))
    print("")
    print("=" * 50)
    print("Done!")
    print("  Images saved:   {}".format(stats["ok"]))
    print("  Already had:    {}".format(stats["cached"]))
    print("  Missing/failed: {}".format(stats["missing"]))
    print("  Output: {}".format(out.resolve()))


if __name__ == "__main__":
    main()
