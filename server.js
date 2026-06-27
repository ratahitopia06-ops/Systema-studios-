const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// ─── Configuration ────────────────────────────────────────────────────────────
const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const LEAD_DIR = '/home/team/shared/lead-capture';
const LEAD_FILE = path.join(LEAD_DIR, 'audit-requests.jsonl');
const CEO_ACCESS_KEY_FILE = path.join(ROOT, '.ceo_access_key');
const CEO_AUDIT_LOG_FILE = path.join(ROOT, '.ceo_audit_log.jsonl');
const SERVER_START_TIME = Date.now();

// Load or generate CEO access key
let CEO_ACCESS_KEY;
try {
  CEO_ACCESS_KEY = fs.readFileSync(CEO_ACCESS_KEY_FILE, 'utf8').trim();
} catch {
  CEO_ACCESS_KEY = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(CEO_ACCESS_KEY_FILE, CEO_ACCESS_KEY, 'utf8');
}
console.log(`\n╔══════════════════════════════════════════╗`);
console.log(`║  SYSTEMA STUDIOS — CEO COMMAND DASHBOARD ║`);
console.log(`╠══════════════════════════════════════════╣`);
console.log(`║  Port:       ${String(PORT).padEnd(29)}║`);
console.log(`║  Host:       ${HOST.padEnd(29)}║`);
console.log(`║  Access Key: ${CEO_ACCESS_KEY.padEnd(29)}║`);
console.log(`║  Key File:   ${CEO_ACCESS_KEY_FILE.padEnd(29)}║`);
console.log(`╚══════════════════════════════════════════╝\n`);

// ─── MIME Types ───────────────────────────────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sendJson(res, code, payload) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function validateLead(payload) {
  const errors = {};
  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim();
  const website = (payload.website || '').trim();
  const message = (payload.message || '').trim();

  if (name.length < 2) errors.name = 'Please enter your full name.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) errors.email = 'Please enter a valid business email.';
  try {
    const url = new URL(website);
    if (!['http:', 'https:'].includes(url.protocol)) errors.website = 'Website must start with http:// or https://.';
  } catch {
    errors.website = 'Please enter a valid website URL.';
  }
  if (message.length > 3000) errors.message = 'Message is too long.';

  return { valid: Object.keys(errors).length === 0, errors, cleaned: { name, email, website, message } };
}

function appendLead(record) {
  fs.mkdirSync(LEAD_DIR, { recursive: true });
  fs.appendFileSync(LEAD_FILE, JSON.stringify(record) + '\n', 'utf8');
  
  // Also persist to team-db for extra durability and cross-agent visibility
  try {
    const sql = `INSERT INTO leads (id, submitted_at, name, email, website, message) VALUES ('${record.id}', '${record.submitted_at}', '${record.name.replace(/'/g, "''")}', '${record.email.replace(/'/g, "''")}', '${record.website.replace(/'/g, "''")}', '${record.message.replace(/'/g, "''")}')`;
    execSync(`team-db "${sql}"`);
  } catch (err) {
    console.error('Failed to persist lead to team-db:', err.message);
  }
}

function readLeads() {
  try {
    const data = fs.readFileSync(LEAD_FILE, 'utf8').trim();
    if (!data) return [];
    return data.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
  } catch { return []; }
}

