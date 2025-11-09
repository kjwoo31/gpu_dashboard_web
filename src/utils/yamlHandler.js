const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '../../data');

// YAML 파일 읽기
function loadYaml(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContents);
  } catch (e) {
    console.error(`Error loading ${filename}:`, e);
    return null;
  }
}

// YAML 파일 저장 (파일 락 고려)
function saveYaml(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const yamlStr = yaml.dump(data, { indent: 2 });
    fs.writeFileSync(filePath, yamlStr, 'utf8');
    return true;
  } catch (e) {
    console.error(`Error saving ${filename}:`, e);
    return false;
  }
}

// 모든 데이터 로드
function loadAllData() {
  return {
    clusters: loadYaml('clusters.yaml'),
    nodes: loadYaml('nodes.yaml'),
    users: loadYaml('users.yaml'),
    policies: loadYaml('policies.yaml')
  };
}

// 노드 업데이트
function updateNode(nodeId, updates) {
  const data = loadYaml('nodes.yaml');
  if (!data || !data.nodes) return false;

  const nodeIndex = data.nodes.findIndex(n => n.node_id === nodeId);
  if (nodeIndex === -1) return false;

  data.nodes[nodeIndex] = { ...data.nodes[nodeIndex], ...updates };
  return saveYaml('nodes.yaml', data);
}

// 여러 노드 업데이트
function updateNodes(nodeIds, updates) {
  const data = loadYaml('nodes.yaml');
  if (!data || !data.nodes) return false;

  nodeIds.forEach(nodeId => {
    const nodeIndex = data.nodes.findIndex(n => n.node_id === nodeId);
    if (nodeIndex !== -1) {
      data.nodes[nodeIndex] = { ...data.nodes[nodeIndex], ...updates };
    }
  });

  return saveYaml('nodes.yaml', data);
}

module.exports = {
  loadYaml,
  saveYaml,
  loadAllData,
  updateNode,
  updateNodes
};
