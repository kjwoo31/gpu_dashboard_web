# GPU Control Hub — 제작 Tasks (완료 상태)

> 목적: Azure/On‑prem GPU 노드의 **모니터링 / 할당 / 확장 / 재시작 / 예약**을 **외부 API 없이** YAML 상태 파일과 `send.log`를 통해 제어하는 단일 웹앱

---

## 프로젝트 완료 현황

### ✅ 구현 완료된 기능

#### 0) 리포지토리/폴더 구조 초기화
- [x] `repo init`
- [x] 폴더 생성 (`/data`, `/logs`, `/public`, `/src`, `/scripts`)
- [x] 초기 파일 생성 (clusters.yaml, nodes.yaml, users.yaml, policies.yaml, logs)

#### 1) 데이터 모델 (YAML 설정)

**중요 변경사항: 개별 GPU 단위 관리로 변경**

- [x] **clusters.yaml**: 클러스터 정의 (Azure, On-prem 등)
- [x] **nodes.yaml**: **개별 GPU 노드** 정의 (32개 GPU = 4 hosts × 8 GPUs)
  - `node_id`: 개별 GPU 식별자 (예: az-01-gpu-0, az-01-gpu-1)
  - `host_id`: 물리적 서버 그룹핑 (예: az-01, az-02)
  - `gpu_index`: 호스트 내 GPU 인덱스 (0-7)
  - `cluster_id`: 클러스터 소속
  - `status`: Free/Used/Error/Reserved
  - `owner`, `team`: 현재 사용자 정보
  - `password_hash`: **GPU별 독립 비밀번호** (할당 시 저장)
  - `allow_expand`: 확장 허가 여부
- [x] **users.yaml**: 사용자 정의 (현재는 참조용, 인증에 사용 안 함)
- [x] **policies.yaml**: UI 색상, 제한, 로깅 설정

#### 2) 인증 시스템 (Per-GPU 방식)

**중요: 사전 정의된 사용자 계정을 사용하지 않음**

- [x] GPU 할당 시:
  - User ID, Password, Team을 자유롭게 입력
  - 입력한 정보가 해당 GPU에 저장됨
  - 각 GPU마다 서로 다른 User ID/Password 설정 가능

- [x] GPU 해제/관리 시:
  - 할당할 때 입력했던 **정확한** User ID와 Password 필요
  - 일치하지 않으면 작업 불가

#### 3) UI/UX 구현

- [x] **메인 그리드**:
  - 클러스터 선택 버튼 (상단)
  - 호스트별 카드 표시
  - 각 호스트당 8개 GPU 카드 (8열 그리드)
  - 상태별 색상: Green (Free), Blue (Used), Red (Error)
  - 같은 owner/team GPU 시각적 그룹화

- [x] **호스트별 "Use GPU" 버튼**:
  - 클러스터 단위가 아닌 **호스트(PC)별** GPU 선택 모드
  - 선택 모드에서는 해당 호스트의 Free GPU만 클릭 가능
  - 다중 GPU 선택 가능 (Ctrl+클릭 불필요)

- [x] **툴팁 (Hover)**:
  - 마우스 오버 시 GPU 상세 정보 표시
  - GPU ID, 호스트, 클러스터, 상태, 모델, 메모리
  - Used GPU: Owner, Team, 확장 허가 여부 추가 표시
  - Error GPU: 에러 메시지 표시
  - 순수 CSS 구현 (JavaScript 불필요)
  - 화면 경계 감지 자동 조정

- [x] **클릭 모달**:
  - **Free GPU**: 일반 모드에서 클릭 시 아무 반응 없음 (Use GPU 버튼 사용)
  - **Used GPU**: 비밀번호 입력 → [Open Notebook] [Release GPU] [Enable/Disable Expand]
  - **Error GPU**: 에러 로그 표시 + [Call Admin]

- [x] **다중 GPU 할당**:
  - 호스트 "Use GPU" 버튼 클릭
  - Free GPU 여러 개 클릭하여 선택
  - 오른쪽 하단 확장 패널에서 "Allocate Selected GPUs"
  - User ID, Password, Team 입력 후 일괄 할당

#### 4) UI 개선 사항 (v0 비교 후 추가)

