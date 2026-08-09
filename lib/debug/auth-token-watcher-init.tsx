'use client'

// 임시 진단 컴포넌트 — watch-auth-token.ts 참고. 앱 로드 시 최대한 빨리
// (supabase client 초기화 이전) watcher를 설치하기 위해 모듈 최상위에서
// 바로 install 호출. 렌더링할 내용 없음.

import { installAuthTokenWatcher } from '@/lib/debug/watch-auth-token'

installAuthTokenWatcher()

export function AuthTokenWatcherInit() {
  return null
}
