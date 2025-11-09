// 전역 변수
let allData = null;
let selectedClusterId = null;
let selectedNodes = new Set();
let autoRefreshEnabled = true;
let refreshIntervalSeconds = 30;
let refreshTimer = null;
let lastUpdated = null;
let selectedHostId = null; // 현재 선택 모드가 활성화된 호스트 ID

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadData();
  startAutoRefresh();
});

// 이벤트 리스너 설정
function setupEventListeners() {
  // 새로고침 버튼
  document.getElementById('refresh-btn').addEventListener('click', loadData);

  // 자동 갱신 토글
  document.getElementById('auto-refresh-toggle').addEventListener('click', () => {
    autoRefreshEnabled = !autoRefreshEnabled;
    const btn = document.getElementById('auto-refresh-toggle');
    btn.textContent = autoRefreshEnabled ? '자동 갱신 ON' : '자동 갱신 OFF';
    btn.classList.toggle('active', autoRefreshEnabled);
    btn.setAttribute('aria-pressed', autoRefreshEnabled);

    if (autoRefreshEnabled) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  });

  // 갱신 주기 선택
  document.getElementById('refresh-interval').addEventListener('change', (e) => {
    refreshIntervalSeconds = parseInt(e.target.value);
    if (autoRefreshEnabled) {
      stopAutoRefresh();
      startAutoRefresh();
    }
  });

  // 모달 닫기
  document.querySelector('.close').addEventListener('click', closeModal);

  window.addEventListener('click', (e) => {
    const modal = document.getElementById('node-modal');
    if (e.target === modal) {
      closeModal();
    }
  });

  // 확장 패널 버튼
  document.getElementById('execute-expand-btn').addEventListener('click', executeExpansion);
  document.getElementById('cancel-expand-btn').addEventListener('click', cancelExpansion);
}

// 선택 모드 토글 (호스트별)
function toggleSelectionMode(hostId) {
  if (selectedHostId === hostId) {
    // 같은 호스트 버튼을 다시 클릭하면 선택 모드 해제
    selectedHostId = null;
    selectedNodes.clear();
    updateExpandPanel();
  } else {
    // 다른 호스트 선택 또는 새로 선택 모드 활성화
    selectedHostId = hostId;
    selectedNodes.clear();
    updateExpandPanel();
  }

  renderHosts();
}

// 자동 갱신 시작
function startAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  refreshTimer = setInterval(() => {
    if (autoRefreshEnabled) {
      loadData(true); // silent refresh
    }
  }, refreshIntervalSeconds * 1000);
}

// 자동 갱신 중지
function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

// 마지막 업데이트 시간 포맷
function formatLastUpdated() {
  if (!lastUpdated) return '-';

  const now = new Date();
  const diff = Math.floor((now - lastUpdated) / 1000);

  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  return lastUpdated.toLocaleTimeString('ko-KR');
}

// 마지막 업데이트 시간 업데이트
function updateLastUpdatedDisplay() {
  document.getElementById('last-updated-time').textContent = formatLastUpdated();
}

// 데이터 로드
async function loadData(silent = false) {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    allData = await response.json();
    lastUpdated = new Date();
    updateLastUpdatedDisplay();

    // 첫 로딩 시 첫 번째 클러스터 자동 선택
    if (!selectedClusterId && allData.clusters.clusters.length > 0) {
      selectedClusterId = allData.clusters.clusters[0].id;
    }

    renderClusterButtons();
    renderClusterStats();
    renderHosts();

    // 에러 메시지 제거
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading data:', error);
    if (!silent) {
      showErrorMessage(error.message || 'Failed to load data');
    }
  }
}

