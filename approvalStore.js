// Stand-in for Auth0's CIBA (Client-Initiated Backchannel Authentication)
// flow: a high-impact action is parked as "pending" and only runs once an
// out-of-band approval arrives on a separate channel (here, a separate HTTP
// call simulating a push notification/email approval link).
const { randomUUID } = require('crypto');

const pending = new Map();

function createRequest(action, payload) {
  const id = randomUUID();
  pending.set(id, { id, action, payload, status: 'pending', createdAt: new Date().toISOString() });
  return pending.get(id);
}

function getRequest(id) {
  return pending.get(id);
}

function resolveRequest(id, approved) {
  const req = pending.get(id);
  if (!req) return null;
  req.status = approved ? 'approved' : 'denied';
  return req;
}

module.exports = { createRequest, getRequest, resolveRequest };
