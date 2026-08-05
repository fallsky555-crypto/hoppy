import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Playfair_Display, Noto_Serif_KR } from 'next/font/google'
import { LocalFont } from 'next/font/local'
import { t } from '@/lib/i18n'
import { LocaleProvider } from '@/lib/locale-provider'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: {
    locale: 'ko' | 'en'
  }
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const locale = (await params).locale as 'ko' | 'en'
  return {
    title: t('metadata.title', locale),
    description: t('metadata.description', locale),
    manifest: `/${locale}/manifest.json`,
  }
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

const pretendardVariable = LocalFont({
  src: [
    {
      path: '../../public/fonts/PretendardVariable.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
  display: 'swap',
})

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const locale = (await params).locale as 'ko' | 'en'

  return (
    <html lang={locale} className={`light ${playfairDisplay.variable} ${notoSerifKR.variable} ${pretendardVariable.variable}`}>
      <body className="bg-background font-sans antialiased">
        <LocaleProvider locale={locale}>
          {children}
        </LocaleProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