// 에러 메시지 표시
function showErrorMessage(message) {
  let errorContainer = document.getElementById('error-container');

  if (!errorContainer) {
    // 에러 컨테이너 생성
    errorContainer = document.createElement('div');
    errorContainer.id = 'error-container';
    errorContainer.className = 'error-overlay';
    document.body.appendChild(errorContainer);
  }

  errorContainer.innerHTML = `
    <div class="error-dialog">
      <div class="error-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="error-content">
        <h2 class="error-title">오류 발생</h2>
        <p class="error-message">${message}</p>
      </div>
      <button class="error-retry-btn" onclick="retryLoadData()">다시 시도</button>
    </div>
  `;

  errorContainer.style.display = 'flex';
}

// 데이터 로드 재시도
function retryLoadData() {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.style.display = 'none';
  }
  loadData();
}

// 클러스터 버튼 렌더링
function renderClusterButtons() {
  const container = document.getElementById('cluster-buttons');
  container.innerHTML = '';

  allData.clusters.clusters.forEach(cluster => {
    const stats = getClusterStats(cluster.id);
    const button = document.createElement('button');
    const isActive = selectedClusterId === cluster.id;
    button.className = `cluster-btn ${isActive ? 'active' : ''}`;
    button.setAttribute('aria-pressed', isActive);
    button.setAttribute('aria-label', `${cluster.name} 클러스터 선택. ${stats.free}개 사용 가능, 총 ${stats.total}개`);
    button.innerHTML = `
      <span>${cluster.name}</span>
      <span class="cluster-info">(${stats.free}/${stats.total} free)</span>
    `;
    button.addEventListener('click', () => {
      // 클러스터 변경 시 선택 모드 해제
      if (selectedClusterId !== cluster.id) {
        selectedHostId = null;
        selectedNodes.clear();
        updateExpandPanel();
      }

      selectedClusterId = cluster.id;
      renderClusterButtons();
      renderClusterStats();
      renderHosts();
    });
    container.appendChild(button);
  });
}

// 클러스터별 통계 계산
function getClusterStats(clusterId) {
  const nodes = allData.nodes.nodes.filter(n => n.cluster_id === clusterId);

  return {
    total: nodes.length,
    free: nodes.filter(n => n.status === 'Free').length,
    used: nodes.filter(n => n.status === 'Used').length,
    error: nodes.filter(n => n.status === 'Error').length,
    reserved: nodes.filter(n => n.status === 'Reserved').length
  };
}

// 클러스터 통계 렌더링
function renderClusterStats() {
  if (!selectedClusterId) return;

  const container = document.getElementById('cluster-stats');
  const stats = getClusterStats(selectedClusterId);
  const total = stats.total;

  const freePercent = total ? (stats.free / total) * 100 : 0;
  const usedPercent = total ? (stats.used / total) * 100 : 0;
  const errorPercent = total ? (stats.error / total) * 100 : 0;

  const cluster = allData.clusters.clusters.find(c => c.id === selectedClusterId);
  const clusterName = cluster ? cluster.name : selectedClusterId;

  container.innerHTML = `
    <h2 class="stats-title">${clusterName} - GPU Overview</h2>

    <div class="stats-grid">
      <div class="stat-box total">
        <div class="stat-value total" aria-label="총 GPU ${total}개">${total}</div>
        <div class="stat-label">Total GPUs</div>
      </div>

      <div class="stat-box free">
        <div class="stat-value free" aria-label="사용 가능 GPU ${stats.free}개">${stats.free}</div>
        <div class="stat-label">Free</div>
      </div>

      <div class="stat-box used">
        <div class="stat-value used" aria-label="사용 중 GPU ${stats.used}개">${stats.used}</div>
        <div class="stat-label">In Use</div>
      </div>

      <div class="stat-box error">
        <div class="stat-value error" aria-label="오류 GPU ${stats.error}개">${stats.error}</div>
        <div class="stat-label">Error</div>
      </div>
    </div>

    <div class="stats-progress-bar" role="progressbar" aria-label="GPU 상태 분포" aria-valuenow="${stats.free}" aria-valuemin="0" aria-valuemax="${total}">
      <div class="progress-segment free" style="width: ${freePercent}%" title="Free: ${freePercent.toFixed(1)}%" aria-label="사용 가능 ${freePercent.toFixed(1)}%"></div>
      <div class="progress-segment used" style="width: ${usedPercent}%" title="Used: ${usedPercent.toFixed(1)}%" aria-label="사용 중 ${usedPercent.toFixed(1)}%"></div>
      <div class="progress-segment error" style="width: ${errorPercent}%" title="Error: ${errorPercent.toFixed(1)}%" aria-label="오류 ${errorPercent.toFixed(1)}%"></div>
    </div>
  `;
}

