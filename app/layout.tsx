import type { Metadata, Viewport } from 'next'
import { Playfair_Display } from 'next/font/google'
import { LocalFont } from 'next/font/local'
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

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
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
    <html className={`light ${playfairDisplay.variable} ${pretendardVariable.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
