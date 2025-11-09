const bcrypt = require('bcrypt');
const { getAllData, updateNode, updateNodes } = require('../utils/dataService');
const { logToSend, logToAudit } = require('../utils/logger');
const { NODE_STATUS } = require('../constants');

const SALT_ROUNDS = 10;

const allocateNode = async (nodeId, userId, password, team) => {
  const data = getAllData();
  const node = data.nodes.nodes.find(n => n.node_id === nodeId);

  if (!node) {
    throw new Error('Node not found');
  }

  if (node.status !== NODE_STATUS.FREE) {
    throw new Error('Node is not available');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const success = await updateNode(nodeId, {
    status: NODE_STATUS.USED,
    owner: userId,
    team: team || null,
    password_hash: passwordHash
  });

  if (success) {
    logToSend(userId, 'ALLOCATE', [nodeId], { team });
    logToAudit(userId, 'allocate_node', { node_id: nodeId, team });
  }

  return success;
};

const restartNode = async (nodeId, userId, password) => {
  const data = getAllData();
  const node = data.nodes.nodes.find(n => n.node_id === nodeId);

  if (!node) {
    throw new Error('Node not found');
  }

  if (node.owner !== userId) {
    throw new Error('Not authorized - incorrect user ID');
  }

  const isPasswordValid = await bcrypt.compare(password, node.password_hash);
  if (!isPasswordValid) {
    throw new Error('Not authorized - incorrect password');
  }

  logToSend(userId, 'RESTART', [nodeId], {});
  logToAudit(userId, 'restart_node', { node_id: nodeId });
};

const releaseNode = async (nodeId, userId, password) => {
  const data = getAllData();
  const node = data.nodes.nodes.find(n => n.node_id === nodeId);

  if (!node) {
    throw new Error('Node not found');
  }

  if (node.owner !== userId) {
    throw new Error('Not authorized - incorrect user ID');
  }

  const isPasswordValid = await bcrypt.compare(password, node.password_hash);
  if (!isPasswordValid) {
    throw new Error('Not authorized - incorrect password');
  }

  const success = await updateNode(nodeId, {
    status: NODE_STATUS.FREE,
    owner: null,
    team: null,
    password_hash: null
  });

  if (success) {
    logToSend(userId, 'RELEASE', [nodeId], {});
    logToAudit(userId, 'release_node', { node_id: nodeId });
  }

  return success;
};

const toggleExpandPermission = async (nodeId, userId, password, allowExpand) => {
  const data = getAllData();
  const node = data.nodes.nodes.find(n => n.node_id === nodeId);

  if (!node) {
    throw new Error('Node not found');
  }

  if (node.owner !== userId) {
    throw new Error('Not authorized - incorrect user ID');
  }

  const isPasswordValid = await bcrypt.compare(password, node.password_hash);
  if (!isPasswordValid) {
    throw new Error('Not authorized - incorrect password');
  }

  const success = await updateNode(nodeId, {
    allow_expand: allowExpand
  });

  if (success) {
    logToAudit(userId, 'toggle_expand', { node_id: nodeId, allow_expand: allowExpand });
  }

  return success;
};

const expandNodes = async (userId, password, nodeIds, team) => {
  const data = getAllData();
  const nodes = data.nodes.nodes.filter(n => nodeIds.includes(n.node_id));

  const allFree = nodes.every(n => n.status === NODE_STATUS.FREE);

  if (!allFree) {
    throw new Error('All nodes must be Free to expand');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const success = await updateNodes(nodeIds, {
    status: NODE_STATUS.USED,
    owner: userId,
    team: team || null,
    password_hash: passwordHash
  });

  if (success) {
    logToSend(userId, 'EXPAND', nodeIds, { team });
    logToAudit(userId, 'expand_nodes', { node_ids: nodeIds, team });
  }

  return success;
};

const callAdmin = (nodeId, userId, message) => {
  logToSend(userId, 'CALL_ADMIN', [nodeId], { message });
  logToAudit(userId, 'call_admin', { node_id: nodeId, message });
};

module.exports = {
  allocateNode,
  restartNode,
  releaseNode,
  toggleExpandPermission,
  expandNodes,
  callAdmin
};
