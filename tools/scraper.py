#!/usr/bin/env python3
"""
Sports Card Image Scraper — TCDB (Trading Card Database)
=========================================================
Two-mode tool:
  1. 'catalog' — Build a JSON catalog of all card image URLs for a set
  2. 'download' — Download images from a catalog (run locally or with a proxy)
  3. 'search' — Find set IDs by name

Usage:
    # Step 1: Search for a set
    python scraper.py search "1989 Upper Deck baseball"

    # Step 2: Build a catalog of all card image URLs
    python scraper.py catalog --set-id 136 --output ./1989-upper-deck.json

    # Step 3: Download the images
    python scraper.py download --catalog ./1989-upper-deck.json --output ./cards/1989-upper-deck
    python scraper.py download --catalog ./1989-upper-deck.json --output ./cards/1989-upper-deck --resume
    python scraper.py download --catalog ./1989-upper-deck.json --output ./cards/1989-upper-deck --limit 10

    # All-in-one (catalog + download):
    python scraper.py scrape --set-id 136 --output ./cards/1989-upper-deck
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from tqdm import tqdm
from typing import Optional, List, Tuple

# ── Constants ─────────────────────────────────────────────────────────────────

BASE_URL = "https://www.tcdb.com"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

PAGE_DELAY = 1.2   # seconds between set-page requests
IMAGE_DELAY = 0.5  # seconds between image downloads


# ── Session ───────────────────────────────────────────────────────────────────

def make_session() -> requests.Session:
    sess = requests.Session()
    sess.headers.update(HEADERS)
    # Suppress the LibreSSL/OpenSSL warning on older Macs
    import warnings
    warnings.filterwarnings("ignore")
    try:
        r = sess.get(BASE_URL, timeout=15, verify=False)
        # Walk through any CF soft challenge redirect
        if "Just a moment" in r.text:
            time.sleep(3)
            sess.get(BASE_URL, timeout=15, verify=False)
    except Exception:
        pass
    return sess


# ── Search ────────────────────────────────────────────────────────────────────

def search_sets(query: str, session: requests.Session) -> List[dict]:
    """Search TCDB for sets matching query. Returns [{name, set_id, url}]."""
    results = []
    seen = set()

    for endpoint in ["/Search.cfm", "/SearchSets.cfm"]:
        url = BASE_URL + endpoint
        try:
            resp = session.get(url, params={"q": query, "type": "set"}, timeout=30, verify=False)
        except requests.RequestException as e:
            print("  Connection error: {}".format(e))
            continue

        if "Just a moment" in resp.text or "Enable JavaScript" in resp.text:
            print("  Note: TCDB returned a browser-check page. Retrying in 3s...")
            time.sleep(3)
            try:
                resp = session.get(url, params={"q": query, "type": "set"}, timeout=30, verify=False)
            except requests.RequestException:
                continue

        soup = BeautifulSoup(resp.text, "html.parser")
        for a in soup.select('a[href*="ViewSet.cfm/sid/"], a[href*="Gallery.cfm/sid/"]'):
            href = a["href"]
            m = re.search(r"/sid/(\d+)", href)
            if not m:
                continue
            sid = int(m.group(1))
            if sid in seen:
                continue
            seen.add(sid)
            name = a.get_text(strip=True) or a.get("title", "")
            if name:
                results.append({
                    "name": name,
                    "set_id": sid,
                    "url": urljoin(BASE_URL, href),
                })

        if results:
            break

        # Small pause before trying the second endpoint
        time.sleep(1)

    return results


# ── Card list + image URL extraction ─────────────────────────────────────────

def _parse_slug(slug: str, set_id: int) -> Tuple[str, str]:
    """
    Parse a TCDB URL slug like '1989-Upper-Deck-1-Ken-Griffey-Jr.' into
    (card_num, player_name). Returns ('', slug) if parsing fails.
    """
    parts = slug.rstrip("/").split("-")
    # Drop leading year (4-digit) and brand tokens until we hit the card number
    card_num = ""
    name_parts = []
    after_year = False

    for part in parts:
        clean = part.rstrip(".")
        if not after_year:
            if re.match(r"^\d{4}$", clean):
                after_year = True
            continue
        if not card_num and re.match(r"^\d+[a-zA-Z]?$", clean):
            card_num = clean
            continue
        if card_num:
            name_parts.append(clean)

    player = " ".join(name_parts) if name_parts else slug
    return card_num, player


def get_cards_from_set(set_id: int, session: requests.Session) -> Tuple[List[dict], str]:
    """
    Paginate through all set pages on TCDB and extract card metadata + image URLs.

    For each card, visits the card detail page to extract the exact front/back
    image URLs from the HTML (since direct CDN image requests are CF-protected).

    Returns (cards, sport) where cards is a list of:
      {card_id, card_num, name, set_id, front_url, back_url, page_url}
    """
    print(f"Fetching card list for set ID {set_id}...")
    sport = "Baseball"
    cards = []
    seen = set()
    page = 1

    # Step 1: Get the set's URL slug (required for the Checklist page)
    set_slug = ""
    try:
        resp = session.get(f"{BASE_URL}/ViewSet.cfm/sid/{set_id}", timeout=20, verify=False)
        m = re.search(rf'href="/Checklist\.cfm/sid/{set_id}/([^"?]+)"', resp.text)
        if m:
            set_slug = m.group(1)
            print(f"  Set: {set_slug.replace('-', ' ')}")
    except requests.RequestException as e:
        print(f"  ⚠ Could not load set page: {e}")
        return [], sport

    if not set_slug:
        print("  ⚠ Could not find checklist link on set page.")
        return [], sport

    # Step 2: Paginate through the full checklist
    while True:
        url = f"{BASE_URL}/Checklist.cfm/sid/{set_id}/{set_slug}"
        try:
            resp = session.get(url, params={"PageIndex": page}, timeout=20, verify=False)
        except requests.RequestException as e:
            print(f"  ⚠ Page {page} fetch failed: {e}")
            break

        soup = BeautifulSoup(resp.text, "html.parser")

        # Detect sport from image paths (first page only)
        if page == 1:
            og = soup.find("meta", property="og:image")
            if og and og.get("content"):
                m = re.search(r"/Images/(?:Cards|Large)/(\w+)/", og["content"])
                if m:
                    sport = m.group(1)

        # Find all card links
        page_cards = []
        selector = f'a[href*="ViewCard.cfm/sid/{set_id}/cid/"]'
        for a in soup.select(selector):
            href = a["href"]
            m = re.search(r"/cid/(\d+)/([^\"'\s?#]+)", href)
            if not m:
                continue
            cid = int(m.group(1))
            if cid in seen:
                continue
            seen.add(cid)

            slug = m.group(2)
            card_num, player = _parse_slug(slug, set_id)
            display = f"#{card_num} {player}" if card_num else player

            page_cards.append({
                "card_id": cid,
                "set_id": set_id,
                "card_num": card_num,
                "name": display,
                "page_url": urljoin(BASE_URL, href.split("?")[0]),
                "front_url": None,
                "back_url": None,
                "sport": sport,
            })

        if not page_cards:
            break

        cards.extend(page_cards)
        print(f"  Page {page}: {len(page_cards)} cards (total: {len(cards)})")

        # Check if a link to the next page index exists
        next_idx = page + 1
        has_next = soup.find("a", href=re.compile(rf"PageIndex={next_idx}(\D|$)"))
        if not has_next:
            break
        page += 1
        time.sleep(PAGE_DELAY)

    return cards, sport


def resolve_image_urls(card: dict, session: requests.Session) -> dict:
    """
    Visit a card's detail page and extract front/back image URLs from the HTML.
    This works because HTML pages load fine; only direct image CDN requests are blocked.
    """
    try:
        resp = session.get(
            card["page_url"],
            headers={"Referer": "{}/ViewSet.cfm/sid/{}".format(BASE_URL, card['set_id'])},
            timeout=20,
            verify=False,
        )
    except requests.RequestException:
        return card

    soup = BeautifulSoup(resp.text, "html.parser")

    # Look for front/back image tags by alt text
    for img in soup.find_all("img", src=True):
        src = img.get("src", "")
        alt = img.get("alt", "").lower()
        if not src or "Cards" not in src:
            continue
        full_url = urljoin(BASE_URL, src)
        # Use Large/ variant for best quality
        large_url = full_url.replace("/Images/Cards/", "/Images/Large/")

        if "front" in alt:
            card["front_url"] = large_url
            card["front_url_thumb"] = full_url
        elif "back" in alt:
            card["back_url"] = large_url
            card["back_url_thumb"] = full_url

    # Fallback: og:image for front
    if not card.get("front_url"):
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            card["front_url"] = og["content"]

    return card


# ── Catalog builder ───────────────────────────────────────────────────────────

def build_catalog(
    set_id: int,
    output_path: str,
    limit: Optional[int] = None,
) -> dict:
    """
    Build a JSON catalog with all card image URLs for a set.
    This is fast and doesn't download images — it just collects URLs.
    """
    session = make_session()
    cards, sport = get_cards_from_set(set_id, session)

    if not cards:
        print("❌ No cards found. Try searching first with: python scraper.py search <name>")
        return {}

    if limit:
        cards = cards[:limit]

    print(f"\n📋 Resolving image URLs for {len(cards)} cards (visiting each card page)...")
    print(f"   Sport: {sport}")

    resolved = []
    with tqdm(total=len(cards), unit="card", desc="Resolving") as pbar:
        for card in cards:
            card = resolve_image_urls(card, session)
            resolved.append(card)
            pbar.update(1)
            time.sleep(PAGE_DELAY)

    catalog = {
        "set_id": set_id,
        "sport": sport,
        "total_cards": len(resolved),
        "cards": resolved,
    }

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(catalog, indent=2))

    found_front = sum(1 for c in resolved if c.get("front_url"))
    found_back = sum(1 for c in resolved if c.get("back_url"))
    print(f"\n✅ Catalog saved to: {out.resolve()}")
    print(f"   {len(resolved)} cards — {found_front} fronts, {found_back} backs resolved")
    print(f"\nTo download images:")
    print(f"   python scraper.py download --catalog {out} --output ./cards/set-{set_id}")

    return catalog


# ── Image downloader ──────────────────────────────────────────────────────────

def download_images(
    catalog_path: str,
    output_dir: str,
    sides: List[str] = ("front", "back"),
    limit: Optional[int] = None,
    resume: bool = False,
) -> dict:
    """
    Download images from a catalog JSON file.
    Works best when run on a local machine (no datacenter IP restrictions).
    """
    cat = json.loads(Path(catalog_path).read_text())
    cards = cat["cards"]

    if limit:
        cards = cards[:limit]

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    manifest_path = out / "manifest.json"
    manifest = {}
    if resume and manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())
        print(f"Resuming — {len(manifest)} cards in manifest")

    session = make_session()

    print(f"\n📦 Downloading {len(cards)} cards")
    print(f"📁 Output: {out.resolve()}")
    print(f"🖼  Sides: {', '.join(sides)}\n")

    stats = {s: {"ok": 0, "missing": 0, "cached": 0} for s in sides}
    stats["total"] = len(cards)

    def _download_one(url: str, dest: Path) -> bool:
        if not url:
            return False
        try:
            resp = session.get(url, timeout=20, stream=True, verify=False,
                               headers={"Accept": "image/avif,image/webp,image/*,*/*;q=0.8",
                                        "Sec-Fetch-Dest": "image",
                                        "Sec-Fetch-Mode": "no-cors",
                                        "Sec-Fetch-Site": "same-origin",
                                        "Referer": BASE_URL + "/"})
            if resp.status_code == 200 and len(resp.content) > 500:
                # Validate it's actually an image (not HTML error page)
                if not resp.content[:4] in (b'\xff\xd8\xff\xe0', b'\xff\xd8\xff\xe1',  # JPEG
                                            b'\x89PNG', b'GIF8', b'RIFF', b'WEBP'):
                    # Check if it starts with HTML
                    if resp.content[:15].lower().startswith(b'<!doctype') or \
                       resp.content[:5] == b'<html':
                        return False
                dest.write_bytes(resp.content)
                return True
        except requests.RequestException:
            pass
        return False

    with tqdm(total=len(cards), unit="card", desc="Downloading") as pbar:
        for card in cards:
            cid = str(card["card_id"])
            card_num = card.get("card_num", "")
            player = re.sub(r'[^\w\s-]', '', card.get("name", ""))[:50].strip().replace(" ", "_")
            num_prefix = f"{card_num.zfill(4)}_" if card_num else f"{card['card_id']:08d}_"

            if resume and cid in manifest:
                if all(manifest[cid].get(s) in ("ok", "cached") for s in sides):
                    for s in sides:
                        stats[s]["cached"] += 1
                    pbar.update(1)
                    continue

            result = {}
            for side in sides:
                url = card.get(f"{side}_url")
                fname = f"{num_prefix}{player}_{side}.jpg"
                dest = out / fname

                if dest.exists() and dest.stat().st_size > 500 and resume:
                    result[side] = "cached"
                    stats[side]["cached"] += 1
                    continue

                success = _download_one(url, dest)
                if not success and url:
                    # Try thumbnail URL as fallback
                    thumb_url = card.get(f"{side}_url_thumb")
                    if thumb_url and thumb_url != url:
                        success = _download_one(thumb_url, dest)

                result[side] = "ok" if success else "missing"
                stats[side]["ok" if success else "missing"] += 1
                time.sleep(IMAGE_DELAY)

            manifest[cid] = result
            pbar.set_postfix({s: f"{stats[s]['ok']}/{len(cards)}" for s in sides})
            pbar.update(1)

    manifest_path.write_text(json.dumps(manifest, indent=2))

    print(f"\n{'─'*50}")
    print(f"✅ Done!")
    print(f"   Total cards: {stats['total']}")
    for side in sides:
        s = stats[side]
        total_done = s['ok'] + s['cached']
        print(f"   {side.capitalize()} images: {total_done} ✓  {s['missing']} missing  ({s['cached']} cached)")
    print(f"   Output: {out.resolve()}")
    print(f"   Manifest: {manifest_path}")

    if any(stats[s]["missing"] > 0 for s in sides):
        missing_count = sum(stats[s]["missing"] for s in sides)
        print(f"\n   ⚠ {missing_count} images missing.")
        print(f"   If running from a server, try downloading the catalog on your local machine:")
        print(f"   python scraper.py download --catalog {catalog_path} --output {output_dir}")

    return stats


# ── All-in-one ────────────────────────────────────────────────────────────────

def scrape_set(
    set_id: int,
    output_dir: str,
    sides: List[str] = ("front", "back"),
    limit: Optional[int] = None,
    resume: bool = False,
) -> None:
    """Build catalog and download images in one step."""
    catalog_path = Path(output_dir) / f"catalog_{set_id}.json"
    build_catalog(set_id, str(catalog_path), limit=limit)
    download_images(str(catalog_path), output_dir, sides=sides, limit=limit, resume=resume)


# ── CLI ───────────────────────────────────────────────────────────────────────

def cmd_search(args):
    session = make_session()
    results = search_sets(args.query, session)
    if not results:
        print("No sets found. Try a broader query.")
        return
    print(f"\nFound {len(results)} set(s):\n")
    for r in results[:40]:
        print(f"  [{r['set_id']:>7}]  {r['name']}")
    print(f"\nNext step — build a URL catalog:")
    print(f"  python scraper.py catalog --set-id <ID> --output ./my-set.json")


def cmd_catalog(args):
    build_catalog(args.set_id, args.output, limit=args.limit)


def cmd_download(args):
    sides = []
    if not args.back_only:
        sides.append("front")
    if not args.front_only:
        sides.append("back")
    if not sides:
        sides = ["front", "back"]
    download_images(args.catalog, args.output, sides=sides,
                    limit=args.limit, resume=args.resume)


def cmd_scrape(args):
    sides = []
    if not getattr(args, "back_only", False):
        sides.append("front")
    if not getattr(args, "front_only", False):
        sides.append("back")
    if not sides:
        sides = ["front", "back"]
    scrape_set(args.set_id, args.output, sides=sides,
               limit=args.limit, resume=args.resume)


def main():
    parser = argparse.ArgumentParser(
        description="Sports Card Image Scraper — TCDB front & back card images",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Workflow:
  1. Search for set:     python scraper.py search "1989 Upper Deck baseball"
  2. Build URL catalog:  python scraper.py catalog --set-id 136 --output 1989-ud.json
  3. Download images:    python scraper.py download --catalog 1989-ud.json --output ./cards

  Or all-in-one:         python scraper.py scrape --set-id 136 --output ./cards/1989-ud

NOTE: If image downloads fail (server IP blocked), build the catalog on this machine,
then run the 'download' command on your local machine where browser access is not restricted.
""",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # search
    p_search = sub.add_parser("search", help="Search for a set by name")
    p_search.add_argument("query", help='e.g. "1989 Upper Deck baseball"')

    # catalog
    p_cat = sub.add_parser("catalog", help="Build a JSON catalog of card image URLs (no downloading)")
    p_cat.add_argument("--set-id", type=int, required=True)
    p_cat.add_argument("--output", required=True, help="Path to save catalog JSON")
    p_cat.add_argument("--limit", type=int, default=None)

    # download
    p_dl = sub.add_parser("download", help="Download images from a catalog JSON")
    p_dl.add_argument("--catalog", required=True, help="Path to catalog JSON")
    p_dl.add_argument("--output", required=True, help="Directory for downloaded images")
    p_dl.add_argument("--resume", action="store_true")
    p_dl.add_argument("--limit", type=int, default=None)
    side_dl = p_dl.add_mutually_exclusive_group()
    side_dl.add_argument("--front-only", action="store_true")
    side_dl.add_argument("--back-only", action="store_true")

    # scrape (all-in-one)
    p_sc = sub.add_parser("scrape", help="Catalog + download in one step")
    p_sc.add_argument("--set-id", type=int, required=True)
    p_sc.add_argument("--output", required=True)
    p_sc.add_argument("--resume", action="store_true")
    p_sc.add_argument("--limit", type=int, default=None)
    side_sc = p_sc.add_mutually_exclusive_group()
    side_sc.add_argument("--front-only", action="store_true")
    side_sc.add_argument("--back-only", action="store_true")

    args = parser.parse_args()
    dispatch = {"search": cmd_search, "catalog": cmd_catalog,
                "download": cmd_download, "scrape": cmd_scrape}
    dispatch[args.command](args)


if __name__ == "__main__":
    main()
