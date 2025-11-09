const fs = require('fs');
const yaml = require('js-yaml');
const { lock, unlock } = require('proper-lockfile');
const { getAllData, loadData, updateNode, updateNodes, _getCache } = require('../src/utils/dataService');

// Mock the file system
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
    },
}));

jest.mock('proper-lockfile', () => ({
    lock: jest.fn().mockResolvedValue(() => {}), // Returns a mock release function
    unlock: jest.fn().mockResolvedValue(),
}));

// Mock data
const mockNodes = {
    nodes: [
        { node_id: 'az-01-gpu-0', status: 'Free' },
        { node_id: 'az-01-gpu-1', status: 'Used', owner: 'user1' },
    ],
};

const mockClusters = {
    clusters: [
        { id: 'azure', name: 'Azure Cluster' }
    ]
}

describe('dataService', () => {
    beforeEach(() => {
        // Reset mocks before each test
        fs.promises.readFile.mockReset();
        fs.promises.writeFile.mockReset();
        lock.mockClear();
        unlock.mockClear();

        // Setup mock implementations
        fs.promises.readFile.mockImplementation(filePath => {
            if (filePath.endsWith('nodes.yaml')) {
                return Promise.resolve(yaml.dump(mockNodes));
            }
            if (filePath.endsWith('clusters.yaml')) {
                return Promise.resolve(yaml.dump(mockClusters));
            }
            return Promise.resolve('');
        });
    });

    // Test 1: Load data into cache
    test('should load data from YAML files into cache', async () => {
        await loadData();
        const cache = _getCache();
        expect(cache.nodes).toEqual(mockNodes);
        expect(cache.clusters).toEqual(mockClusters);
        expect(fs.promises.readFile).toHaveBeenCalledTimes(4); // clusters, nodes, users, policies
    });

    // Test 2: Update a single node
    test('should update a single node and save to file', async () => {
        await loadData(); // ensure cache is fresh
        const nodeId = 'az-01-gpu-0';
        const updates = { status: 'Used', owner: 'test-user' };

        const success = await updateNode(nodeId, updates);
        expect(success).toBe(true);

        const cache = _getCache();
        const updatedNode = cache.nodes.nodes.find(n => n.node_id === nodeId);
        expect(updatedNode.status).toBe('Used');
        expect(updatedNode.owner).toBe('test-user');

        // Verify file was written
        expect(fs.promises.writeFile).toHaveBeenCalledTimes(1);
        expect(lock).toHaveBeenCalledTimes(1);
    });

    // Test 3: Update multiple nodes
    test('should update multiple nodes and save to file', async () => {
        await loadData();
        const nodeIds = ['az-01-gpu-0', 'az-01-gpu-1'];
        const updates = { status: 'Free', owner: null };

        const success = await updateNodes(nodeIds, updates);
        expect(success).toBe(true);

        const cache = _getCache();
        const updatedNodes = cache.nodes.nodes.filter(n => nodeIds.includes(n.node_id));
        expect(updatedNodes[0].status).toBe('Free');
        expect(updatedNodes[1].status).toBe('Free');
        expect(fs.promises.writeFile).toHaveBeenCalledTimes(1);
        expect(lock).toHaveBeenCalledTimes(1);
    });

    // Test 4: Revert cache on save failure
    test('should revert cache if file save fails', async () => {
        await loadData();
        const nodeId = 'az-01-gpu-0';

        // Suppress console.error for this test because an error is expected
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Mock fs.promises.writeFile to throw an error
        fs.promises.writeFile.mockRejectedValueOnce(new Error('Save failed'));

        const success = await updateNode(nodeId, { status: 'Error' });
        expect(success).toBe(false);

        const cache = _getCache();
        const revertedNode = cache.nodes.nodes.find(n => n.node_id === nodeId);
        expect(revertedNode.status).not.toBe('Error');

        // Restore console.error
        consoleErrorSpy.mockRestore();
    });
});
