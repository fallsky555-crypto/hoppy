import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '호빵이 스킨 다이어리 · 장벽 리셋 캘린더',
  description: '무너진 피부 장벽을 30일 동안 부드럽게 복구하는 초보자 장벽 리셋 캘린더. 매일 피부 레시피를 기록해요.',
  generator: 'v0.app',
  icons: {
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hoppy',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="light">
      <head>
        {/* 디자인 토큰 — Pretendard + Playfair Display. globals.css의 @import는 tailwindcss의
            import 체인과 순서가 꼬여 CSS 파싱이 깨지므로, 별도 <link>로 로드한다 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable.css" />
      </head>
      <body className="bg-background font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