// 호스트 렌더링
function renderHosts() {
  if (!selectedClusterId) return;

  const container = document.getElementById('hosts-container');
  const nodes = allData.nodes.nodes.filter(n => n.cluster_id === selectedClusterId);

  if (nodes.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No nodes found for this cluster.</p>';
    return;
  }

  const cluster = allData.clusters.clusters.find(c => c.id === selectedClusterId);

  // host_id로 그룹화
  const hostGroups = {};
  nodes.forEach(node => {
    if (!hostGroups[node.host_id]) {
      hostGroups[node.host_id] = [];
    }
    hostGroups[node.host_id].push(node);
  });

  // host_id별로 정렬
  const sortedHostIds = Object.keys(hostGroups).sort();

  container.innerHTML = `
    <h2 class="hosts-title">${cluster.name} - Hosts</h2>
    ${sortedHostIds.map(hostId => createHostCard(hostId, hostGroups[hostId])).join('')}
  `;

  // 이벤트 리스너 추가
  nodes.forEach(node => {
    const gpuCard = document.getElementById(`gpu-${node.node_id}`);
    if (gpuCard) {
      gpuCard.addEventListener('click', (e) => {
        if (selectedHostId) {
          // 선택 모드: 현재 선택된 호스트의 Free GPU만 선택 가능
          if (node.status === 'Free' && node.host_id === selectedHostId) {
            toggleNodeSelection(node.node_id);
          }
        } else {
          // 일반 모드: Free GPU는 아무 동작 안 함, Used/Error만 모달 표시
          if (node.status !== 'Free') {
            showNodeModal(node);
          }
        }
      });
    }
  });
}

