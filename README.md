# GPU Control Hub

Azure 및 On-premise GPU 노드의 모니터링, 할당, 확장, 재시작, 예약을 외부 API 없이 YAML 상태 파일과 로그 파일을 통해 제어하는 웹 애플리케이션입니다.

## 주요 기능

- **개별 GPU 모니터링**: 개별 GPU의 상태를 실시간으로 확인 (Free/Used/Error/Reserved)
- **호스트별 GPU 선택**: 각 호스트(PC)별로 독립적인 GPU 선택 모드
- **GPU 할당/해제**: Per-GPU 인증을 통한 개별 GPU 할당 및 해제
- **다중 GPU 할당**: 같은 호스트의 여러 GPU를 선택하여 동시 할당
- **GPU 그룹 시각화**: 같은 owner/team의 GPU를 시각적으로 그룹화
- **툴팁 정보 표시**: 마우스 호버 시 GPU 상세 정보 표시
- **확장 허가**: 다른 사용자가 GPU를 확장할 수 있도록 허가 설정
- **반응형 UI**: 모바일/태블릿/데스크탑 지원
- **접근성**: ARIA 레이블로 스크린 리더 지원
- **감사 로깅**: 모든 작업이 로그 파일에 기록되어 추적 가능

## 프로젝트 구조

```
/data            # YAML 설정 파일
  ├── clusters.yaml   # 클러스터 정의
  ├── nodes.yaml      # 노드 정보
  ├── users.yaml      # 사용자 정보
  └── policies.yaml   # 정책 및 UI 설정
/logs            # 로그 파일
  ├── send.log        # 명령 로그 (JSON 형식)
  └── audit.log       # 감사 로그
/public          # 프론트엔드 파일
  ├── index.html
  ├── css/styles.css
  └── js/app.js
/src             # 백엔드 소스
  ├── server.js       # Express 서버
  ├── routes/api.js   # API 라우트
  └── utils/          # 유틸리티 함수
      ├── yamlHandler.js  # YAML 읽기/쓰기
      ├── logger.js       # 로깅
      └── auth.js         # 인증
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 서버 실행

```bash
npm start
```

또는 개발 모드 (nodemon 사용):

```bash
npm run dev
```

### 3. 브라우저에서 접속

```
http://localhost:3000
```

## 사용 방법

### GPU 상태

- **Green (Free)**: 사용 가능한 GPU
- **Blue (Used)**: 현재 사용 중인 GPU
- **Red (Error)**: 에러 상태의 GPU
- **Yellow (Reserved)**: 예약된 GPU (향후 구현 예정)

### GPU 정보 확인

#### 툴팁으로 확인 (권장)
- **모든 GPU 카드**에 마우스를 올리면 상세 정보 툴팁이 표시됩니다
- GPU ID, 호스트, 클러스터, 상태, GPU 모델, 메모리
- Used GPU: Owner, Team, 확장 허가 여부 추가 표시
- Error GPU: 에러 메시지 표시

#### 모달로 확인
- **Used/Error GPU**를 클릭하면 상세 정보 모달이 표시됩니다
- **Free GPU**는 일반 모드에서 클릭 시 아무 반응 없음 (할당은 "Use GPU" 버튼 사용)

### GPU 할당 (단일 또는 다중)

#### 단일 GPU 할당
1. 호스트 카드 헤더의 **"Use GPU"** 버튼 클릭 → 선택 모드 활성화
2. 해당 호스트의 Free GPU 1개 클릭하여 선택
3. 오른쪽 하단에 표시되는 확장 패널에서 **"Allocate Selected GPUs"** 버튼 클릭
4. User ID, Password, Team 입력
5. **"Allocate All"** 버튼 클릭

#### 다중 GPU 할당
1. 호스트 카드 헤더의 **"Use GPU"** 버튼 클릭 → 선택 모드 활성화
2. 해당 호스트의 Free GPU를 **여러 개 순차적으로 클릭**하여 선택 (Ctrl 키 불필요)
3. 오른쪽 하단 확장 패널에서 선택된 GPU 목록 확인
4. User ID, Password, Team 입력 (모든 GPU에 동일하게 적용됨)
5. **"Allocate All"** 버튼 클릭 → 선택한 모든 GPU 동시 할당

**중요**:
- 다른 호스트의 GPU를 선택하려면 먼저 "Cancel Selection" 버튼을 누른 후 해당 호스트의 "Use GPU" 버튼을 클릭해야 합니다
- 한 번에 하나의 호스트만 선택 모드 활성화 가능

### GPU 해제 (Release)

1. Used 상태의 GPU 카드 클릭
2. User ID와 Password 입력
3. 사용 가능한 액션:
   - **Open Notebook**: Jupyter 노트북 연결 (새 탭)
   - **Release GPU**: GPU 해제 (Free 상태로 변경)
   - **Enable/Disable Expand**: 확장 허가 토글

### Error 노드 처리

1. Error 상태의 노드 카드 클릭
2. 에러 정보 확인
3. User ID와 메시지 입력
4. "Call Admin" 버튼으로 관리자에게 알림

## 사용자 인증 방식

**중요**: 이 시스템은 사전 정의된 사용자 계정을 사용하지 않습니다.

### GPU 할당 시
- User ID, Password, Team을 자유롭게 입력
- 입력한 정보가 GPU에 저장됨
- 각 GPU마다 서로 다른 User ID/Password 설정 가능

### GPU 해제 시
- 할당할 때 입력했던 **정확한** User ID와 Password를 입력해야 함
- 일치하지 않으면 해제 불가

### 예시
```bash
# GPU 1 할당: alice / pass1 / TeamA
# GPU 2 할당: bob / pass2 / TeamB
# GPU 3 할당: alice / pass3 / TeamC  (같은 사용자, 다른 비밀번호)
```

> **보안 주의**: 현재 비밀번호는 평문으로 저장됩니다. 실제 운영 환경에서는 bcrypt 해시화를 권장합니다.

## YAML 설정 파일

### clusters.yaml

클러스터 정보를 정의합니다. 새 클러스터 추가 시 이 파일만 수정하면 됩니다.

```yaml
clusters:
  - id: "azure"
    name: "Azure GPU Cluster"
    location: "Azure"
    notebook_url_template: "https://jupyter.azure.example/{node_id}"
    grafana_url: "https://grafana.azure.example/d/GPUNodes"
