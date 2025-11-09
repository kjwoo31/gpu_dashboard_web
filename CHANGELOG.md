# Changelog

GPU Control Hub의 주요 변경사항을 기록합니다.

## [1.0.0] - 2025-11-08

### 주요 변경사항

#### 데이터 모델 변경
- **개별 GPU 단위 관리**: 서버 노드 단위에서 개별 GPU 단위로 변경
- 4개 호스트 × 8개 GPU = 총 32개 독립적인 GPU 노드
- `node_id`, `host_id`, `gpu_index` 구조로 재설계

#### 인증 시스템 재설계
- **Per-GPU 인증 방식**: 사전 정의된 사용자 계정 없음
- GPU 할당 시 User ID, Password, Team을 자유롭게 입력
- 각 GPU가 독립적으로 credentials 저장
- GPU 해제/관리 시 저장된 정확한 credentials 필요

#### UI/UX 개선

##### 호스트별 GPU 선택 모드
- 클러스터 단위가 아닌 **호스트(PC)별** "Use GPU" 버튼
- 각 호스트마다 독립적인 선택 모드 활성화
- 한 번에 하나의 호스트만 선택 가능
- "Cancel Selection" 버튼으로 선택 모드 해제

##### 툴팁 시스템
- 모든 GPU 카드에 마우스 호버 시 상세 정보 표시
- 순수 CSS 구현 (JavaScript 불필요)
- 화면 경계 자동 감지 및 위치 조정
- GPU ID, 호스트, 클러스터, 상태, 모델, 메모리 표시
- Used GPU: Owner, Team, 확장 허가 여부 추가 표시
- Error GPU: 에러 메시지 표시

##### Free GPU 클릭 동작 변경
- 일반 모드에서 Free GPU 클릭 시 모달 열리지 않음
- GPU 할당은 "Use GPU" 버튼을 통한 선택 모드에서만 가능

##### GPU 그룹 시각화
- 같은 owner/team의 연속된 GPU 자동 그룹화
- 왼쪽 그라디언트 바로 그룹 표시
- 그룹 경계에 따른 라운드 코너 자동 조정
- 시각적으로 소유권 명확히 표시

#### v0 비교 후 추가 개선사항

##### 진행률 바 개선
- 각 상태별 퍼센트 툴팁 (Free, Used, Error)
- `title` 속성으로 호버 시 퍼센트 표시
- ARIA progressbar 역할 및 속성 추가
- `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

##### 에러 처리 UI
- 데이터 로드 실패 시 전체 화면 모달 오버레이
- "다시 시도" 버튼으로 재시도 기능
- SVG 아이콘과 명확한 에러 메시지
- 에러 발생 시에도 우아한 사용자 경험

##### 반응형 디자인
- **모바일 우선 접근 방식**
- 브레이크포인트: 640px (sm), 1024px (lg)
- GPU 그리드: 모바일 4열 → 데스크탑 8열
- 통계 그리드: 모바일 2열 → 데스크탑 4열
- 헤더 제목: 1.5rem → 1.875rem → 2rem
- 버튼 패딩 및 폰트 크기 반응형 조정
- 모바일에서 "마지막 업데이트:" 레이블 숨김
- GPU 툴팁 터치 디바이스에서 비활성화

##### 접근성 (ARIA) 개선
- **클러스터 버튼**: `aria-pressed`, `aria-label` 추가
- **호스트 카드**: `role="region"`, `aria-label` 추가
- **GPU 카드**: 상세한 `aria-label`, `role="listitem"` 추가
- **Use GPU 버튼**: `aria-pressed`, `aria-label` 추가
- **모달**: `role="dialog"`, `aria-labelledby`, `aria-modal` 추가
- **헤더 컨트롤**: 모든 버튼과 선택 요소에 `aria-label` 추가
- **자동 갱신 토글**: `aria-pressed` 동적 업데이트
- **확장 패널**: `role="region"`, 목록에 `role="list"` 추가
- **마지막 업데이트**: `role="status"`, `aria-live="polite"` 추가
- **진행률 바**: 각 세그먼트에 `aria-label` 추가
- 스크린 리더 완벽 지원

### 기술 스택

#### Frontend
- Vanilla JavaScript (No Framework)
- Pure CSS with responsive design
- CSS-only tooltips
- Mobile-first approach

#### Backend
- Express.js (Node.js)
- YAML-based data storage
- JSON Lines logging

#### 인증
- Per-GPU credential storage
- No pre-defined user database
- Password stored in plaintext (bcrypt recommended for production)

### API 엔드포인트

- `GET /api/data`: 전체 데이터 조회
- `POST /api/nodes/:nodeId/allocate`: GPU 할당 (Free → Used)
- `POST /api/nodes/:nodeId/release`: GPU 해제 (Used → Free)
- `POST /api/nodes/:nodeId/restart`: GPU 재시작
- `POST /api/nodes/:nodeId/toggle-expand`: 확장 허가 토글
- `POST /api/nodes/expand`: 다중 GPU 할당
- `POST /api/nodes/:nodeId/call-admin`: 관리자 호출

### 로깅

#### send.log
모든 명령이 JSON Lines 형식으로 기록:
```json
{"ts":"2025-11-08T00:30:00.000Z","actor":"alice","event":"ALLOCATE","nodes":["az-01-gpu-0"],"payload":{"team":"AI Research"}}
```

#### audit.log
감사 로그 기록:
```json
{"ts":"2025-11-08T00:30:00.000Z","actor":"alice","action":"allocate_node","details":{"node_id":"az-01-gpu-0","team":"AI Research"}}
```

### 보안

#### 현재 구현
- 비밀번호 평문 저장 (password_hash 필드명이지만 실제로는 평문)
- GPU별 독립적인 인증
- YAML 파일 기반 상태 관리

#### 프로덕션 권장사항
- [ ] bcrypt를 사용한 비밀번호 해시화
- [ ] HTTPS 사용
- [ ] 세션 관리 추가
- [ ] Rate limiting 구현
- [ ] YAML 파일 접근 권한 제한

### 향후 개선 계획

- [ ] 비밀번호 bcrypt 해시화
- [ ] 예약(Reserve) 기능 구현
- [ ] 타임아웃 기반 자동 해제
- [ ] 사용자 권한 관리 시스템
- [ ] Grafana 대시보드 연동
- [ ] 실시간 GPU 메트릭 수집
- [ ] 이메일/Slack 알림 연동
- [ ] 사용 기록 통계 및 리포트
- [ ] WebSocket을 통한 실시간 업데이트
- [ ] GPU 사용률 그래프
- [ ] 예약 큐 관리 시스템

---

## 버전 관리 규칙

이 프로젝트는 [Semantic Versioning](https://semver.org/)을 따릅니다:

- **MAJOR**: 호환성이 깨지는 변경
- **MINOR**: 하위 호환 기능 추가
- **PATCH**: 하위 호환 버그 수정