- [x] **진행률 바 개선**:
  - 각 세그먼트에 퍼센트 툴팁 표시
  - ARIA progressbar 역할 및 속성 추가

- [x] **에러 처리 UI**:
  - 모달 형태의 에러 오버레이
  - "다시 시도" 버튼으로 재시도 기능
  - SVG 아이콘과 명확한 에러 메시지

- [x] **반응형 디자인**:
  - 모바일 우선 접근 방식
  - 640px, 1024px 브레이크포인트
  - 통계 그리드: 모바일 2열 → 데스크탑 4열
  - GPU 그리드: 모바일 4열 → 데스크탑 8열
  - 버튼, 폰트 크기 반응형 조정

- [x] **접근성 (ARIA)**:
  - 모든 인터랙티브 요소에 aria-label 추가
  - 버튼에 aria-pressed 상태 표시
  - 모달에 role="dialog", aria-modal 추가
  - GPU 카드에 role="listitem" 및 상세 aria-label
  - 호스트 카드에 role="region" 추가
  - 자동 갱신 상태에 aria-live="polite"

#### 5) 백엔드 API

- [x] `GET /api/data`: 전체 데이터 조회
- [x] `POST /api/nodes/:nodeId/allocate`: GPU 할당 (Free → Used)
- [x] `POST /api/nodes/:nodeId/release`: GPU 해제 (Used → Free)
- [x] `POST /api/nodes/:nodeId/restart`: GPU 재시작
- [x] `POST /api/nodes/:nodeId/toggle-expand`: 확장 허가 토글
- [x] `POST /api/nodes/expand`: 다중 GPU 할당
- [x] `POST /api/nodes/:nodeId/call-admin`: 관리자 호출

#### 6) 로깅 시스템

- [x] **send.log**: 모든 명령 JSON 라인 기록
  ```json
  {"ts":"2025-11-08T00:30:00.000Z","actor":"alice","event":"ALLOCATE","nodes":["az-01-gpu-0"],"payload":{"team":"AI Research"}}
  ```
- [x] **audit.log**: 감사 로그 기록
  ```json
  {"ts":"2025-11-08T00:30:00.000Z","actor":"alice","action":"allocate_node","details":{"node_id":"az-01-gpu-0","team":"AI Research"}}
  ```

---

## 현재 데이터 구조

### 개별 GPU 노드 모델

기존의 "서버 노드" 개념에서 **"개별 GPU"** 개념으로 변경:

```yaml
nodes:
  - node_id: "az-01-gpu-0"      # 개별 GPU 식별자
    host_id: "az-01"             # 물리적 서버 그룹
    gpu_index: 0                 # 호스트 내 GPU 번호
    cluster_id: "azure"
    gpu_model: "A100"
    gpu_mem_gb: 80
    status: "Free"               # Free | Used | Error | Reserved
    owner: null                  # 할당 시 입력한 User ID
    team: null                   # 할당 시 입력한 Team
    password_hash: null          # 할당 시 입력한 Password (평문)
    allow_expand: false          # 확장 허가 여부
    last_error: null             # 에러 발생 시 메시지
    bmc_ip: "10.0.1.11"         # BMC IP (재시작용)
```

### 호스트별 그룹핑

- 4개 호스트: az-01, az-02, op-01, op-02
- 각 호스트당 8개 GPU (gpu_index: 0-7)
- 총 32개 개별 GPU 노드

---

## 주요 UX 플로우

### 1. GPU 할당 (단일)
1. Free GPU 카드 위에 마우스 호버 → 툴팁으로 GPU 정보 확인
2. 일반 모드에서 Free GPU 클릭 시 아무 반응 없음
3. 호스트의 "Use GPU" 버튼 클릭 → 선택 모드 활성화
4. Free GPU 클릭하여 선택
5. 확장 패널의 "Allocate Selected GPUs" 클릭
6. User ID, Password, Team 입력
7. "Allocate All" 클릭 → GPU 할당 완료

### 2. GPU 할당 (다중)
1. 호스트의 "Use GPU" 버튼 클릭
2. 여러 Free GPU를 순차적으로 클릭하여 선택
3. 확장 패널에서 선택된 GPU 목록 확인
4. User ID, Password, Team 입력 (모든 GPU에 동일하게 적용)
5. "Allocate All" 클릭 → 모든 GPU 동시 할당

