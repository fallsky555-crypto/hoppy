import type { Metadata, Viewport } from 'next'
import LocalFont from 'next/font/local'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hoppy Skin Diary',
  description: 'Gentle skincare routine',
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

// Vercel 빌드 캐시에 Google Fonts CDN URL이 stale하게 박제되면서 fonts.gstatic.com이
// 404를 반환해 빌드 자체가 실패하는 사고가 있었다(2026-08-13) — next/font/google을
// 걷어내고 Pretendard와 동일하게 next/font/local로 self-host해 빌드 타임에 외부
// 네트워크 요청 없이 완결되도록 한다. woff2 원본은 @fontsource/* 패키지에서 가져왔다.
const playfairDisplay = LocalFont({
  src: [
    { path: '../public/fonts/PlayfairDisplay-500.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/PlayfairDisplay-600.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/PlayfairDisplay-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-playfair',
  display: 'swap',
})

const notoSerifKR = LocalFont({
  src: [
    { path: '../public/fonts/NotoSerifKR-500.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/NotoSerifKR-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-noto-serif-kr',
  display: 'swap',
  preload: true,
})

const gowunBatang = LocalFont({
  src: [
    { path: '../public/fonts/GowunBatang-400.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/GowunBatang-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-gowun-batang',
  display: 'swap',
  preload: true,
})

const pretendardVariable = LocalFont({
  src: [
    {
      path: '../public/fonts/PretendardVariable.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
  display: 'swap',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className={`light ${playfairDisplay.variable} ${notoSerifKR.variable} ${gowunBatang.variable} ${pretendardVariable.variable}`}>
      <body className="bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
