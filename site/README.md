# Standalone mockup

A browser-viewable copy of the design mockup, published with GitHub Pages.

- `index.html`, `events.html`, `event.html`, `programs.html`, `about.html`, `membership.html`, `book.html` — the seven pages
- `support.js` — a small renderer that makes the design-canvas page format work in a normal browser
- `images/` — web-compressed copies of SRCC's logo and flyers

- `data/events.json` — events from the past 45 days and next 60 days, rewritten from SRCC's public Google Calendar by `scripts/fetch_calendar.py` on every deploy and every 6 hours. Feeds the month grid and the Coming up / Recently lists. The copy in the repo is a fallback.
- `data/archive.json` — every past show from the old site, used by the archive search

The pages started as copies of `../design/` and are now edited here directly; the design folder is the visual reference.

What works: navigation, event filters, archive search / year tabs / load more, booking and newsletter forms (they open a pre-filled email), share button, Join now (goes to SRCC's current signup link), Get tickets (opens the event's Zeffy page when the calendar entry has one).

What's still a stand-in: the single event page is a sample; checkout opens a real but old Zeffy ticket page; Listen links need band URLs from SRCC.