// 호스트 카드 생성
function createHostCard(hostId, gpus) {
  const freeGPUs = gpus.filter(g => g.status === 'Free').length;
  const totalGPUs = gpus.length;
  const hasError = gpus.some(g => g.status === 'Error');

  // gpu_index로 정렬
  const sortedGPUs = gpus.sort((a, b) => a.gpu_index - b.gpu_index);

  // 같은 owner/team을 가진 GPU 그룹 찾기
  const groups = [];
  let currentGroup = null;

  sortedGPUs.forEach((gpu, idx) => {
    const groupKey = gpu.status === 'Used' && gpu.owner && gpu.team
      ? `${gpu.owner}-${gpu.team}`
      : null;

    if (groupKey && currentGroup && currentGroup.key === groupKey) {
      // 현재 그룹에 추가
      currentGroup.gpus.push({ ...gpu, groupPosition: 'middle' });
    } else {
      // 이전 그룹 종료
      if (currentGroup && currentGroup.gpus.length > 0) {
        currentGroup.gpus[currentGroup.gpus.length - 1].groupPosition = 'last';
        groups.push(currentGroup);
      }

      // 새 그룹 시작
      if (groupKey) {
        currentGroup = {
          key: groupKey,
          gpus: [{ ...gpu, groupPosition: 'first' }]
        };
      } else {
        groups.push({ key: null, gpus: [{ ...gpu, groupPosition: null }] });
        currentGroup = null;
      }
    }
  });

  // 마지막 그룹 처리
  if (currentGroup && currentGroup.gpus.length > 0) {
    currentGroup.gpus[currentGroup.gpus.length - 1].groupPosition = 'last';
    groups.push(currentGroup);
  }

  // 그룹 정보를 포함한 GPU 배열 생성
  const gpusWithGroupInfo = [];
  groups.forEach(group => {
    group.gpus.forEach(gpu => {
      gpusWithGroupInfo.push(gpu);
    });
  });

  const isSelectionMode = selectedHostId === hostId;

  return `
    <article class="host-card" role="region" aria-label="${hostId} 호스트. ${freeGPUs}개 사용 가능, 총 ${totalGPUs}개 GPU">
      <div class="host-header">
        <div class="host-info">
          <h3 class="host-name">${hostId}</h3>
          <p class="host-hostname">${gpus[0].cluster_id} cluster</p>
          <p class="host-gpu-count">GPU: ${freeGPUs}/${totalGPUs} available</p>
        </div>
        <div class="host-header-actions">
          <button class="use-gpu-btn ${isSelectionMode ? 'active' : ''}"
                  onclick="toggleSelectionMode('${hostId}')"
                  aria-pressed="${isSelectionMode}"
                  aria-label="${isSelectionMode ? hostId + ' GPU 선택 취소' : hostId + ' GPU 사용 시작'}">
            ${isSelectionMode ? 'Cancel Selection' : 'Use GPU'}
          </button>
          <span class="host-status ${hasError ? 'offline' : 'online'}"
                role="status"
                aria-label="${hasError ? '오류 상태' : '온라인 상태'}">
            ${hasError ? 'Error' : 'Online'}
          </span>
        </div>
      </div>

      <div class="gpu-grid" role="list" aria-label="${hostId} GPU 목록">
        ${gpusWithGroupInfo.map(node => createGPUCard(node)).join('')}
      </div>
    </article>
  `;
}

// 개별 GPU 카드 생성
function createGPUCard(node) {
  const isSelected = selectedNodes.has(node.node_id);

  // 그룹 클래스 추가
  let groupClass = '';
  let groupAttr = '';
  if (node.groupPosition) {
    groupClass = `grouped-${node.groupPosition}`;
    groupAttr = `data-group="${node.owner}-${node.team}"`;
  }

  // 선택 모드일 때 해당 호스트의 Free GPU만 강조
  const isInSelectionMode = selectedHostId === node.host_id;
  const selectionModeClass = isInSelectionMode && node.status === 'Free' ? 'selection-mode' : '';

  // 툴팁 내용 생성
  const getTooltipContent = () => {
    let content = `
      <div class="tooltip-row">
        <span class="tooltip-label">GPU:</span>
        <span class="tooltip-value">${node.node_id}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Host:</span>
        <span class="tooltip-value">${node.host_id}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Cluster:</span>
        <span class="tooltip-value">${node.cluster_id}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Status:</span>
        <span class="tooltip-value">${node.status}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Model:</span>
        <span class="tooltip-value">${node.gpu_model}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Memory:</span>
        <span class="tooltip-value">${node.gpu_mem_gb}GB</span>
      </div>
    `;

    if (node.status === 'Used') {
      if (node.owner) {
        content += `
          <div class="tooltip-row">
            <span class="tooltip-label">Owner:</span>
            <span class="tooltip-value">${node.owner}</span>
          </div>
        `;
      }
      if (node.team) {
        content += `
          <div class="tooltip-row">
            <span class="tooltip-label">Team:</span>
            <span class="tooltip-value">${node.team}</span>
          </div>
        `;
      }
      if (node.allow_expand) {
        content += `
          <div class="tooltip-row">
            <span class="tooltip-label">Expansion:</span>
            <span class="tooltip-value">Allowed</span>
          </div>
        `;
      }
    }

    if (node.status === 'Error' && node.last_error) {
      content += `
        <div class="tooltip-row">
          <span class="tooltip-label">Error:</span>
          <span class="tooltip-value">${node.last_error}</span>
        </div>
      `;
    }

    return content;
  };

  const statusText = node.status === 'Free' ? '사용 가능' :
                     node.status === 'Used' ? `사용 중 (${node.owner || '소유자 없음'})` :
                     node.status === 'Error' ? '오류' : '예약됨';
  const ariaLabel = `GPU ${node.gpu_index}, ${node.gpu_model} ${node.gpu_mem_gb}GB, ${statusText}`;

  return `
    <div id="gpu-${node.node_id}"
         class="gpu-card status-${node.status} ${isSelected ? 'selected' : ''} ${groupClass} ${selectionModeClass}"
         ${groupAttr}
         tabindex="0"
         role="listitem"
         aria-label="${ariaLabel}">

      <!-- Tooltip -->
      <div class="tooltip">
        ${getTooltipContent()}
      </div>

      <div class="gpu-header">
        <span>GPU ${node.gpu_index}</span>
        ${getStatusIcon(node.status)}
      </div>

      ${node.status === 'Used' ? `
        <div class="gpu-details">
          <div class="gpu-detail-row">
            <span>Model:</span>
            <span>${node.gpu_model}</span>
          </div>
          <div class="gpu-detail-row">
            <span>Mem:</span>
            <span>${node.gpu_mem_gb}GB</span>
          </div>
          ${node.owner ? `<div class="gpu-owner">${node.owner}</div>` : ''}
        </div>
      ` : ''}

      ${node.status === 'Free' ? `
        <div class="gpu-available">${isInSelectionMode ? 'Click to Select' : 'Available'}</div>
      ` : ''}

      ${node.status === 'Error' ? `
        <div class="gpu-error-text">
          <div style="font-weight: bold;">ERROR</div>
          ${node.last_error ? `<div class="gpu-error-message">${node.last_error}</div>` : ''}
        </div>
      ` : ''}

      ${node.allow_expand && node.status === 'Used' ? `
        <div class="expansion-indicator" title="Expansion allowed"></div>
      ` : ''}
    </div>
  `;
}

