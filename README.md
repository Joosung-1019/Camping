# 전국 오토캠핑장 지도

전국 오토캠핑장을 지도에서 한눈에 보고, 캠핑장별 날씨/시설정보/우리집에서의 거리·자동차 이동시간을 확인할 수 있는 웹앱입니다.

- 지도: 카카오맵 (Kakao Maps JavaScript SDK)
- 캠핑장 데이터: 공공데이터포털 한국관광공사_고캠핑정보 조회서비스 (자동차야영장만 필터링)
- 날씨: OpenWeatherMap
- 자동차 이동시간: Tmap(SK Open API) 경로안내
- 배포: Vercel

## 1. API 키 발급받기

아래 4개는 각각 무료로 발급받을 수 있고, 회원가입/키 발급은 직접 진행해주셔야 합니다.

### ① 고캠핑 서비스키 (공공데이터포털)
1. https://www.data.go.kr 회원가입 후 로그인
2. "[한국관광공사_고캠핑정보 조회서비스](https://www.data.go.kr/data/15101933/openapi.do)" 검색
3. **활용신청** 클릭 (보통 즉시 승인)
4. 마이페이지 > 개발계정 > 신청한 서비스 클릭 → **일반 인증키(Decoding)** 값을 복사
   - `.env.local`의 `GOCAMPING_SERVICE_KEY`에 이 값을 그대로 붙여넣기 (URL 인코딩하지 말 것)

### ② 카카오맵 JavaScript 키 (카카오 디벨로퍼스)
1. https://developers.kakao.com 접속 → 카카오 계정으로 로그인 (결제수단 등록 불필요)
2. 상단 **내 애플리케이션** → **애플리케이션 추가하기** (이름 아무거나, 예: 캠핑지도)
3. 생성된 앱 클릭 → 왼쪽 메뉴 **앱 키** → **JavaScript 키** 복사
4. 왼쪽 메뉴 **플랫폼** → **Web 플랫폼 등록** → 사이트 도메인에 `http://localhost:3000` 추가 (배포 후 Vercel 도메인도 여기에 추가)
5. 복사한 JavaScript 키를 `.env.local`의 `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`에 입력

### ③ OpenWeatherMap API Key
1. https://openweathermap.org/api 가입
2. My API keys 메뉴에서 기본 발급된 키 확인 (발급 후 활성화까지 몇 분~1시간 정도 걸릴 수 있음)
3. `.env.local`의 `OPENWEATHER_API_KEY`에 입력

### ④ Tmap appKey (자동차 이동시간)
1. https://openapi.sk.com 가입/로그인 (사업자등록 불필요)
2. 상단 **TMAP** 메뉴 → **API** 클릭 → 이용신청
3. 대시보드에서 발급된 **appKey** 복사
4. `.env.local`의 `TMAP_APP_KEY`에 입력 (하루 1,000건 무료)

## 2. 로컬 실행

```bash
cp .env.local.example .env.local
# .env.local을 열어 위 4개 키를 채워넣기

npm install
npm run dev
```

http://localhost:3000 접속 → 지도에 전국 오토캠핑장 마커가 표시되는지 확인합니다.

- 상단 "내 위치 사용" 또는 "지도에서 집 선택"으로 우리집 위치 등록 (브라우저에 저장됨)
- 마커 또는 목록 클릭 → 날씨/직선거리/자동차 이동시간/시설정보/캠핏 예약 링크 확인
- 지역 드롭다운, 검색창, 거리순 정렬 동작 확인

## 3. Vercel 배포

1. 이 프로젝트를 GitHub 레포지토리에 push
2. https://vercel.com 가입/로그인 → GitHub 레포 Import
3. 프로젝트 설정 > Environment Variables에 `.env.local`과 동일한 4개 키 등록
   - `GOCAMPING_SERVICE_KEY`, `OPENWEATHER_API_KEY`, `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`, `TMAP_APP_KEY`
4. Deploy → 발급된 `https://xxx.vercel.app` URL로 폰/태블릿/PC 등 여러 기기에서 접속 가능
5. 배포 후 카카오 디벨로퍼스 **플랫폼 > Web** 설정에 배포된 도메인을 추가해야 지도가 정상 동작합니다.

## 참고
- 캠핏(camfit.co.kr)은 비공식 API/크롤링 없이, 캠핑장 상세정보에서 "캠핏에서 예약하기" 외부 링크로만 연결합니다.
- 직선거리(하버사인)와 Tmap 기반 자동차 이동시간/거리를 함께 표시합니다.
