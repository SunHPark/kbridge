# KEV Camp Guide · K-Bridge International

**배포는 DEPLOY.md 참고 (Vercel).**


정적 사이트(단일 index.html). 서버/빌드 불필요.

## 배포 (택1, 5분)
- **Netlify Drop**: https://app.netlify.com/drop 에 이 폴더를 드래그 → 즉시 URL 발급
- **Vercel**: `npx vercel` (폴더에서 실행)
- **GitHub Pages**: 저장소에 올리고 Settings → Pages → main 브랜치
- **기존 호스팅(아이티이지 등)**: index.html 을 원하는 경로(예: /gimhae/)에 업로드

## 페이지 (해시 라우팅)
- `#home` 김해 한옥마을 탐색(맛집·볼거리·지도·문의)
- `#camp` KEV 김해 캠프 (오늘 날짜 기준 지난 기수 자동 숨김, D-day 표시)
- `#trip` 항공편 → 한옥 왕복 플래너 (입력값은 브라우저에 저장, 일정 복사·캘린더(.ics) 추가)
- `#korea` 한국 소개 · `#gimhae` 김해 소개 · `#about` K-Bridge 소개
- 초대 링크: `https://<도메인>/?lang=ja#camp` 형태로 복사됨 (받는 사람 언어 고정)

## 언어
폰 언어 자동 감지 (en / zh / ja / es), 미지원 언어는 영어. `?lang=` 으로 강제 가능.

## 이미지
- 장소 사진: 한국관광공사(tong.visitkorea.or.kr) 공공데이터 이미지 핫링크 — 출처 표기 footer에 포함
- 로고·파트너 로고·캠프 이미지: kbridgeinternational.com 원본 경로 참조
- 이미지가 막히면 일러스트로 자동 대체됨. 안정적으로 쓰려면 이미지를 내려받아 /images 에 두고 index.html 상단 `IMG` 객체 경로만 교체.

## 수정 포인트
- 캠프 일정/가격: `COH` 배열 (시작일, 종료일, 기수, 상세URL)
- 장소: `P` 배열 / 번역 문구: `T` 객체

## 소스 구조
- `src/template.html` 화면·로직 / `src/data.js` 장소·캠프·번역 데이터 / `images/` 로고
- 수정 후 `python3 build.py` → index.html 재생성 (로고가 index.html 안에 내장됨)

## 실시간 항공편 조회 (FlightAware AeroAPI) — 켜는 법
편명 입력 → [검색] 또는 [일정 만들기] 누르면 서버 함수(/api/flight)가 AeroAPI를 호출해
공항·날짜·시각을 자동 입력하고, 지연·터미널·게이트·수하물 벨트를 보여줌.
- 출발 2일 이내: 실시간(/flights) — 예상 시각·지연 반영 / 그 이후: 운항 시간표(/schedules)
- API 키가 없거나 정적 호스팅만 쓰면 화면에 "수동 입력" 안내가 뜨고 나머지 기능은 그대로 작동

### 1) 키 발급
https://www.flightaware.com/aeroapi/portal 에서 가입 → API Key 생성.
⚠️ Personal 플랜은 개인·학술 용도 전용. 상업 서비스(이 사이트)는 Standard 플랜(월 최소 $100) 필요.
쿼리당 과금이라 서버 함수에 5분(실시간)/12시간(시간표) 캐시를 넣어 호출 수를 줄여둠.

### 2) 배포 (Vercel 권장 — Netlify Drop은 함수가 안 올라감)
```
npm i -g vercel
vercel            # 이 폴더에서 실행
vercel env add AEROAPI_KEY      # 키 붙여넣기
vercel env add ALLOWED_ORIGIN   # 예: https://내도메인 (선택)
vercel --prod
```
Netlify를 쓰려면 Git 연동 또는 `netlify deploy --prod`(CLI) + 환경변수 AEROAPI_KEY. netlify.toml 포함.

### 3) 다른 서버에 API를 둘 때
index.html 상단 `<script>` 앞에 `<script>window.KEV_FLIGHT_API="https://api.내도메인/flight"</script>`

### 테스트
`npm test` (모의 응답으로 실시간/시간표/오류 경로 검증)

## 대중교통 실시간 경로 (다음 단계)
현재는 공개 시간표 추정 + 구글/네이버 지도 실시간 링크. 완전 자동화는 ODsay LAB API를 같은 방식(서버 함수)으로 추가.

## SEO / OG
- 빌드 시 `SITE_URL` 기준으로 canonical, hreflang(en/zh-Hans/ja/es), OG·Twitter 카드, robots.txt, sitemap.xml, manifest 생성
- JSON-LD: Organization + WebSite + 다가오는 캠프 기수별 EducationEvent(날짜·가격) → 구글 이벤트 리치결과 대상
- OG 이미지: images/og-image.jpg (1200×630) / 아이콘: images/icon-*.png
- 언어 바꾸면 meta description도 해당 언어로 교체, 일본어·중국어는 Noto Sans JP/SC 자동 로드
