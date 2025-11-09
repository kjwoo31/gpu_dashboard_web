const express = require('express');
const router = express.Router();
const { getAllData } = require('../utils/dataService');
const {
  allocateNode,
  restartNode,
  releaseNode,
  toggleExpandPermission,
  expandNodes,
  callAdmin
} = require('../services/nodeService');

// Get all data
router.get('/data', (req, res) => {
  const data = getAllData();
  res.json(data);
});

// Allocate node (Free -> Used)
router.post('/nodes/:nodeId/allocate', async (req, res) => {
  const { nodeId } = req.params;
  const { userId, password, team } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

  try {
    const success = await allocateNode(nodeId, userId, password, team);
    if (success) {
      res.json({ success: true, message: 'Node allocated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to allocate node' });
    }
  } catch (error) {
    if (error.message === 'Node not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Node is not available') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Restart node
router.post('/nodes/:nodeId/restart', async (req, res) => {
  const { nodeId } = req.params;
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

  try {
    await restartNode(nodeId, userId, password);
    res.json({ success: true, message: 'Restart command logged' });
  } catch (error) {
    if (error.message === 'Node not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.startsWith('Not authorized')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Release node (Used -> Free)
router.post('/nodes/:nodeId/release', async (req, res) => {
  const { nodeId } = req.params;
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

  try {
    const success = await releaseNode(nodeId, userId, password);
    if (success) {
      res.json({ success: true, message: 'Node released successfully' });
    } else {
      res.status(500).json({ error: 'Failed to release node' });
    }
  } catch (error) {
    if (error.message === 'Node not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.startsWith('Not authorized')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Toggle expand permission
router.post('/nodes/:nodeId/toggle-expand', async (req, res) => {
  const { nodeId } = req.params;
  const { userId, password, allowExpand } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

  try {
    const success = await toggleExpandPermission(nodeId, userId, password, allowExpand);
    if (success) {
      res.json({ success: true, message: 'Expand permission updated' });
    } else {
      res.status(500).json({ error: 'Failed to update expand permission' });
    }
  } catch (error) {
    if (error.message === 'Node not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.startsWith('Not authorized')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Expand nodes (allocate multiple nodes)
router.post('/nodes/expand', async (req, res) => {
  const { userId, password, nodeIds, team } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

  try {
    const success = await expandNodes(userId, password, nodeIds, team);
    if (success) {
      res.json({ success: true, message: 'Nodes expanded successfully' });
    } else {
      res.status(500).json({ error: 'Failed to expand nodes' });
    }
  } catch (error) {
    if (error.message === 'All nodes must be Free to expand') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Call admin (for nodes in Error state)
router.post('/nodes/:nodeId/call-admin', (req, res) => {
  const { nodeId } = req.params;
  const { userId, message } = req.body;

  try {
    callAdmin(nodeId, userId, message);
    res.json({ success: true, message: 'Admin has been notified' });
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

module.exports = router;
