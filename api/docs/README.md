# LFIT Admin API 문서화 가이드

## 디렉토리 구조
```
docs/
├── src/              # 원본 마크다운 및 다이어그램 소스
│   ├── architecture.md
│   └── diagrams/
│       ├── architecture.mmd    # 계층 구조 다이어그램
│       ├── flow.mmd           # 요청 흐름도
│       ├── ad_schema.mmd      # 광고 보상/클레임 ERD
│       ├── mission_schema.mmd # 미션 보상/클레임 ERD
│       └── auth_flow.mmd      # 인증 흐름도
└── generated/        # 생성된 이미지 및 PDF
    ├── diagrams/
    │   ├── architecture.png
    │   ├── flow.png
    │   ├── ad_schema.png
    │   ├── mission_schema.png
    │   └── auth_flow.png
    └── architecture.pdf
```

## 문서 생성 방법

### 1. 다이어그램 생성
```bash
# 계층 구조 다이어그램
mmdc -i src/diagrams/architecture.mmd -o generated/diagrams/architecture.png

# 요청 흐름도
mmdc -i src/diagrams/flow.mmd -o generated/diagrams/flow.png

# 데이터베이스 스키마 다이어그램
mmdc -i src/diagrams/ad_schema.mmd -o generated/diagrams/ad_schema.png
mmdc -i src/diagrams/mission_schema.mmd -o generated/diagrams/mission_schema.png

# 인증 흐름도
mmdc -i src/diagrams/auth_flow.mmd -o generated/diagrams/auth_flow.png
```

### 2. PDF 생성
```bash
# Markdown을 PDF로 변환
pandoc src/architecture.md \
  -o generated/architecture.pdf \
  --pdf-engine=xelatex \
  -V CJKmainfont='Noto Sans CJK KR' \
  -V mainfont='Noto Sans' \
  -V monofont='Noto Sans Mono' \
  -V fontsize=11pt \
  -V geometry='margin=1in' \
  --toc
```

## 문서 작성 규칙

1. 모든 원본 문서는 `src/` 디렉토리에 작성
2. 다이어그램 소스는 `src/diagrams/`에 `.mmd` 확장자로 저장
3. 생성된 파일은 절대 직접 수정하지 않음
4. 이미지 참조는 상대 경로 사용 (예: `generated/diagrams/architecture.png`)

## 다이어그램 종류 및 용도

1. **계층 구조 (architecture.mmd)**
   - 애플리케이션의 전체 계층 구조를 보여줌
   - 각 계층 간의 의존성을 표현
   - 보상 설정과 클레임 처리의 분리된 구조를 표현

2. **요청 흐름도 (flow.mmd)**
   - HTTP 요청의 처리 과정을 시퀀스 다이어그램으로 표현
   - 각 계층에서의 데이터 흐름을 보여줌
   - 보상 설정과 클레임 처리의 개별 흐름을 표현

3. **데이터베이스 스키마 (ad_schema.mmd, mission_schema.mmd)**
   - 각 도메인의 데이터베이스 구조를 ERD로 표현
   - 보상 설정 테이블과 클레임 테이블의 관계 표현
   - 테이블 간의 관계와 각 필드의 타입을 명시

4. **인증 흐름도 (auth_flow.mmd)**
   - 사용자 인증 과정을 시퀀스 다이어그램으로 표현
   - JWT 토큰 기반 인증의 전체 흐름을 보여줌
   - 관리자 권한 검증 과정 포함

## 필요한 도구

- Mermaid CLI (`@mermaid-js/mermaid-cli`)
- Pandoc
- XeLaTeX
- Noto Sans CJK KR 폰트
- Noto Sans 폰트
- Noto Sans Mono 폰트

## 주요 변경 사항

1. **보상과 클레임의 분리**
   - 미션 보상과 미션 클레임을 별도의 모듈로 분리
   - 광고 보상과 광고 클레임을 별도의 모듈로 분리
   - 각 모듈별 독립적인 Repository, Service, Controller 구현

2. **API 엔드포인트 구조화**
   - `/api/admin/mission-rewards`: 미션 보상 설정 관리
   - `/api/admin/mission-claims`: 미션 보상 클레임 관리
   - `/api/admin/ad-rewards`: 광고 보상 설정 관리
   - `/api/admin/ad-claims`: 광고 보상 클레임 관리

3. **문서 구조 개선**
   - 다이어그램 업데이트로 분리된 구조 반영
   - API 문서에 클레임 관련 엔드포인트 추가
   - 예제 코드 업데이트 