```

### nodes.yaml

**개별 GPU 노드** 정보를 정의합니다. 새 GPU 추가 시 이 파일만 수정하면 됩니다.

**중요**: 서버 단위가 아닌 **개별 GPU 단위**로 관리합니다.

```yaml
nodes:
  - node_id: "az-01-gpu-0"      # 개별 GPU 식별자
    host_id: "az-01"             # 물리적 서버 (호스트) 그룹
    gpu_index: 0                 # 호스트 내 GPU 인덱스 (0-7)
    cluster_id: "azure"
    gpu_model: "A100"
    gpu_mem_gb: 80
    status: "Free"               # Free | Used | Error | Reserved
    owner: null                  # 할당 시 입력한 User ID
    team: null                   # 할당 시 입력한 Team
    password_hash: null          # 할당 시 입력한 Password (평문)
    allow_expand: false          # 확장 허가 여부
    last_error: null             # 에러 메시지
    bmc_ip: "10.0.1.11"         # BMC IP (재시작용)
```

**현재 구조**:
- 4개 호스트 (az-01, az-02, op-01, op-02)
- 각 호스트당 8개 GPU (gpu_index: 0-7)
- 총 32개 개별 GPU 노드

### users.yaml

사용자 정보와 권한을 관리합니다.

**중요**: 현재 이 파일은 **참조용**으로만 사용되며, 실제 GPU 할당/해제 시 인증에는 사용되지 않습니다. Per-GPU 인증 방식을 사용합니다.

```yaml
users:
  - id: "alice"
    name: "Alice Kim"
    role: "user"
    password_hash: "$2b$12$..."
    contact: "alice@example.com"
