// Vercel의 기존 Build Command(`node .v0/inject-built-with-v0.mjs && next build`)가
// 참조하는 파일. v0.dev의 공식 GitHub 동기화가 커밋마다 자동으로 채워 넣는 스크립트인데,
// 이 저장소는 수동으로 초기화되어 해당 파일이 없었다. 배지 주입 없이 빌드만 통과시키는
// no-op으로 둔다.