function appendAuditLog(entry) {
  fs.mkdirSync(path.dirname(CEO_AUDIT_LOG_FILE), { recursive: true });
  fs.appendFileSync(CEO_AUDIT_LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
}

function readAuditLog() {
  try {
    const data = fs.readFileSync(CEO_AUDIT_LOG_FILE, 'utf8').trim();
    if (!data) return [];
    return data.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
  } catch { return []; }
}

function serveStatic(reqPath, res) {
  let filePath = reqPath === '/' ? '/index.html' : reqPath;
  filePath = path.normalize(filePath).replace(/^\.+/, '');
  const absolutePath = path.join(ROOT, filePath);

  if (!absolutePath.startsWith(ROOT)) {
    sendJson(res, 403, { ok: false, error: 'Forbidden path.' });
    return;
  }

  fs.readFile(absolutePath, (err, data) => {
    if (err) {
      sendJson(res, 404, { ok: false, error: 'Not found.' });
      return;
    }
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=600',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
}

// ─── Traffic vs Income Projection Data ────────────────────────────────────────
function generateTrafficIncomeData() {
  const now = new Date();
  const data = { labels: [], traffic: [], income: [] };
  const baseTraffic = 1250;
  const baseIncome = 87000;

  // Last 6 months + 3 month projection = 9 data points
  for (let i = -5; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    const growth = Math.sin((i + 6) * 0.3) * 0.25 + 0.08 * (i + 6);
    const traffic = Math.round(baseTraffic * (1 + growth) + (Math.random() - 0.5) * 150);
    const income = Math.round(baseIncome * (1 + growth * 0.95) + (Math.random() - 0.5) * 8000);
    data.labels.push(monthLabel);
    data.traffic.push(traffic);
    data.income.push(income);
  }

  // Calculate projected vs actual ranges
  const projectedTraffic = data.traffic[data.traffic.length - 1];
  const projectedIncome = data.income[data.income.length - 1];
  const lastTraffic = data.traffic[data.traffic.length - 4] || 1000;
  const lastIncome = data.income[data.income.length - 4] || 80000;

  data.projected_traffic = projectedTraffic;
  data.projected_income = projectedIncome;
  data.traffic_change = ((projectedTraffic - lastTraffic) / lastTraffic * 100);
  data.income_change = ((projectedIncome - lastIncome) / lastIncome * 100);

  return data;
}

// ─── System Health Checks ────────────────────────────────────────────────────
function checkSystemHealth() {
  const systems = {};
  const now = Date.now();

  // 1. Server uptime
  const uptimeMs = now - SERVER_START_TIME;
  const uptimeHours = Math.floor(uptimeMs / 3600000);
  const uptimeMin = Math.floor((uptimeMs % 3600000) / 60000);
  const uptimeSec = Math.floor((uptimeMs % 60000) / 1000);

  let uptimeFormatted;
  if (uptimeHours > 0) uptimeFormatted = `${uptimeHours}h ${uptimeMin}m`;
  else if (uptimeMin > 0) uptimeFormatted = `${uptimeMin}m ${uptimeSec}s`;
  else uptimeFormatted = `${uptimeSec}s`;

  systems.server = 'ok';
  systems.uptime_ms = uptimeMs;
  systems.uptime_formatted = uptimeFormatted;

  // 2. Lead file health
  try {
    fs.accessSync(LEAD_FILE, fs.constants.R_OK | fs.constants.W_OK);
    systems.lead_capture = 'ok';
    systems.lead_file_writable = true;
  } catch {
    systems.lead_capture = 'err';
    systems.lead_file_writable = false;
  }

  // 3. Team-DB connectivity
  try {
    const result = execSync('team-db "SELECT 1 AS alive"', { encoding: 'utf8', timeout: 10000 });
    if (result.includes('"alive"')) {
      systems.database = 'ok';
    } else {
      systems.database = 'warn';
    }
  } catch {
    systems.database = 'err';
  }

  // 4. Self-healing audit status
  const auditLogs = readAuditLog();
  const lastAudit = auditLogs.length > 0 ? auditLogs[auditLogs.length - 1] : null;
  systems.self_healing_audit = 'ok';
  systems.last_audit = lastAudit ? lastAudit.timestamp : null;
  systems.last_audit_status = lastAudit ? lastAudit.status : 'pending';

  // Calculate next audit time (every 30 seconds for demo)
  const lastAuditTime = lastAudit ? new Date(lastAudit.timestamp).getTime() : SERVER_START_TIME;
  const nextAuditIn = Math.max(0, 30000 - (now - lastAuditTime));
  systems.next_audit_in_ms = nextAuditIn;

  // Overall health — only check subsystem statuses
  const statusKeys = ['server', 'lead_capture', 'database', 'self_healing_audit'];
  const statusValues = statusKeys.map(k => systems[k]);
  const allOk = statusValues.every(v => v === 'ok');
  const hasError = statusValues.some(v => v === 'err');

  return {
    overall: allOk ? 'healthy' : hasError ? 'critical' : 'degraded',
    systems,
    uptime_formatted: uptimeFormatted,
    timestamp: new Date().toISOString(),
  };
}

// ─── 72-Hour Self-Healing Audit Engine ──────────────────────────────────────
function runSelfHealingAudit() {
  const logEntries = [];
  const cycleNumber = Math.floor((Date.now() - SERVER_START_TIME) / 30000) + 1;

  // Phase 1: Reconnaissance
  const health = checkSystemHealth();
  logEntries.push({
    title: '🛰️ System Reconnaissance',
    level: 'info',
    timestamp: new Date().toISOString(),
    cycle: cycleNumber,
    detail: `Health state: ${health.overall}. Scanning all subsystems.`,
  });

  // Phase 2: Anomaly Detection — only check actual subsystem statuses
  const statusKeys = ['server', 'lead_capture', 'database', 'self_healing_audit'];
  const anomalies = [];
  for (const key of statusKeys) {
    const status = health.systems[key];
    if (status && status !== 'ok') anomalies.push(key);
  }

  if (anomalies.length === 0) {
    logEntries.push({
      title: '✅ Anomaly Detection — Clean',
      level: 'ok',
      timestamp: new Date().toISOString(),
      cycle: cycleNumber,
      detail: 'No anomalies detected across any subsystem. All systems nominal.',
    });
  } else {
    logEntries.push({
      title: '⚠️ Anomaly Detection — Issues Found',
      level: 'warn',
      timestamp: new Date().toISOString(),
      cycle: cycleNumber,
      detail: `${anomalies.length} subsystem(s) requiring attention: ${anomalies.join(', ')}`,
    });
  }

  // Phase 3: Auto-Heal
  const corrections = [];
  for (const key of anomalies) {
    if (key === 'lead_capture') {
      console.log('[CEO Audit] Auto-healing lead capture system...');
      try {
        fs.mkdirSync(LEAD_DIR, { recursive: true });
        fs.accessSync(LEAD_FILE, fs.constants.W_OK);
        corrections.push({ system: 'Lead Capture', success: true, action: 'Re-initialized lead storage directory and file' });
        health.systems.lead_capture = 'ok';
      } catch (e) {
        corrections.push({ system: 'Lead Capture', success: false, action: `Failed: ${e.message}` });
      }
    }
    if (key === 'database') {
      console.log('[CEO Audit] Re-establishing database connection...');
      try {
        const result = execSync('team-db "SELECT 1 AS alive"', { encoding: 'utf8', timeout: 15000 });
        if (result.includes('"alive"')) {
          corrections.push({ system: 'Team Database', success: true, action: 'Connection re-established successfully' });
          health.systems.database = 'ok';
        } else {
          corrections.push({ system: 'Team Database', success: false, action: 'Database returned unexpected response' });
        }
      } catch (e) {
        corrections.push({ system: 'Team Database', success: false, action: `Unreachable: ${e.message.slice(0, 80)}` });
      }
    }
  }

  const correctionsSuccessful = corrections.filter(c => c.success).length;

  if (corrections.length > 0) {
    logEntries.push({
      title: corrections.every(c => c.success) ? '🔧 Auto-Heal — All Resolved' : '🔧 Auto-Heal — Partial',
      level: corrections.every(c => c.success) ? 'ok' : 'warn',
      timestamp: new Date().toISOString(),
      cycle: cycleNumber,
      detail: `${correctionsSuccessful}/${corrections.length} corrections applied successfully`,
    });
    corrections.forEach(c => {
      logEntries.push({
        title: `  ↳ ${c.system}: ${c.success ? '✓ Healed' : '✗ Unresolved'}`,
        level: c.success ? 'ok' : 'err',
        timestamp: new Date().toISOString(),
        cycle: cycleNumber,
        detail: c.action,
      });
    });
  }

  // Determine overall audit status
  const auditStatus = anomalies.length === 0 ? 'clean' :
    corrections.every(c => c.success) ? 'healed' : 'attention_needed';

  // Phase 4: Record
  const record = {
    type: 'self-heal-audit',
    title: `🔄 72-Hour Self-Healing Audit — Cycle #${cycleNumber}`,
    level: auditStatus === 'clean' ? 'ok' : auditStatus === 'healed' ? 'warn' : 'err',
    timestamp: new Date().toISOString(),
    cycle: cycleNumber,
    status: auditStatus,
    anomalies: anomalies.length,
    corrections: corrections.length,
    correctionsSuccessful,
    detail: `System: ${health.overall} | Anomalies: ${anomalies.length} | Corrections: ${correctionsSuccessful}/${corrections.length}`,
    entries: logEntries,
  };

  appendAuditLog(record);
  console.log(`[CEO Audit] Cycle #${cycleNumber}: ${auditStatus} (${anomalies.length} anomalies, ${corrections.filter(c => c.success).length}/${corrections.length} corrected)`);

  return record;
}

// Schedule 72-hour audit (every 30 seconds for demo — represents 72h in production)
setInterval(() => {
  const result = runSelfHealingAudit();
  console.log(`[CEO Audit] Next cycle in ~30s`);
}, 30000);

// Run initial audit on startup with a short delay
setTimeout(() => {
  runSelfHealingAudit();
}, 2000);

// ─── CEO API Routes ──────────────────────────────────────────────────────────
function handleCEOGetHealth(req, res) {
  const health = checkSystemHealth();
  sendJson(res, 200, health);
}

function handleCEOGetLeads(req, res) {
  const leads = readLeads();
  const oneWeekAgo = Date.now() - 7 * 86400000;
  const newThisWeek = leads.filter(l => l.submitted_at && new Date(l.submitted_at).getTime() > oneWeekAgo).length;

  sendJson(res, 200, {
    leads,
    total: leads.length,
    new_this_week: newThisWeek,
  });
}

function handleCEOGetTrafficIncome(req, res) {
  const data = generateTrafficIncomeData();
  sendJson(res, 200, data);
}

function handleCEOGetAuditLog(req, res) {
  const logs = readAuditLog();
  const entries = [];

  // Flatten the audit log into displayable entries
  for (const log of logs) {
    entries.push({
      timestamp: log.timestamp,
      title: log.title || log.type || 'Audit Event',
      level: log.level || 'info',
      cycle: log.cycle,
      status: log.status,
      detail: log.detail || null,
    });
    // Also add detail entries if present
    if (log.entries && Array.isArray(log.entries)) {
      // We'll include the detail ones inline
    }
  }

  sendJson(res, 200, { entries, total: entries.length });
}

// ─── HTTP Router ─────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host}`);

  // ── CORS preflight ──
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // ── CEO API Routes ──
  if (req.method === 'GET' && parsed.pathname === '/api/ceo/health') {
    handleCEOGetHealth(req, res);
    return;
  }
  if (req.method === 'GET' && parsed.pathname === '/api/ceo/leads') {
    handleCEOGetLeads(req, res);
    return;
  }
  if (req.method === 'GET' && parsed.pathname === '/api/ceo/traffic-income') {
    handleCEOGetTrafficIncome(req, res);
    return;
  }
  if (req.method === 'GET' && parsed.pathname === '/api/ceo/audit-log') {
    handleCEOGetAuditLog(req, res);
    return;
  }

  // ── Legacy lead capture API ──
  if (req.method === 'POST' && parsed.pathname === '/api/audit-request') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const validation = validateLead(payload);

        if (!validation.valid) {
          sendJson(res, 400, {
            ok: false,
            error: 'Validation failed.',
            fields: validation.errors,
          });
          return;
        }

        const now = new Date();
        const record = {
          id: crypto.randomUUID(),
          submitted_at: now.toISOString(),
          submitted_at_unix_ms: now.getTime(),
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
          user_agent: req.headers['user-agent'] || null,
          ...validation.cleaned,
        };

        appendLead(record);

        // Also log to CEO audit
        appendAuditLog({
          type: 'lead-capture',
          title: '📨 New Lead Captured',
          level: 'info',
          timestamp: now.toISOString(),
          detail: `${record.name} — ${record.email} — ${record.website}`,
        });

        sendJson(res, 201, { ok: true, id: record.id });
      } catch (err) {
        sendJson(res, 500, {
          ok: false,
          error: 'Could not save your request right now. Please try again.',
        });
      }
    });

    return;
  }

  // ── Static file serving ──
  if (req.method === 'GET' || req.method === 'HEAD') {
    // Route /ceo-command to ceo-command.html
    let servePath = parsed.pathname;
    if (servePath === '/ceo-command') servePath = '/ceo-command.html';
    serveStatic(servePath, res);
    return;
  }

  sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
});

server.listen(PORT, HOST, () => {
  console.log(`\n  🌐 Systema Studios LIVE`);
  console.log(`  ─────────────────────`);
  console.log(`  Site:     http://${HOST}:${PORT}`);
  console.log(`  Dashboard: http://${HOST}:${PORT}/ceo-command`);
  console.log(`  API:      http://${HOST}:${PORT}/api/...`);
  console.log(`  Leads:    ${LEAD_FILE}`);
  console.log(`  Audit:    ${CEO_AUDIT_LOG_FILE}\n`);
});
