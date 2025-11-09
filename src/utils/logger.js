const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '../../logs');
const SEND_LOG = path.join(LOGS_DIR, 'send.log');
const AUDIT_LOG = path.join(LOGS_DIR, 'audit.log');

// send.log에 이벤트 기록
function logToSend(actor, event, nodes, payload = {}) {
  const logEntry = {
    ts: new Date().toISOString(),
    actor,
    event,
    nodes,
    payload
  };

  try {
    fs.appendFileSync(SEND_LOG, JSON.stringify(logEntry) + '\n', 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing to send.log:', e);
    return false;
  }
}

// audit.log에 감사 로그 기록
function logToAudit(actor, action, details = {}) {
  const logEntry = {
    ts: new Date().toISOString(),
    actor,
    action,
    details
  };

  try {
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(logEntry) + '\n', 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing to audit.log:', e);
    return false;
  }
}

module.exports = {
  logToSend,
  logToAudit
};