// 상태 아이콘 SVG
function getStatusIcon(status) {
  const icons = {
    'Free': '<svg class="gpu-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>',
    'Used': '<svg class="gpu-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd" /></svg>',
    'Error': '<svg class="gpu-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>',
    'Reserved': '<svg class="gpu-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" /></svg>'
  };
  return icons[status] || '';
}

// 노드 선택 토글
function toggleNodeSelection(nodeId) {
  if (selectedNodes.has(nodeId)) {
    selectedNodes.delete(nodeId);
  } else {
    selectedNodes.add(nodeId);
  }

  updateExpandPanel();
  renderHosts(); // 다시 렌더링하여 선택 표시 업데이트
}

// 확장 패널 업데이트
function updateExpandPanel() {
  const panel = document.getElementById('expand-panel');
  const list = document.getElementById('selected-nodes-list');

  if (selectedNodes.size === 0) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  list.innerHTML = '';

  selectedNodes.forEach(nodeId => {
    const node = allData.nodes.nodes.find(n => n.node_id === nodeId);
    if (node) {
      const item = document.createElement('div');
      item.className = 'selected-node-item';
      item.innerHTML = `
        <span>${nodeId} (${node.status})</span>
        <span onclick="toggleNodeSelection('${nodeId}')">✕</span>
      `;
      list.appendChild(item);
    }
  });
}

// 확장 실행 - 모달로 변경
function executeExpansion() {
  if (selectedNodes.size === 0) {
    alert('Please select at least one GPU');
    return;
  }

  showAllocationModal();
}

