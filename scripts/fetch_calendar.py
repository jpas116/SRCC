#!/usr/bin/env python3
"""Read SRCC's public Google Calendar and write site/data/events.json.

Runs in GitHub Actions on a schedule. If the calendar can't be reached,
the existing events.json is left alone so the site keeps working.
"""
import datetime as dt
import json
import re
import sys
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

CAL_ID = "bf82dd5d1c8a0ec88c9109e656c0b4bf2611f59cd9d14f0b000614744bcf40d2@group.calendar.google.com"
ICS_URL = f"https://calendar.google.com/calendar/ical/{CAL_ID}/public/basic.ics"
OUT = Path(__file__).resolve().parent.parent / "site" / "data" / "events.json"
TZ = ZoneInfo("America/New_York")
DAYS_AHEAD = 60
MAX_EVENTS = 14

TICKET_HOSTS = ("zeffy.com", "venuepilot.com", "eventbrite.com", "ticketleap.com", "eventworld.com")


def categorize(title: str) -> str:
    t = title.lower()
    if "open mic" in t or "open art" in t or "studio open" in t:
        return "Weekly"
    if "circle" in t and "drum" not in t:
        return "Community"
    if "yoga" in t or "meditat" in t:
        return "Wellness"
    if "workshop" in t or "class" in t or "lesson" in t:
        return "Workshops"
    if "collage" in t or "art night" in t or "exhibit" in t or "gallery" in t:
        return "Art"
    if "jam" in t or "drum" in t:
        return "Community"
    return "Live music"


def find_price(text: str) -> str:
    m = re.search(r"\$\s?(\d{1,3})(?:\s*[-–/]\s*\$?(\d{1,3}))?", text or "")
    if not m:
        if re.search(r"\bfree\b", text or "", re.I):
            return "Free"
        return ""
    return f"${m.group(1)}" + (f"–${m.group(2)}" if m.group(2) else "")


def find_ticket_url(text: str) -> str:
    for url in re.findall(r"https?://[^\s<>\"')]+", text or ""):
        if any(h in url for h in TICKET_HOSTS):
            return url
    return ""


def main() -> int:
    try:
        import icalendar  # noqa: F401
        import recurring_ical_events
    except ImportError:
        print("missing deps: pip install icalendar recurring_ical_events", file=sys.stderr)
        return 1

    try:
        with urllib.request.urlopen(ICS_URL, timeout=30) as r:
            raw = r.read()
    except Exception as e:  # noqa: BLE001
        print(f"calendar fetch failed, keeping existing events.json: {e}", file=sys.stderr)
        return 0

    try:
        return build(raw)
    except Exception as e:  # noqa: BLE001
        print(f"calendar parse failed, keeping existing events.json: {e}", file=sys.stderr)
        return 0


def build(raw: bytes) -> int:
    import icalendar
    import recurring_ical_events

    cal = icalendar.Calendar.from_ical(raw)
    now = dt.datetime.now(TZ)
    start = now - dt.timedelta(hours=6)
    end = now + dt.timedelta(days=DAYS_AHEAD)

    events = []
    for ev in recurring_ical_events.of(cal).between(start, end):
        dtstart = ev.get("DTSTART").dt
        dtend = ev.get("DTEND").dt if ev.get("DTEND") else None
        all_day = not isinstance(dtstart, dt.datetime)
        if all_day:
            s = dt.datetime.combine(dtstart, dt.time(0, 0), TZ)
            e = dt.datetime.combine(dtend, dt.time(0, 0), TZ) if dtend else None
        else:
            s = dtstart.astimezone(TZ)
            e = dtend.astimezone(TZ) if dtend else None
        title = str(ev.get("SUMMARY", "")).strip() or "Untitled event"
        desc = str(ev.get("DESCRIPTION", "") or "")
        loc = str(ev.get("LOCATION", "") or "")
        url = find_ticket_url(desc) or str(ev.get("URL", "") or "")
        events.append({
            "title": title,
            "start": s.isoformat(),
            "end": e.isoformat() if e else None,
            "allDay": all_day,
            "category": categorize(title),
            "price": find_price(desc) or find_price(title),
            "ticketUrl": url,
            "location": loc,
            "description": re.sub(r"<[^>]+>", "", desc)[:400],
        })

    events.sort(key=lambda x: x["start"])
    events = events[:MAX_EVENTS]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "source": "google-calendar",
        "generatedAt": now.isoformat(),
        "events": events,
    }, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {len(events)} events to {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
