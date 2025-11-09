const express = require('express');
const router = express.Router();
const { loadAllData, updateNode, updateNodes } = require('../utils/yamlHandler');
const { authenticateUser, verifyNodeOwner, isAdmin } = require('../utils/auth');
const { logToSend, logToAudit } = require('../utils/logger');

// 전체 데이터 조회
router.get('/data', (req, res) => {
  const data = loadAllData();
  res.json(data);
});

// 노드 할당 (Free -> Used)
router.post('/nodes/:nodeId/allocate', async (req, res) => {
  const { nodeId } = req.params;
  const { userId, password, team } = req.body;

  // 입력 검증
  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

  // 노드 상태 확인
  const data = loadAllData();
  const node = data.nodes.nodes.find(n => n.node_id === nodeId);

  if (!node) {
    return res.status(404).json({ error: 'Node not found' });
  }

  if (node.status !== 'Free') {
    return res.status(400).json({ error: 'Node is not available' });
  }

  // 노드 할당 - userId와 password를 저장
  const success = updateNode(nodeId, {
    status: 'Used',
    owner: userId,
    team: team || null,
    password_hash: password  // 비밀번호를 평문으로 저장 (실제로는 해시화 권장)
  });

  if (success) {
    logToSend(userId, 'ALLOCATE', [nodeId], { team });
    logToAudit(userId, 'allocate_node', { node_id: nodeId, team });
    res.json({ success: true, message: 'Node allocated successfully' });
  } else {
    res.status(500).json({ error: 'Failed to allocate node' });
  }
});

// 노드 재시작
router.post('/nodes/:nodeId/restart', async (req, res) => {
  const { nodeId } = req.params;
  const { userId, password } = req.body;

  // 입력 검증
  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

  // 노드 확인
  const data = loadAllData();
  const node = data.nodes.nodes.find(n => n.node_id === nodeId);

  if (!node) {
    return res.status(404).json({ error: 'Node not found' });
  }

  // 소유자와 비밀번호 확인
  if (node.owner !== userId) {
    return res.status(403).json({ error: 'Not authorized - incorrect user ID' });
  }

  if (node.password_hash !== password) {
    return res.status(403).json({ error: 'Not authorized - incorrect password' });
  }

  // 재시작 명령 로그
  logToSend(userId, 'RESTART', [nodeId], {});
  logToAudit(userId, 'restart_node', { node_id: nodeId });

  res.json({ success: true, message: 'Restart command logged' });
});

// 노드 해제 (Used -> Free)
router.post('/nodes/:nodeId/release', async (req, res) => {
  const { nodeId } = req.params;
  const { userId, password } = req.body;

  // 입력 검증
  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

  // 노드 확인
  const data = loadAllData();
  const node = data.nodes.nodes.find(n => n.node_id === nodeId);

  if (!node) {
    return res.status(404).json({ error: 'Node not found' });
  }

  // 소유자와 비밀번호 확인
  if (node.owner !== userId) {
    return res.status(403).json({ error: 'Not authorized - incorrect user ID' });
  }

  if (node.password_hash !== password) {
    return res.status(403).json({ error: 'Not authorized - incorrect password' });
  }

  // 노드 해제
  const success = updateNode(nodeId, {
    status: 'Free',
    owner: null,
    team: null,
    password_hash: null
  });

  if (success) {
    logToSend(userId, 'RELEASE', [nodeId], {});
    logToAudit(userId, 'release_node', { node_id: nodeId });
    res.json({ success: true, message: 'Node released successfully' });
  } else {
    res.status(500).json({ error: 'Failed to release node' });
  }
});

// 확장 허가 토글
router.post('/nodes/:nodeId/toggle-expand', async (req, res) => {
  const { nodeId } = req.params;
  const { userId, password, allowExpand } = req.body;

  // 입력 검증
  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

  // 노드 확인
  const data = loadAllData();
  const node = data.nodes.nodes.find(n => n.node_id === nodeId);

  if (!node) {
    return res.status(404).json({ error: 'Node not found' });
  }

  // 소유자와 비밀번호 확인
  if (node.owner !== userId) {
    return res.status(403).json({ error: 'Not authorized - incorrect user ID' });
  }

  if (node.password_hash !== password) {
    return res.status(403).json({ error: 'Not authorized - incorrect password' });
  }

  // 확장 허가 토글
  const success = updateNode(nodeId, {
    allow_expand: allowExpand
  });

  if (success) {
    logToAudit(userId, 'toggle_expand', { node_id: nodeId, allow_expand: allowExpand });
    res.json({ success: true, message: 'Expand permission updated' });
  } else {
    res.status(500).json({ error: 'Failed to update expand permission' });
  }
});

// 노드 확장 (다중 노드 할당)
router.post('/nodes/expand', async (req, res) => {
  const { userId, password, nodeIds, team } = req.body;

  // 입력 검증
  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

  // 노드 상태 확인
  const data = loadAllData();
  const nodes = data.nodes.nodes.filter(n => nodeIds.includes(n.node_id));

  // 모든 노드가 Free인지 확인
  const allFree = nodes.every(n => n.status === 'Free');

  if (!allFree) {
    return res.status(400).json({ error: 'All nodes must be Free to expand' });
  }

  // 확장 실행 - 모든 노드에 같은 userId, password, team 설정
  const success = updateNodes(nodeIds, {
    status: 'Used',
    owner: userId,
    team: team || null,
    password_hash: password
  });

  if (success) {
    logToSend(userId, 'EXPAND', nodeIds, { team });
    logToAudit(userId, 'expand_nodes', { node_ids: nodeIds, team });
    res.json({ success: true, message: 'Nodes expanded successfully' });
  } else {
    res.status(500).json({ error: 'Failed to expand nodes' });
  }
});

// 관리자 호출 (Error 노드)
router.post('/nodes/:nodeId/call-admin', async (req, res) => {
  const { nodeId } = req.params;
  const { userId, message } = req.body;

  logToSend(userId, 'CALL_ADMIN', [nodeId], { message });
  logToAudit(userId, 'call_admin', { node_id: nodeId, message });

  res.json({ success: true, message: 'Admin has been notified' });
});

module.exports = router;