// 할당 모달 표시
function showAllocationModal() {
  const modal = document.getElementById('node-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  title.textContent = `Allocate ${selectedNodes.size} GPU(s)`;

  const nodesList = Array.from(selectedNodes).map(nodeId => {
    const node = allData.nodes.nodes.find(n => n.node_id === nodeId);
    return `<li>${nodeId} (${node.gpu_model} ${node.gpu_mem_gb}GB)</li>`;
  }).join('');

  body.innerHTML = `
    <div class="info-section">
      <h3>Selected GPUs</h3>
      <ul style="margin-left: 1.5rem; color: #374151;">
        ${nodesList}
      </ul>
    </div>

    <div class="info-section">
      <h3>Allocation Information</h3>
      <form id="multi-allocate-form">
        <div class="form-group">
          <label>User ID:</label>
          <input type="text" id="multi-alloc-user-id" required>
        </div>
        <div class="form-group">
          <label>Password:</label>
          <input type="password" id="multi-alloc-password" required>
        </div>
        <div class="form-group">
          <label>Team:</label>
          <input type="text" id="multi-alloc-team" required>
        </div>
        <div class="action-buttons">
          <button type="submit" class="btn btn-primary">Allocate All</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
      </form>
      <div id="multi-alloc-message"></div>
    </div>
  `;

  modal.style.display = 'block';

  // 폼 제출 이벤트
  document.getElementById('multi-allocate-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = document.getElementById('multi-alloc-user-id').value.trim();
    const password = document.getElementById('multi-alloc-password').value;
    const team = document.getElementById('multi-alloc-team').value.trim();
    const messageDiv = document.getElementById('multi-alloc-message');

    console.log('Allocating GPUs:', {
      userId,
      team,
      nodeCount: selectedNodes.size,
      nodes: Array.from(selectedNodes)
    });

    if (!userId || !password) {
      messageDiv.innerHTML = '<div class="error-message">Please enter User ID and Password</div>';
      return;
    }

    try {
      // 각 GPU를 개별적으로 할당
      const allocations = Array.from(selectedNodes).map(async (nodeId) => {
        console.log(`Allocating ${nodeId} to ${userId}...`);
        const response = await fetch(`/api/nodes/${nodeId}/allocate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, password, team })
        });
        const result = await response.json();
        console.log(`Result for ${nodeId}:`, result);
        return result;
      });

      const results = await Promise.all(allocations);
      const allSuccess = results.every(r => r.success);

      if (allSuccess) {
        messageDiv.innerHTML = '<div class="success-message">All GPUs allocated successfully!</div>';
        setTimeout(() => {
          closeModal();
          selectedNodes.clear();
          updateExpandPanel();
          selectedHostId = null;
          loadData();
        }, 1500);
      } else {
        const errors = results.filter(r => !r.success).map(r => r.error).join(', ');
        messageDiv.innerHTML = `<div class="error-message">Some allocations failed: ${errors}</div>`;
      }
    } catch (error) {
      console.error('Allocation error:', error);
      messageDiv.innerHTML = '<div class="error-message">Failed to allocate GPUs</div>';
    }
  });
}

// 확장 취소
function cancelExpansion() {
  selectedNodes.clear();
  updateExpandPanel();
  renderHosts();
}

// 노드 모달 표시
function showNodeModal(node) {
  const modal = document.getElementById('node-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  title.textContent = `GPU: ${node.node_id}`;

  const cluster = allData.clusters.clusters.find(c => c.id === node.cluster_id);

  let content = `
    <div class="info-section">
      <h3>GPU Information</h3>
      <p><strong>Host:</strong> ${node.host_id}</p>
      <p><strong>Cluster:</strong> ${cluster ? cluster.name : node.cluster_id}</p>
      <p><strong>GPU Index:</strong> ${node.gpu_index}</p>
      <p><strong>Model:</strong> ${node.gpu_model}</p>
      <p><strong>Memory:</strong> ${node.gpu_mem_gb}GB</p>
      <p><strong>Status:</strong> ${node.status}</p>
      ${node.owner ? `<p><strong>Owner:</strong> ${node.owner}</p>` : ''}
      ${node.team ? `<p><strong>Team:</strong> ${node.team}</p>` : ''}
      ${node.bmc_ip ? `<p><strong>BMC IP:</strong> ${node.bmc_ip}</p>` : ''}
      <p><strong>Expand Permission:</strong> ${node.allow_expand ? 'Yes' : 'No'}</p>
    </div>
  `;

  if (node.status === 'Free') {
    content += createFreeNodeActions(node);
  } else if (node.status === 'Used') {
    content += createUsedNodeActions(node, cluster);
  } else if (node.status === 'Error') {
    content += createErrorNodeActions(node);
  }

  body.innerHTML = content;
  modal.style.display = 'block';

  // 폼 제출 이벤트 설정
  setupModalEventListeners(node, cluster);
}

// Free 노드 액션
function createFreeNodeActions(node) {
  return `
    <div class="info-section">
      <h3>Allocate GPU</h3>
      <form id="allocate-form">
        <div class="form-group">
          <label>User ID:</label>
          <input type="text" id="alloc-user-id" required>
        </div>
        <div class="form-group">
          <label>Password:</label>
          <input type="password" id="alloc-password" required>
        </div>
        <div class="form-group">
          <label>Team (optional):</label>
          <input type="text" id="alloc-team">
        </div>
        <div class="action-buttons">
          <button type="submit" class="btn btn-primary">Allocate GPU</button>
        </div>
      </form>
      <div id="alloc-message"></div>
    </div>
  `;
}

// Used 노드 액션
function createUsedNodeActions(node, cluster) {
  const notebookUrl = cluster && cluster.notebook_url_template
    ? cluster.notebook_url_template.replace('{node_id}', node.host_id)
    : '';

  return `
    <div class="info-section">
      <h3>GPU Actions</h3>
      <form id="node-action-form">
        <div class="form-group">
          <label>User ID:</label>
          <input type="text" id="action-user-id" required>
        </div>
        <div class="form-group">
          <label>Password:</label>
          <input type="password" id="action-password" required>
        </div>
        <div class="action-buttons">
          ${notebookUrl ? `<button type="button" class="btn btn-success" onclick="openNotebook('${notebookUrl}')">Open Notebook (${node.host_id})</button>` : ''}
          <button type="button" class="btn btn-secondary" onclick="releaseNode('${node.node_id}')">Release GPU</button>
          <button type="button" class="btn btn-primary" onclick="toggleExpand('${node.node_id}', ${!node.allow_expand})">
            ${node.allow_expand ? 'Disable Expand' : 'Enable Expand'}
          </button>
        </div>
      </form>
      <div id="action-message"></div>
    </div>
  `;
}

// Error 노드 액션
function createErrorNodeActions(node) {
  return `
    <div class="info-section">
      <h3>Error Information</h3>
      <p>${node.last_error || 'No error details available'}</p>
      <form id="error-form">
        <div class="form-group">
          <label>Your User ID:</label>
          <input type="text" id="error-user-id" required>
        </div>
        <div class="form-group">
          <label>Message to Admin:</label>
          <input type="text" id="error-message" placeholder="Describe the issue...">
        </div>
        <div class="action-buttons">
          <button type="submit" class="btn btn-danger">Call Admin</button>
        </div>
      </form>
      <div id="error-response"></div>
    </div>
  `;
}

// 모달 이벤트 리스너 설정
function setupModalEventListeners(node, cluster) {
  // Allocate 폼
  const allocForm = document.getElementById('allocate-form');
  if (allocForm) {
    allocForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const userId = document.getElementById('alloc-user-id').value;
      const password = document.getElementById('alloc-password').value;
      const team = document.getElementById('alloc-team').value;
      const messageDiv = document.getElementById('alloc-message');

      try {
        const response = await fetch(`/api/nodes/${node.node_id}/allocate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, password, team })
        });

        const result = await response.json();

        if (result.success) {
          messageDiv.innerHTML = '<div class="success-message">GPU allocated successfully!</div>';
          setTimeout(() => {
            closeModal();
            loadData();
          }, 1500);
        } else {
          messageDiv.innerHTML = `<div class="error-message">${result.error}</div>`;
        }
      } catch (error) {
        messageDiv.innerHTML = '<div class="error-message">Failed to allocate GPU</div>';
      }
    });
  }

  // Error 폼
  const errorForm = document.getElementById('error-form');
  if (errorForm) {
    errorForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const userId = document.getElementById('error-user-id').value;
      const message = document.getElementById('error-message').value;
      const messageDiv = document.getElementById('error-response');

      try {
        const response = await fetch(`/api/nodes/${node.node_id}/call-admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, message })
        });

        const result = await response.json();

        if (result.success) {
          messageDiv.innerHTML = '<div class="success-message">Admin has been notified</div>';
        } else {
          messageDiv.innerHTML = `<div class="error-message">${result.error}</div>`;
        }
      } catch (error) {
        messageDiv.innerHTML = '<div class="error-message">Failed to notify admin</div>';
      }
    });
  }
}

// 노트북 열기
function openNotebook(url) {
  window.open(url, '_blank');
}

// 노드 재시작
async function restartNode(nodeId) {
  const userId = document.getElementById('action-user-id').value;
  const password = document.getElementById('action-password').value;
  const messageDiv = document.getElementById('action-message');

  if (!userId || !password) {
    messageDiv.innerHTML = '<div class="error-message">Please enter User ID and Password</div>';
    return;
  }

  try {
    const response = await fetch(`/api/nodes/${nodeId}/restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password })
    });

    const result = await response.json();

    if (result.success) {
      messageDiv.innerHTML = '<div class="success-message">Restart command sent successfully</div>';
    } else {
      messageDiv.innerHTML = `<div class="error-message">${result.error}</div>`;
    }
  } catch (error) {
    messageDiv.innerHTML = '<div class="error-message">Failed to send restart command</div>';
  }
}

