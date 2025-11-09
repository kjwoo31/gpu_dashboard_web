const bcrypt = require('bcrypt');
const { getAllData } = require('./dataService');

// 사용자 인증
async function authenticateUser(userId, password) {
  const { users: usersData } = getAllData();
  if (!usersData || !usersData.users) return null;

  const user = usersData.users.find(u => u.id === userId);
  if (!user) return null;

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return null;

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    contact: user.contact
  };
}

// 노드 소유자 확인
function verifyNodeOwner(nodeId, userId) {
  const { nodes: nodesData } = getAllData();
  if (!nodesData || !nodesData.nodes) return false;

  const node = nodesData.nodes.find(n => n.node_id === nodeId);
  if (!node) return false;

  return node.owner === userId;
}

// 관리자 권한 확인
function isAdmin(userId) {
  const { users: usersData } = getAllData();
  if (!usersData || !usersData.users) return false;

  const user = usersData.users.find(u => u.id === userId);
  return user && user.role === 'admin';
}

module.exports = {
  authenticateUser,
  verifyNodeOwner,
  isAdmin
};
