# Integrations

## Zeffy (tickets, donations, memberships)

SRCC already sells tickets and takes donations through Zeffy. Zeffy charges nonprofits no fees.

**What Zeffy's API can do (as of mid-2026):**

- Free for every Zeffy organization. API key is generated from the Zeffy settings page.
- **Read-only.** Three resources: Payments, Contacts, Campaigns (campaigns include donation forms and events).
- REST over HTTPS, Bearer token, 100 requests per minute.
- One webhook event: `payment.completed`.
- Still marked Beta.

**What that means for the site:**

- **Pull** upcoming events from the Campaigns endpoint so new shows appear on the site automatically.
- **Sell** tickets through Zeffy's own embedded checkout form on each event page. The API can't process sales.
- **Keep the API key private.** It must not sit in public page code. The usual fix is a scheduled rebuild (e.g. hourly) that fetches events server-side, or a tiny serverless function that proxies the request.
- **Confirm** the campaign data includes event date, time and image before promising anything. Zeffy's public reference doesn't show every field.

Links:
- https://www.zeffy.com/integration/api
- https://www.zeffy.com/home/integration

## Social feeds

- **Instagram:** Meta's simple feed API was retired; the current one needs a business account and token renewals. A lightweight widget like Behold or SociableKIT is the low-maintenance route.
- **Facebook:** Facebook's own free Page embed works without an API key.
- **YouTube:** standard channel embed.

## Forms

- **Booking inquiry** and **newsletter signup** need a form backend. Options: Netlify Forms (if hosted on Netlify), Formspree, or a Zeffy form for anything involving money.
- **Membership signup** should be a Zeffy form so recurring billing stays in Zeffy.
