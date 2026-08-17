const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const LEAD_DIR = process.env.LEAD_DIR || (process.env.VERCEL ? '/tmp/gorse-force-leads' : path.join(ROOT, 'data'));
const LEAD_FILE = path.join(LEAD_DIR, 'quote-requests.jsonl');
const MAX_BODY_SIZE = 100 * 1024;
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const LEAD_EMAIL_TO = process.env.LEAD_EMAIL_TO || GMAIL_USER;
const REQUIRE_EMAIL_DELIVERY = process.env.LEAD_EMAIL_REQUIRED === 'true' || Boolean(process.env.VERCEL);
let mailTransporter;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error('Request is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function cleanText(value, maxLength = 1000) {
  return String(value || '').trim().replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, maxLength);
}

function validateQuote(payload) {
  const name = cleanText(payload.name, 120);
  const phone = cleanText(payload.phone, 80);
  const email = cleanText(payload.email, 160).toLowerCase();
  const service = cleanText(payload.service, 120);
  const location = cleanText(payload.location, 160);
  const contactTime = cleanText(payload.contactTime, 80);
  const message = cleanText(payload.message, 3000);
  const errors = {};

  if (name.length < 2) errors.name = 'Please add your name.';
  if (phone.length < 7) errors.phone = 'Please add a phone number we can call.';
  if (location.length < 2) errors.location = 'Please add the job location.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleaned: { name, phone, email, service, location, contactTime, message },
  };
}

function saveQuote(record) {
  fs.mkdirSync(LEAD_DIR, { recursive: true });
  fs.appendFileSync(LEAD_FILE, `${JSON.stringify(record)}\n`, 'utf8');
}

function isEmailConfigured() {
  return Boolean(GMAIL_USER && GMAIL_APP_PASSWORD && LEAD_EMAIL_TO);
}

function getMailTransporter() {
  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return mailTransporter;
}

async function emailQuoteNotification(record) {
  if (!isEmailConfigured()) {
    throw new Error('Gmail lead delivery is not configured.');
  }

  const replyTo = record.email || GMAIL_USER;
  const subject = `New Gorse Force lead — ${record.service || 'Site visit'} in ${record.location}`;
  const text = [
    'New Gorse Force website enquiry',
    '',
    `Lead ID: ${record.id}`,
    `Submitted: ${record.submittedAt}`,
    `Name: ${record.name}`,
    `Phone: ${record.phone}`,
    `Email: ${record.email || 'Not provided'}`,
    `Best time to call: ${record.contactTime || 'Not specified'}`,
    `Service: ${record.service || 'Not specified'}`,
    `Location: ${record.location}`,
    '',
    'Job details:',
    record.message || 'Not provided',
  ].join('\n');

  return getMailTransporter().sendMail({
    from: `Gorse Force Leads <${GMAIL_USER}>`,
    to: LEAD_EMAIL_TO,
    replyTo,
    subject,
    text,
  });
}

function serveStatic(pathname, res) {
  const requestedPath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const filePath = path.resolve(ROOT, requestedPath);

  if (!filePath.startsWith(`${ROOT}${path.sep}`) && filePath !== path.join(ROOT, 'index.html')) {
    sendJson(res, 403, { ok: false, error: 'Forbidden path.' });
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(res, 404, { ok: false, error: 'Not found.' });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
      'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(data);
  });
}

async function handler(req, res) {
  const origin = `http://${req.headers.host || 'localhost'}`;
  const url = new URL(req.url, origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/quote-request') {
    try {
      const rawBody = await readBody(req);
      const payload = rawBody ? JSON.parse(rawBody) : {};
      const validation = validateQuote(payload);

      if (!validation.valid) {
        sendJson(res, 400, { ok: false, error: 'Please check the form and try again.', fields: validation.errors });
        return;
      }

      const record = {
        id: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
        ...validation.cleaned,
      };
      if (REQUIRE_EMAIL_DELIVERY && !isEmailConfigured()) {
        sendJson(res, 503, { ok: false, error: 'Lead delivery is being configured. Please call or try again shortly.' });
        return;
      }

      saveQuote(record);
      let emailDelivered = false;
      if (isEmailConfigured()) {
        await emailQuoteNotification(record);
        emailDelivered = true;
      }

      sendJson(res, 201, { ok: true, id: record.id, emailDelivered });
    } catch (error) {
      const message = error instanceof SyntaxError ? 'Please check the form and try again.' : 'Could not deliver your request right now. Please try again or contact Gorse Force directly.';
      sendJson(res, 500, { ok: false, error: message });
    }
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(url.pathname, res);
    return;
  }

  sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
}

module.exports = handler;

if (require.main === module) {
  http.createServer(handler).listen(PORT, '0.0.0.0', () => {
    console.log(`Gorse Force is running at http://localhost:${PORT}`);
  });
}
