const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { lock, unlock } = require('proper-lockfile');

const DATA_DIR = path.join(__dirname, '../../data');
const YAML_FILES = ['clusters.yaml', 'nodes.yaml', 'users.yaml', 'policies.yaml'];

let cache = {};

// Function to load all YAML files into the cache
async function loadData() {
    console.log('Loading all YAML data into cache...');
    const data = {};
    for (const filename of YAML_FILES) {
        try {
            const filePath = path.join(DATA_DIR, filename);
            const fileContents = await fs.promises.readFile(filePath, 'utf8');
            const key = filename.split('.')[0];
            data[key] = yaml.load(fileContents);
        } catch (e) {
            console.error(`Error loading ${filename}:`, e);
            data[filename.split('.')[0]] = null;
        }
    }
    cache = data;
    console.log('Data loaded into cache.');
}

// Function to get all data from the cache
function getAllData() {
    return cache;
}

// Function to save a specific YAML file with locking
async function saveData(key, data) {
    const filename = `${key}.yaml`;
    const filePath = path.join(DATA_DIR, filename);
    let release;
    try {
        release = await lock(filePath, { retries: 5 });
        const yamlStr = yaml.dump(data, { indent: 2 });
        await fs.promises.writeFile(filePath, yamlStr, 'utf8');
    } catch (e) {
        console.error(`Error saving ${filename}:`, e);
        return false;
    } finally {
        if (release) {
            await release();
        }
    }
    return true;
}

// Function to update a single node and save
async function updateNode(nodeId, updates) {
    if (!cache.nodes || !cache.nodes.nodes) return false;

    const originalNodes = JSON.parse(JSON.stringify(cache.nodes));
    const nodeIndex = cache.nodes.nodes.findIndex(n => n.node_id === nodeId);
    if (nodeIndex === -1) return false;

    cache.nodes.nodes[nodeIndex] = { ...cache.nodes.nodes[nodeIndex], ...updates };

    const success = await saveData('nodes', cache.nodes);
    if (!success) {
        // If save fails, revert cache to original state
        cache.nodes = originalNodes;
    }
    return success;
}

// Function to update multiple nodes and save
async function updateNodes(nodeIds, updates) {
    if (!cache.nodes || !cache.nodes.nodes) return false;

    const originalNodes = JSON.parse(JSON.stringify(cache.nodes));

    nodeIds.forEach(nodeId => {
        const nodeIndex = cache.nodes.nodes.findIndex(n => n.node_id === nodeId);
        if (nodeIndex !== -1) {
            cache.nodes.nodes[nodeIndex] = { ...cache.nodes.nodes[nodeIndex], ...updates };
        }
    });

    const success = await saveData('nodes', cache.nodes);
    if (!success) {
        // If save fails, revert cache
        cache.nodes = originalNodes;
    }
    return success;
}

module.exports = {
    getAllData,
    updateNode,
    updateNodes,
    loadData, // also export for server startup
    // Expose for testing
    _getCache: () => cache
};
