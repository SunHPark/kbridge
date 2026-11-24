# Vercel 배포 가이드 (KEV Camp Guide)

## 0. 준비 (최초 1회)
- Node.js 18+ 설치 → 터미널에서 `npm i -g vercel`
- Vercel 계정 (GitHub 로그인 추천)

## 1. 도메인 정해서 빌드
SEO·OG 주소가 도메인 기준으로 들어가므로, 배포할 주소로 한 번 빌드합니다.
```bash
cd kbridge-gimhae-site
SITE_URL=https://camp.kbridgeinternational.com python3 build.py
# 도메인 미정이면: SITE_URL=https://kev-camp-guide.vercel.app python3 build.py
```

## 2. 배포
```bash
vercel login
vercel                 # 첫 실행: 프로젝트 생성 (질문엔 전부 엔터 / Framework: Other)
vercel env add AEROAPI_KEY production      # FlightAware 키 붙여넣기
vercel env add ALLOWED_ORIGIN production   # 예: https://camp.kbridgeinternational.com
vercel --prod
```
→ `https://프로젝트명.vercel.app` 주소가 나옵니다.

## 3. 커스텀 도메인 (선택)
Vercel 대시보드 → Project → Settings → Domains → `camp.kbridgeinternational.com` 추가
→ 도메인 DNS에 CNAME `camp` → `cname.vercel-dns.com` 등록 → 몇 분 후 HTTPS 자동 적용.
도메인을 바꿨다면 1번(빌드)을 새 주소로 다시 하고 `vercel --prod`.

## 4. 배포 후 체크리스트
- [ ] 메인/캠프/Trip/한국/김해/About 페이지 열리는지
- [ ] 사진·로고(한국관광공사, K-Bridge 파트너 로고) 뜨는지
- [ ] Trip: 편명 [검색] → 실시간 조회 되는지 (키 없으면 "수동 입력" 안내가 정상)
- [ ] "플랜 이미지로 저장" → 폰 사진첩 저장되는지 (iPhone/Android 각 1회)
- [ ] 캘린더 추가(.ics) 다운로드
- [ ] 초대 링크 복사 → 카톡/WhatsApp에 붙여넣었을 때 OG 미리보기 뜨는지
- [ ] OG 확인: https://developers.facebook.com/tools/debug/ 에 URL 입력 → "Scrape Again"
- [ ] Google Search Console에 도메인 등록 → sitemap.xml 제출

## 5. 수정 → 재배포
`src/` 수정 → `SITE_URL=... python3 build.py` → `vercel --prod`

## GitHub 자동 배포로 쓰려면
이 폴더를 GitHub 저장소에 올리고 Vercel에서 Import → Framework "Other", Build Command 비움, Output Directory 비움
→ 환경변수 AEROAPI_KEY / ALLOWED_ORIGIN 등록. 이후 push 할 때마다 자동 배포.
(index.html은 미리 빌드된 파일이므로 push 전에 build.py 실행)
