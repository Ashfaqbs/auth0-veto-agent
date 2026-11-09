// Stand-in for a third-party service (e.g. Google/Slack/GitHub) the agent
// is connected to. In a real deployment the access token for this service
// would be fetched from Auth0 Token Vault instead of held by the app.
let inbox = [
  { id: 1, subject: 'Standup notes', read: false },
  { id: 2, subject: 'Random newsletter', read: false },
  { id: 3, subject: 'Already handled this one', read: true },
  { id: 4, subject: 'Follow up with design', read: false },
];

function listUnread() {
  return inbox.filter((m) => !m.read);
}

function deleteUnread() {
  const removed = listUnread();
  inbox = inbox.filter((m) => m.read);
  return removed;
}

module.exports = { listUnread, deleteUnread };
