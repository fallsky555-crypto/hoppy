import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Nunito, Gaegu } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const gaegu = Gaegu({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '호빵이 스킨 다이어리 · 장벽 리셋 캘린더',
  description:
    '무너진 피부 장벽을 30일 동안 부드럽게 복구하는 초보자 장벽 리셋 캘린더. 귀여운 호빵이와 함께 매일 피부 레시피를 기록해요.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#fbe8d8',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`light ${nunito.variable} ${gaegu.variable}`}>
      <body className="bg-background font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
