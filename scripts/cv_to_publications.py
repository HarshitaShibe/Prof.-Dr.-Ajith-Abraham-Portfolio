#!/usr/bin/env python3
"""Build src/data/publications.json from the publication list in the CV PDF.

Usage (from the project root):
    pip install pymupdf
    python scripts/cv_to_publications.py public/Ajith-Abraham-CV.pdf src/data/publications.json

The CV is the source of truth. The script reads each numbered entry in the
"Contributed Research Publications" part of the CV, splits it into authors,
title, venue and year, and checks the counts per category against the
summary table on the same CV ("Summary of contributed research publications").
Differences are printed; with --strict the script stops without writing.
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from datetime import date

import pymupdf

# Sub-headings in the CV -> publication type used by the site.
SECTIONS = [
    ("Authored Books", "book"),
    ("Peer Reviewed Articles Published (or in press) in International Journals", "journal"),
    ("Peer Reviewed Book Chapters Published by International Publishers", "chapter"),
    ("Edited Books", "edited-book"),
    ("Edited Conference Proceedings", "proceedings"),
    ("Peer Reviewed Articles Published in International Conferences", "conference"),
    ("Invited/Non refereed papers/Short articles etc.", "other"),
]
STOP = ("Book Reviews", "Teaching")

# Row labels of the CV's summary table -> type.
TABLE_ROWS = {
    "Authored books": "book",
    "Journal papers": "journal",
    "Book chapters": "chapter",
    "Edited books": "edited-book",
    "Edited conference proceedings": "proceedings",
    "Conference papers": "conference",
    "Invited articles etc.": "other",
}

NAME_PARTICLES = {
    "de", "da", "di", "do", "dos", "das", "del", "della", "van", "von", "der", "den",
    "la", "le", "bin", "binti", "al", "el", "ul", "e", "y", "ben", "abu", "ter",
}
TITLE_WORDS = {
    "learning", "network", "networks", "neural", "intelligence", "intelligent",
    "optimization", "optimisation", "model", "models", "modeling", "modelling", "data",
    "analysis", "system", "systems", "algorithm", "algorithms", "approach", "based",
    "using", "review", "survey", "framework", "detection", "classification",
    "prediction", "computing", "computation", "evolutionary", "fuzzy", "swarm",
    "genetic", "hybrid", "image", "images", "security", "internet", "things", "deep",
    "machine", "artificial", "method", "methods", "design", "web", "mining", "control",
    "segmentation", "recognition", "clustering", "selection", "scheduling", "towards",
    "novel", "new", "efficient", "adaptive", "smart", "medical", "healthcare",
    "applications", "application", "study", "management", "environment", "service",
    "services", "cloud", "big", "quantum", "blockchain", "volume", "proceedings",
    "conference", "journal", "international", "springer", "elsevier", "ieee",
    "computational", "soft", "metaheuristic", "metaheuristics", "agent", "agents",
    "multi", "distributed", "sensor", "wireless", "robust", "feature", "features",
    "energy", "power", "time", "series", "dynamic", "process", "processing", "search",
    "information", "hiding", "inspired", "bio", "editorial", "special", "issue", "theory",
    "advanced", "foundations", "trends", "challenges", "perspective", "recent", "robotics",
    "reasoning", "biomedical", "nature", "computer", "science", "engineering",
    "technologies", "technology", "digital", "health", "education", "vision", "language",
    "preface", "guest", "introduction", "innovations", "emerging", "hybridization",
    "diseases", "insights", "solutions", "ai", "iot",
}
VENUE_HINT = re.compile(
    r"^(In |Journal|IEEE|ACM|Proceedings|Proc\.|International|Springer|Elsevier|"
    r"Lecture Notes|Transactions|Applied|Expert Systems|Information Sciences|"
    r"Neurocomputing|Advances in|Studies in|Frontiers|Scientific Reports|PLoS|"
    r"Computers|Engineering|Knowledge|Soft Computing|Applied Soft|Discover|"
    r"Multimedia|Neural Comput|Pattern|Sensors|Mathematics|Symmetry|Electronics|"
    r"Annals|Cluster|Future Generation|Heliyon|Scientific|Procedia|AIP|Wiley|CRC|"
    r"Taylor|IGI|Academic Press|Nova|World Scientific|Atlantis|IOS Press|MDPI|"
    r"\d{1,2}(st|nd|rd|th) |(The )?(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|"
    r"Ninth|Tenth|Eleventh|Twelfth) |The \d|NATO|World Congress|Workshop|Symposium|Congress)"
)
YEAR = re.compile(r"\b(19[6-9]\d|20[0-4]\d)\b")


ACCENTS = {"¨": "\u0308", "´": "\u0301", "`": "\u0300", "˜": "\u0303", "ˇ": "\u030c", "^": "\u0302", "˚": "\u030a"}


def fix_accents(text: str) -> str:
    """pdfTeX writes some accents as a separate mark before the letter ("K¨oppen")."""
    text = re.sub(
        r"([¨´`˜ˇ˚])\s?([A-Za-z])",
        lambda m: unicodedata.normalize("NFC", m.group(2) + ACCENTS[m.group(1)]),
        text,
    )
    text = re.sub(r"([cCsS])¸", lambda m: unicodedata.normalize("NFC", m.group(1) + "\u0327"), text)
    return text


def clean(text: str) -> str:
    text = fix_accents(text)
    text = re.sub(r"\bemph(?=[A-Z])", "", text)  # a stray LaTeX command in the CV
    text = text.replace(" ", " ").replace("’", "'").replace("‘", "'")
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([,.;:])", r"\1", text)
    return text.strip()


def read_lines(pdf: str):
    """Yields (text, bold_mask) per line; bold_mask marks bold characters."""
    doc = pymupdf.open(pdf)
    for page in doc:
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                text, mask = "", []
                for span in line["spans"]:
                    text += span["text"]
                    mask += [bool(span["flags"] & 16)] * len(span["text"])
                if text.strip():
                    yield text, mask


def join_lines(lines):
    """Joins the wrapped lines of one entry, undoing end-of-line hyphenation."""
    text, mask = "", []
    for t, m in lines:
        t_stripped = t.rstrip()
        m = m[: len(t_stripped)]
        lead = len(t_stripped) - len(t_stripped.lstrip())
        t_stripped, m = t_stripped[lead:], m[lead:]
        if not text:
            text, mask = t_stripped, list(m)
            continue
        if re.search(r"[A-Za-z]-$", text) and t_stripped[:1].islower():
            text, mask = text[:-1], mask[:-1]  # "Steganog-" + "raphy"
        elif re.search(r"[A-Za-z0-9]-$", text):
            pass  # a real hyphen at the line end: "Zero-" + "Shot" -> "Zero-Shot"
        else:
            text += " "
            mask.append(mask[-1] if mask else False)
        text += t_stripped
        mask += m
    return text, mask


STOPWORDS = {"for", "of", "the", "in", "on", "to", "a", "an", "with", "using", "via", "by", "from", "into", "under", "towards", "is", "are"}


def is_name_lenient(piece: str) -> bool:
    """Like is_name, but accepts a lower-case word ("Hesam izakian", "Aboul ella Hassanien")."""
    words = [w.strip(".,;") for w in piece.split()]
    if not 1 <= len(words) <= 5 or re.search(r"[:\d()\[\]?!\"/]", piece):
        return False
    if any(w.lower() in TITLE_WORDS or w.lower() in STOPWORDS for w in words):
        return False
    return any(w[:1].isupper() for w in words)


def is_name(piece: str) -> bool:
    piece = piece.strip()
    if not piece or len(piece) > 48 or re.search(r"[:\d()\[\]?!\"/]", piece):
        return False
    words = piece.split()
    if not 1 <= len(words) <= 6:
        return False
    for w in words:
        bare = w.strip(".,;")
        if not bare:
            continue
        if bare.lower() in NAME_PARTICLES:
            continue
        if bare.lower() in TITLE_WORDS:
            return False
        if bare in ("et", "al"):
            continue
        if not re.match(r"^[A-ZÀ-ÖØ-ÞČŠŽŁŚ][\w'.\-À-ÿ¨´`˜ˇ]*$", bare):
            return False
    return True


def split_authors(text: str, bold_start: int | None):
    """Returns (authors, rest). Authors are consumed name by name from the start."""
    limit = bold_start if bold_start is not None else len(text)
    authors: list[str] = []
    pos = 0
    while pos < limit:
        nxt = text.find(",", pos)
        if nxt == -1 or nxt > limit:
            break
        piece = text[pos:nxt]
        # "an" covers a typo in the CV ("Ajith Abraham an Kaoru Hirota").
        names = [p for p in re.split(r"\s+and?\s+|;\s*", piece.strip()) if p.strip()]
        names = [re.sub(r"^and\s+", "", n.strip()) for n in names]
        # Before Prof. Abraham's own name, lower-case surnames are tolerated.
        abraham_ahead = "Ajith Abraham" in text[nxt:limit] or "Abraham" in piece
        check = is_name_lenient if abraham_ahead else is_name
        if names and all(check(n) or is_name(n) for n in names):
            authors += [n.strip() for n in names]
            pos = nxt + 1
        else:
            break
    if not authors:
        return [], text
    return authors, text[pos:].strip()


def parse_entry(text: str, mask: list[bool], kind: str):
    text_mask = list(zip(text, mask))
    # first bold run
    bold_start = next((i for i, (c, b) in enumerate(text_mask) if b and c.strip()), None)
    bold_end = None
    if bold_start is not None:
        bold_end = bold_start
        while bold_end < len(text) and (mask[bold_end] or not text[bold_end].strip()):
            bold_end += 1
    authors, rest = split_authors(text, bold_start)
    consumed = len(text) - len(rest)

    title, venue = "", ""
    if bold_start is not None and bold_start >= consumed:
        bold_text = text[bold_start:bold_end].strip(" ,")
        before = text[consumed:bold_start].strip(" ,")
        after = text[bold_end:].strip(" ,")
        more = [p.strip() for p in re.split(r",\s*|\s+and\s+", before) if p.strip()]
        if before and kind in ("book", "edited-book", "proceedings") and all(is_name(p) for p in more):
            authors += more  # editor list continues up to the bold title
            before = ""
        if not before:
            title, venue = bold_text, after  # books: the bold part is the title
        else:
            title, venue = before, (bold_text + ", " + after).strip(" ,")
    else:
        # No usable bold: the title ends at the first comma followed by a venue.
        parts = rest.split(", ")
        cut = None
        for i in range(1, len(parts)):
            if VENUE_HINT.match(parts[i]):
                cut = i
                break
        if cut is None:
            cut = 1
        title, venue = ", ".join(parts[:cut]), ", ".join(parts[cut:])

    # A "title" that is really a list of names ("M. Cannataro et al.") belongs to the authors.
    if title and all(is_name(p) for p in re.split(r",\s*|\s+and\s+", title.strip(" ,")) if p.strip()):
        authors += [p.strip() for p in re.split(r",\s*|\s+and\s+", title.strip(" ,")) if p.strip()]
        parts = venue.split(", ")
        title, venue = parts[0], ", ".join(parts[1:])

    # A title cut after a dangling word ("Proceedings of the") continues into the venue.
    while venue and re.search(r"\b(of|the|on|for|and|in)$", title.strip()):
        parts = venue.split(", ")
        title, venue = f"{title.strip()} {parts[0]}", ", ".join(parts[1:])

    years = YEAR.findall(venue) or YEAR.findall(text)
    year = int(years[-1]) if years else None
    venue = re.sub(r"[,.\s]*$", "", venue)
    if year and venue.endswith(str(year)):
        venue = venue[: -len(str(year))].rstrip(" ,.")
    return {
        "type": kind,
        "title": clean(title).strip("'\" ").rstrip(",. "),
        "authors": [clean(a) for a in authors],
        "venue": clean(venue),
        "year": year,
    }


def main(pdf: str, out: str):
    lines = list(read_lines(pdf))
    full = "\n".join(page.get_text() for page in pymupdf.open(pdf))
    table: dict[str, int] = {}
    for label, k in TABLE_ROWS.items():
        tm = re.search(rf"{re.escape(label)}\s+([\d,]+)", full)
        if tm:
            table[k] = int(tm.group(1).replace(",", ""))
    tm = re.search(r"Summary of contributed research publications as of ([A-Za-z]+ \d{1,2}, \d{4})", full)
    as_of = tm.group(1) if tm else None
    kind, started = None, False
    entries: dict[str, list] = {k: [] for _, k in SECTIONS}
    current: list = []
    expected = 1

    def flush():
        nonlocal current
        if current and kind:
            text, mask = join_lines(current)
            text = re.sub(r"^\d+\.\s*", "", text)
            if "emph" in text:
                idx = text.find("emphAjith")
                while idx != -1:
                    text = text[:idx] + text[idx + 4:]
                    mask = mask[:idx] + mask[idx + 4:]
                    idx = text.find("emphAjith")
            mask = mask[len(mask) - len(text):]
            entries[kind].append(parse_entry(text, mask, kind))
        current = []

    for text, mask in lines:
        stripped = text.strip()
        if not started:
            if stripped == "Contributed Research Publications":
                started = True
            continue
        if stripped.startswith(STOP):
            flush()
            break
        heading = next((k for label, k in SECTIONS if stripped == label), None)
        if heading:
            flush()
            kind, expected = heading, 1
            continue
        if re.fullmatch(r"\d+", stripped):  # page number
            continue
        num = re.match(r"^(\d+)\.\s", stripped)
        if num and int(num.group(1)) == expected:
            flush()
            expected += 1
        if kind:
            current.append((text, mask))

    problems = [
        f"{k}: CV table says {table.get(k)}, parsed {len(v)}"
        for k, v in entries.items()
        if table.get(k) is not None and table[k] != len(v)
    ]
    if problems:
        print("Note: the CV's list and its summary table differ:\n  " + "\n  ".join(problems))
        if STRICT:
            sys.exit("Stopped (--strict).")

    items = []
    for k, v in entries.items():
        for i, e in enumerate(v, 1):
            e["id"] = f"{k}-{i}"
            items.append(e)

    data = {
        "source": "Curriculum vitae of Prof. Ajith Abraham (public/Ajith-Abraham-CV.pdf)",
        "asOf": as_of,
        "generated": date.today().isoformat(),
        "counts": {k: len(v) for k, v in entries.items()},
        # The CV's own summary table, kept for comparison with the counted list.
        "tableCounts": table,
        "items": items,
    }
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"Wrote {len(items)} publications to {out} (CV as of {as_of}).")
    missing_year = [e["id"] for e in items if not e["year"]]
    no_title = [e["id"] for e in items if not e["title"]]
    if missing_year:
        print(f"  {len(missing_year)} without a year: {', '.join(missing_year[:10])}")
    if no_title:
        print(f"  {len(no_title)} without a title: {', '.join(no_title[:10])}")


STRICT = "--strict" in sys.argv

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--strict"]
    if len(args) != 2:
        sys.exit(__doc__)
    main(args[0], args[1])
