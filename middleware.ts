import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_LOCALE = 'ko'
const SUPPORTED_LOCALES = ['ko', 'en']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 리라이트 대상에서 제외할 경로들
  const excludePatterns = [
    /_next\/static/,
    /_next\/image/,
    /favicon\.ico/,
    /manifest/,
    /public/,
    /\.json$/, // 정적 파일
  ]

  // 현재 경로가 제외 대상인지 확인
  if (excludePatterns.some(pattern => pattern.test(pathname))) {
    return NextResponse.next()
  }

  // 이미 locale이 있는지 확인
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]

  if (SUPPORTED_LOCALES.includes(firstSegment)) {
    // 이미 /ko 또는 /en으로 시작하면 그대로
    return NextResponse.next()
  }

  // locale이 없으면 기본값(ko)으로 rewrite
  // "/" → "/ko"로 내부 rewrite (URL은 유지)
  return NextResponse.rewrite(new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url))
}

export const config = {
  matcher: [
    // 모든 경로에 대해 middleware 실행
    // 다만 위의 excludePatterns에서 제외됨
    '/((?!_next/static|_next/image|favicon\\.ico|manifest|public).*)',
  ],
}
