import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Noto_Serif_KR, Gowun_Batang } from 'next/font/google'
import LocalFont from 'next/font/local'
import Script from 'next/script'
import './globals.css'

// 임시 진단 스크립트 — identity_already_exists 재로그인 시
// sb-ecbmasjqlgqvwxkzapld-auth-token localStorage 키가 지워지는 시점의
// 콜스택을 확보하기 위함. Supabase 클라이언트 초기화보다 먼저 실행되어야
// 하므로 next/script의 beforeInteractive 전략으로 <head>에 인라인 삽입.
// 범인이 확정되면 제거할 것. 관련: memory/oauth_identity_conflict_session_loss.md
const AUTH_TOKEN_WATCHER_SCRIPT = `
(function () {
  if (window.__authTokenWatcherInstalled) return;
  window.__authTokenWatcherInstalled = true;
  var WATCHED_KEY = 'sb-ecbmasjqlgqvwxkzapld-auth-token';

  function ts() {
    return 't=' + performance.now().toFixed(2) + 'ms (' + new Date().toISOString() + ')';
  }

  var originalSetItem = Storage.prototype.setItem;
  var originalRemoveItem = Storage.prototype.removeItem;
  var originalClear = Storage.prototype.clear;

  Storage.prototype.setItem = function (key, value) {
    if (key === WATCHED_KEY) {
      console.log('[auth-token-watcher] setItem("' + key + '") @ ' + ts());
      console.trace('[auth-token-watcher] setItem stack');
    }
    return originalSetItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function (key) {
    if (key === WATCHED_KEY) {
      console.log('[auth-token-watcher] removeItem("' + key + '") @ ' + ts());
      console.trace('[auth-token-watcher] removeItem stack');
    }
    return originalRemoveItem.call(this, key);
  };

  Storage.prototype.clear = function () {
    console.log('[auth-token-watcher] clear() @ ' + ts() + ' — wipes ALL localStorage keys including "' + WATCHED_KEY + '"');
    console.trace('[auth-token-watcher] clear stack');
    return originalClear.call(this);
  };

  console.log('[auth-token-watcher] installed @ ' + ts());
})();
`

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

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

const notoSerifKR = Noto_Serif_KR({
  weight: ['500', '700'],
  variable: '--font-noto-serif-kr',
  display: 'swap',
  preload: true,
})

const gowunBatang = Gowun_Batang({
  weight: ['400', '700'],
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="bg-background font-sans antialiased">
        <Script
          id="auth-token-watcher"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: AUTH_TOKEN_WATCHER_SCRIPT }}
        />
        {children}
      </body>
    </html>
  )
}
