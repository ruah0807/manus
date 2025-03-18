# 샌드박스 런타임 API

이 저장소는 파일 작업, 브라우저 자동화, 터미널 상호작용 및 텍스트 에디터 기능을 제공하는 다기능 런타임 API를 구현합니다.
Python 3.11을 사용하여 Docker 컨테이너 내 `/opt/.manus/.sandbox-runtime/app` 경로에서 실행되도록 설계되었습니다.

## 목차

- [기능](#features)
- [저장소 구조](#repository-structure) 
- [API 엔드포인트](#api-endpoints)
- [서버 실행](#running-the-server)
- [사용법](#usage)

## features

- **파일 작업**: S3에 단일 또는 멀티파트 파일 업로드, 파일 다운로드, 첨부파일 일괄 다운로드
- **브라우저 자동화**: Playwright를 사용한 브라우저 동작(탐색, 클릭, 입력, 스크린샷 등) 실행
- **터미널 상호작용**: WebSocket을 통한 터미널 세션 관리, 명령어 실행, 히스토리 조회, 실행 중인 프로세스 제어
- **텍스트 에디터 작업**: 파일 내용 조회, 생성, 수정 및 검색

## repository-structure

Below is a tree view of the repository with a short description for each component:

```
app/
├── helpers/                  # 셸 명령어와 파일 작업을 위한 유틸리티 모듈
│   ├── tool_helpers.py       # 비동기 셸 명령어 실행 및 출력 잘라내기 유틸리티
│   ├── utils.py              # 파일 업로드, 디렉토리 관리 및 멀티파트 업로드 로직
│   └── __init__.py
├── logger.py                 # 애플리케이션 로깅 설정
├── models.py                 # API 요청/응답을 위한 데이터 모델 (Pydantic 사용)
├── README.md                 # 프로젝트 문서 (현재 파일)
├── router.py                 # 요청 시간 측정/로깅이 포함된 커스텀 FastAPI 라우트
├── server.py                 # API 엔드포인트 정의가 포함된 메인 FastAPI 애플리케이션
├── terminal_socket_server.py # 터미널 연결 및 상호작용을 위한 WebSocket 서버
├── tools/                    # 브라우저, 터미널 및 텍스트 편집 작업을 위한 도구 모음
│   ├── base.py                # 도구를 위한 기본 클래스 및 공통 유틸리티 함수
│   ├── browser/               # Playwright 기반 브라우저 자동화 도구
│   │   ├── browser_actions.py   # 브라우저 동작(탐색, 클릭, 입력 등) 처리기
│   │   ├── browser_helpers.py   # 브라우저 작업을 위한 JavaScript 스니펫 및 헬퍼 함수
│   │   ├── browser_manager.py   # 브라우저 수명주기 및 동작 실행 관리
│   │   └── __init__.py
│   ├── terminal/            # 터미널 관리 및 통신 도구
│   │   ├── expecter.py         # 터미널 I/O 처리를 위한 비동기 expect 루프
│   │   ├── terminal_helpers.py # 터미널 출력 및 ANSI 이스케이프 시퀀스 처리
│   │   ├── terminal_manager.py # 터미널 세션 생성, 관리 및 상호작용
│   │   └── __init__.py
│   ├── text_editor.py       # 파일 편집기 작업: 보기, 생성, 쓰기 및 파일 내용 검색
│   └── __init__.py
├── types/                    # Pydantic을 사용한 API 스키마 정의
│   ├── browser_types.py     # 브라우저 관련 동작 및 결과를 위한 모델
│   ├── messages.py          # 터미널 및 텍스트 편집기 메시지와 응답을 위한 모델
│   └── __init__.py
└── __init__.py
```

## API Endpoints
이 API는 FastAPI로 구축되었으며 다음과 같은 엔드포인트를 제공합니다:

### File Endpoints
| HTTP Method | Endpoint          | Description                                                                       |
|-------------|-------------------|-----------------------------------------------------------------------------------|
| POST        | `/file/upload_to_s3`           | S3에 파일을 업로드합니다. 파일 크기가 임계값을 초과하면 멀티파트 정보를 반환합니다. |
| POST        | `/file/multipart_upload_to_s3` | 사전 서명된 URL을 사용하여 멀티파트 업로드를 위한 파일 부분을 업로드합니다.        |
| GET         | `/file`                        | 주어진 경로에서 파일을 다운로드합니다.                                           |
| POST        | `/request-download-attachments`| 지정된 URL에서 파일을 일괄 다운로드하고 선택적으로 하위 폴더에 저장합니다.          |

### Browser Endpoints

| HTTP Method | Endpoint            | Description                                                |
|-------------|---------------------|------------------------------------------------------------|
| GET         | `/browser/status`   | 브라우저 매니저의 현재 상태를 가져옵니다.           |
| POST        | `/browser/action`   | 브라우저 동작(예: 탐색, 상호작용)을 실행합니다. |

### Terminal Endpoints
| HTTP Method | Endpoint                         | Description                                                      |
|-------------|---------------------------------|--------------------------------------------------------------|
| WebSocket   | `/terminal`                      | WebSocket을 통한 대화형 세션을 위한 터미널 연결을 설정합니다.      |
| POST        | `/terminal/{terminal_id}/reset`  | `terminal_id`로 식별되는 특정 터미널을 재설정합니다.      |
| POST        | `/terminal/reset-all`            | 모든 활성 터미널을 재설정합니다.                           |
| GET         | `/terminal/{terminal_id}/view`   | 터미널 기록을 조회합니다. 쿼리 파라미터 `full`로 전체 기록과 마지막 출력만 보기를 전환할 수 있습니다. |
| POST        | `/terminal/{terminal_id}/kill`   | 터미널에서 실행 중인 현재 프로세스를 종료합니다.              |
| POST        | `/terminal/{terminal_id}/write`  | 터미널 프로세스에 입력을 작성합니다(선택적으로 "enter" 키 전송).    |

### Other Endpoints

| HTTP Method | Endpoint          | Description                                                                     |
|-------------|-------------------|---------------------------------------------------------------------------------|
| POST        | `/text_editor`    | 텍스트 편집기 작업을 실행합니다(예: 파일 열기 또는 업데이트).                    |
| POST        | `/init-sandbox`   | `.secrets`에 제공된 시크릿을 작성하여 샌드박스 환경을 초기화합니다.              |
| GET         | `/healthz`        | 전반적인 서비스 상태를 확인하기 위한 헬스 체크 엔드포인트입니다.                 |
| POST        | `/zip-and-upload` | 디렉토리를 압축(특정 폴더 제외)하고 아카이브를 S3에 업로드합니다.                |

---

## WebSocket Information

| WebSocket Endpoint | Description          | Key Features                 |
|--------------------|----------------------|------------------------------|
| `/terminal`        | 실시간 대화형 터미널 세션을 위한 터미널 WebSocket 엔드포인트.  | - **연결 관리:** 새로운 연결을 수락하고 지속적인 메시지 루프를 유지합니다.<br>- **메시지 처리:** Pydantic을 사용하여 들어오는 JSON 메시지를 검증하고 메시지 유형에 따라 작업을 디스패치합니다.<br>- **작업 관리:** 각 작업에 대한 비동기 작업을 생성하고 연결이 끊어지면 정리합니다.<br>- **명령어 지원:** 재설정, 기록 보기, 프로세스 종료 및 명령어 실행(다양한 모드)과 같은 터미널 명령어를 지원합니다. |

## Running the Server

애플리케이션의 진입점은 저장소의 루트 폴더에 위치한 `start_server.py`입니다. 이 스크립트는 환경을 설정하고 Uvicorn을 사용하여 API 서버를 시작합니다.

### Command-Line Arguments

- `--port`: Port to run the server on (default: **8330**)
- `--host`: Host interface to bind to (default: **0.0.0.0**)
- `--log-level`: Logging level (choices: debug, info, warning, error, critical; default: **info**)
- `--chrome-path`: Optional path to the Chrome browser instance

### Example Usage

Run the server from the root folder:

```bash
python start_server.py --port 8330 --host 0.0.0.0 --log-level info --chrome-path /usr/bin/chrome
```
서버는 지정된 호스트와 포트에서 접근할 수 있습니다.

## Usage

### Running in Docker

이 애플리케이션은 `/opt/.manus/.sandbox-runtime/app` 경로의 Docker 컨테이너 내에서 Python 3.11로 실행됩니다. 컨테이너를 빌드하고 실행하려면 다음을 수행하십시오:

1. **Docker 이미지 빌드:**

   ```bash
   docker build -t sandbox-runtime .
   ```

2. **Docker 컨테이너 실행:**

   ```bash
   docker run -p 8330:8330 sandbox-runtime
   ```

API는 `http://localhost:8330`에서 접근할 수 있습니다.

### 로컬 개발

Start the server with Uvicorn directly:

```bash
uvicorn app.server:app --host 0.0.0.0 --port 8330 --log-level info
```

## Development

- **Python Version**: 3.11  
- **Dependencies**: See requirements.txt
- **Local Run**: Start the server as shown above.