// 노드 해제
async function releaseNode(nodeId) {
  const userId = document.getElementById('action-user-id').value;
  const password = document.getElementById('action-password').value;
  const messageDiv = document.getElementById('action-message');

  if (!userId || !password) {
    messageDiv.innerHTML = '<div class="error-message">Please enter User ID and Password</div>';
    return;
  }

  if (!confirm('Are you sure you want to release this GPU?')) return;

  try {
    const response = await fetch(`/api/nodes/${nodeId}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password })
    });

    const result = await response.json();

    if (result.success) {
      messageDiv.innerHTML = '<div class="success-message">GPU released successfully</div>';
      setTimeout(() => {
        closeModal();
        loadData();
      }, 1500);
    } else {
      messageDiv.innerHTML = `<div class="error-message">${result.error}</div>`;
    }
  } catch (error) {
    messageDiv.innerHTML = '<div class="error-message">Failed to release GPU</div>';
  }
}

// 확장 허가 토글
async function toggleExpand(nodeId, allowExpand) {
  const userId = document.getElementById('action-user-id').value;
  const password = document.getElementById('action-password').value;
  const messageDiv = document.getElementById('action-message');

  if (!userId || !password) {
    messageDiv.innerHTML = '<div class="error-message">Please enter User ID and Password</div>';
    return;
  }

  try {
    const response = await fetch(`/api/nodes/${nodeId}/toggle-expand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password, allowExpand })
    });

    const result = await response.json();

    if (result.success) {
      messageDiv.innerHTML = '<div class="success-message">Expand permission updated</div>';
      setTimeout(() => {
        closeModal();
        loadData();
      }, 1500);
    } else {
      messageDiv.innerHTML = `<div class="error-message">${result.error}</div>`;
    }
  } catch (error) {
    messageDiv.innerHTML = '<div class="error-message">Failed to update expand permission</div>';
  }
}

// 모달 닫기
function closeModal() {
  document.getElementById('node-modal').style.display = 'none';
}

// 1초마다 마지막 업데이트 시간 업데이트
setInterval(updateLastUpdatedDisplay, 1000);
