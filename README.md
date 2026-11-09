# The Veto Agent

An AI agent integrated with a third-party service (here, a mock inbox
standing in for Google/Slack/GitHub) that can read freely, but any
high-impact action must be approved by the user **outside the chat
session** before it runs.

## Pattern this demonstrates

- **Token Vault** — in a real deployment, the third-party service's access
  token would be fetched from Auth0's Token Vault at call time instead of
  being stored by the app itself (`thirdPartyInbox.js` is a stand-in for
  that authenticated connection).
- **Asynchronous Authorization (CIBA)** — a sensitive command doesn't
  execute inline. It's parked (`approvalStore.js`), an out-of-band
  notification is simulated (logged to the console, standing in for a push
  notification or email with an approval link), and the agent only carries
  out the action once that separate channel confirms it.

## Flow

1. `GET /agent/unread` — read-only, no approval needed.
2. `POST /agent/delete-unread` — sensitive action. Returns `202` with a
   `requestId` and does **not** delete anything yet; logs an out-of-band
   notification.
3. `POST /approvals/:id/approve` (or `/deny`) — the separate channel the
   user acts on, outside of chat.
4. `GET /agent/delete-unread/status/:id` — the agent polls this; only after
   `approve` does this endpoint actually execute the deletion and return
   what was removed.

Verified end-to-end locally: unread count before -> delete request returns
`pending` and changes nothing -> approve via the separate endpoint -> poll
now executes and empties the inbox.

## Setup

```bash
npm install
npm start
```

## Stack

Node.js, Express. Auth0 Token Vault + CIBA referenced conceptually (see
`.env.example`) for the production wiring of the third-party connection and
the real out-of-band push.