```

### policies.yaml

UI 색상, 제한, 확장 정책, 로깅 설정을 관리합니다.

## 로그 파일

### send.log

모든 명령이 JSON 형식으로 한 줄씩 기록됩니다.

```json
{"ts":"2025-11-08T00:30:00.000Z","actor":"alice","event":"ALLOCATE","nodes":["az-01"],"payload":{"team":"AI Research"}}
{"ts":"2025-11-08T00:35:00.000Z","actor":"alice","event":"RESTART","nodes":["az-01"],"payload":{}}
```

### audit.log

모든 작업의 감사 로그가 기록됩니다.

```json
{"ts":"2025-11-08T00:30:00.000Z","actor":"alice","action":"allocate_node","details":{"node_id":"az-01","team":"AI Research"}}
```

## API 엔드포인트

- `GET /api/data` - 전체 데이터 조회
- `POST /api/nodes/:nodeId/allocate` - 노드 할당
- `POST /api/nodes/:nodeId/release` - 노드 해제
- `POST /api/nodes/:nodeId/restart` - 노드 재시작
- `POST /api/nodes/:nodeId/toggle-expand` - 확장 허가 토글
- `POST /api/nodes/expand` - 다중 노드 확장
- `POST /api/nodes/:nodeId/call-admin` - 관리자 호출

## 보안

- 모든 작업은 사용자 인증 필요
- 비밀번호는 bcrypt로 해시화
- 노드 소유자 또는 관리자만 작업 수행 가능
- 모든 작업이 감사 로그에 기록

## 확장성

### 새 GPU 추가
`data/nodes.yaml`에 개별 GPU 노드 추가:
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

### 새 호스트 추가
같은 `host_id`로 8개 GPU 노드 추가 → 자동으로 호스트 카드 생성:
```yaml
# az-03-gpu-0부터 az-03-gpu-7까지 8개 추가
```

### 새 클러스터 추가
`data/clusters.yaml`에 클러스터 추가:
```yaml
- id: "gcp"
  name: "GCP GPU Cluster"
  location: "GCP us-central1"
  notebook_url_template: "https://jupyter.gcp.example/{node_id}"
  grafana_url: "https://grafana.gcp.example/d/GPUNodes"
```

### 새 사용자 추가
`data/users.yaml`에 사용자 추가 (참조용):
```yaml
- id: "charlie"
  name: "Charlie Lee"
  role: "user"
  password_hash: "$2b$12$..."
  contact: "charlie@example.com"
```

**핵심**: 코드 수정 없이 YAML 파일만으로 확장 가능

## 운영 가이드

### 로그 로테이션

정기적으로 `send.log`와 `audit.log`를 백업하고 로테이션해야 합니다.

```bash
# 예: 매주 로그 백업
cp logs/send.log logs/send.log.$(date +%Y%m%d)
cp logs/audit.log logs/audit.log.$(date +%Y%m%d)
> logs/send.log
> logs/audit.log
```

### 노드 상태 수동 변경

필요시 `nodes.yaml` 파일을 직접 수정하여 노드 상태를 변경할 수 있습니다. 변경 후 브라우저에서 새로고침하면 즉시 반영됩니다.

## UI/UX 개선 사항

### 툴팁 (Hover 정보)
- 모든 GPU 카드에 마우스 호버 시 상세 정보 표시
- 순수 CSS 구현으로 빠른 응답
- 화면 경계 자동 감지 및 위치 조정
- GPU ID, 호스트, 클러스터, 상태, 모델, 메모리 표시
- Used GPU: Owner, Team, 확장 허가 여부 추가

### 진행률 바 개선
- 각 상태별 퍼센트 툴팁 (Free, Used, Error)
- ARIA progressbar 역할 및 속성으로 접근성 향상

### 에러 처리
- 모달 형태의 에러 오버레이
- "다시 시도" 버튼으로 사용자 편의성 향상
- SVG 아이콘과 명확한 에러 메시지

### 반응형 디자인
- **모바일**: GPU 그리드 4열, 통계 2열
- **태블릿/데스크탑**: GPU 그리드 8열, 통계 4열
- 브레이크포인트: 640px, 1024px
- 버튼, 폰트 크기 자동 조정
- 모바일에서 일부 레이블 자동 숨김

### 접근성 (ARIA)
- 모든 인터랙티브 요소에 `aria-label` 추가
- 버튼에 `aria-pressed` 상태 표시
- 모달에 `role="dialog"`, `aria-modal` 추가
- GPU 카드에 `role="listitem"` 및 상세 `aria-label`
- 호스트 카드에 `role="region"` 추가
- 자동 갱신 상태에 `aria-live="polite"`
- 스크린 리더 완벽 지원

### GPU 그룹 시각화
- 같은 owner/team의 GPU를 시각적으로 그룹화
- 왼쪽 그라디언트 바로 그룹 표시
- 그룹 경계 자동 감지 및 라운드 코너 조정

## 라이선스

MIT
