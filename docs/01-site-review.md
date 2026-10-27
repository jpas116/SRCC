# Review of the current site (srccpaart.org)

Reviewed October 2026.

## How it's built

- Static site generated with **Hugo**. Fast, free to host, hard to hack.
- Built by a former volunteer. Nobody at SRCC currently edits the code.
- Event images have machine-generated filenames, which suggests a script or feed publishes events. Find out what it is before touching anything.
- SRCC has a Wix account but is not hosting the site on it. The Wix account likely holds the domain registration or an unused draft.

## What's working

- Clear 501(c)(3) framing, address, Donate button and booking email.
- Two-plus years of event history. Proof the place is alive.

## What's holding it back

- **No upcoming events on the homepage.** Visitors see three recurring flyers and a "Past Events" link.
- **The events page is one endless scroll.** No detail pages, no ticket links, no filters. Several times are wrong (e.g. "7:30pm–10:00am").
- **No navigation, About page or Programs page.**
- **Money and sign-up paths are scattered.** PayPal, a Zeffy donation link, and "Join Now" goes to Linktree. Membership prices aren't shown.
- **Image-only flyers.** Unreadable by search engines and screen readers.

## Access needed before any build

| Need | Why |
|---|---|
| Domain registrar login | Controls where srccpaart.org points. The most important one. |
| Hosting login | Where the built site is served from (likely Netlify, Cloudflare Pages or GitHub Pages). |
| Code repository | Probably GitHub. Ask the original builder to transfer ownership. |
| Any automation | Whatever publishes events today. |

If the original builder has gone dark, the new site can be built anywhere and the domain pointed at it, as long as SRCC has the domain login.
