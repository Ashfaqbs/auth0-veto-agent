require('dotenv').config();

const express = require('express');
const { listUnread, deleteUnread } = require('./thirdPartyInbox');
const { createRequest, getRequest, resolveRequest } = require('./approvalStore');

const app = express();
app.use(express.json());

// Read-only agent action: no approval needed.
app.get('/agent/unread', (req, res) => {
  res.json(listUnread());
});

// High-impact agent action: instead of executing immediately, this parks
// the action and simulates sending an out-of-band push/email for approval.
// Mirrors Auth0 CIBA: the agent's flow halts until a separate channel
// confirms the request.
app.post('/agent/delete-unread', (req, res) => {
  const unread = listUnread();
  const request = createRequest('delete-unread', { count: unread.length, subjects: unread.map((m) => m.subject) });

  console.log(`[OUT-OF-BAND NOTIFICATION] "AI Agent wants to delete ${unread.length} unread emails." Approve at /approvals/${request.id}/approve`);

  res.status(202).json({
    message: 'Action requires approval. Not executed yet.',
    requestId: request.id,
    pollUrl: `/agent/delete-unread/status/${request.id}`,
  });
});

// Simulates the separate, out-of-band approval channel (e.g. a push
// notification the user taps, or a link in an email) — never part of the
// agent's own chat/response loop.
app.post('/approvals/:id/approve', (req, res) => {
  const request = resolveRequest(req.params.id, true);
  if (!request) return res.status(404).json({ error: 'Unknown request' });
  res.json({ status: request.status });
});

app.post('/approvals/:id/deny', (req, res) => {
  const request = resolveRequest(req.params.id, false);
  if (!request) return res.status(404).json({ error: 'Unknown request' });
  res.json({ status: request.status });
});

// The agent polls this to find out whether its parked action was approved,
// and only then actually executes it against the third-party service.
app.get('/agent/delete-unread/status/:id', (req, res) => {
  const request = getRequest(req.params.id);
  if (!request) return res.status(404).json({ error: 'Unknown request' });

  if (request.status === 'pending') {
    return res.json({ status: 'pending', executed: false });
  }
  if (request.status === 'denied') {
    return res.json({ status: 'denied', executed: false });
  }

  const removed = deleteUnread();
  res.json({ status: 'approved', executed: true, deleted: removed });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Veto Agent listening on http://localhost:${port}`));