### 3. GPU 해제
1. Used GPU 카드 클릭 → 모달 오픈
2. User ID, Password 입력 (할당 시 입력했던 정보)
3. "Release GPU" 버튼 클릭
4. 인증 성공 시 GPU Free 상태로 변경

### 4. GPU 확장 허가
1. Used GPU 소유자가 모달에서 "Enable Expand" 버튼 클릭
2. 다른 사용자가 해당 GPU를 포함하여 다중 할당 가능
3. "Disable Expand"로 다시 잠금 가능

### 5. 에러 GPU 처리
1. Error 상태 GPU 클릭 → 모달 오픈
2. 에러 메시지 확인
3. User ID, 메시지 입력 후 "Call Admin"
4. 관리자에게 알림 로그 전송

---

## 기술 스택

- **Frontend**: Vanilla JavaScript (No Framework)
- **Backend**: Express.js (Node.js)
- **Data Storage**: YAML files (No Database)
- **Logging**: JSON Lines (send.log, audit.log)
- **Styling**: Pure CSS with responsive design
- **Authentication**: Per-GPU credential storage (No pre-defined users)

---

## 보안 고려사항

**현재 구현**:
- 비밀번호를 평문으로 저장 (password_hash 필드명이지만 실제로는 평문)
- GPU별 독립적인 인증 시스템

**프로덕션 권장사항**:
- bcrypt를 사용한 비밀번호 해시화
- HTTPS 사용
- 세션 관리 추가
- Rate limiting 구현

---

## 확장성

### 새 GPU 추가
`data/nodes.yaml`에 노드 추가:
```yaml
- node_id: "az-03-gpu-0"
  host_id: "az-03"
  gpu_index: 0
  cluster_id: "azure"
  gpu_model: "H100"
  gpu_mem_gb: 80
  status: "Free"
  owner: null
  team: null
  password_hash: null
  allow_expand: false
```

### 새 클러스터 추가
`data/clusters.yaml`에 클러스터 추가:
```yaml
- id: "gcp"
  name: "GCP GPU Cluster"
  location: "GCP us-central1"
  notebook_url_template: "https://jupyter.gcp.example/{node_id}"
```

### 새 호스트 추가
같은 host_id로 8개 GPU 노드 추가 → 자동으로 호스트 카드 생성

---

## 운영 가이드

### 로그 로테이션
```bash
# 매주 로그 백업
cp logs/send.log logs/send.log.$(date +%Y%m%d)
cp logs/audit.log logs/audit.log.$(date +%Y%m%d)
> logs/send.log
> logs/audit.log
```

### 노드 상태 수동 변경
`data/nodes.yaml` 파일 직접 수정 → 브라우저 새로고침으로 즉시 반영

### 자동 갱신
- 기본: 30초 간격
- 설정 가능: 10초, 30초, 1분, 5분
- 토글 버튼으로 ON/OFF 가능

---

## Definition of Done (완료 기준)

- [x] YAML만으로 상태 반영/업데이트 가능
- [x] 모든 액션은 `send.log`에 단일 라인 JSON으로 기록
- [x] Free/Used/Error 시나리오가 UI에서 재현 가능
- [x] 다중 GPU 할당 기능 동작
- [x] 호스트별 독립적인 선택 모드
- [x] Per-GPU 인증 시스템 동작
- [x] 툴팁으로 GPU 정보 확인 가능
- [x] 모바일 반응형 디자인
- [x] 접근성 (ARIA) 지원
- [x] 에러 처리 UI
- [x] 신규 노드/클러스터 추가 시 코드 수정 없이 YAML만으로 확장 가능
- [x] 감사 로그로 주요 변경 추적 가능

---

## 향후 개선 가능 항목

- [ ] 비밀번호 bcrypt 해시화
- [ ] 예약(Reserve) 기능 구현
- [ ] 타임아웃 기반 자동 해제
- [ ] 사용자 권한 관리 시스템
- [ ] Grafana 대시보드 연동
- [ ] 실시간 GPU 메트릭 수집
- [ ] 이메일/Slack 알림 연동
- [ ] 사용 기록 통계 및 리포트
