import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import LocalFont from 'next/font/local'
import { t } from '@/lib/i18n'
import { LocaleProvider } from '@/lib/locale-provider'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const locale = (await params).locale as 'ko' | 'en'
  return {
    title: t('metadata.title', locale),
    description: t('metadata.description', locale),
    manifest: `/api/${locale}/manifest.json`,
  }
}

// app/layout.tsx와 동일한 이유(Google Fonts 빌드 캐시 stale 404 사고)로 self-host —
// 자세한 배경은 app/layout.tsx의 주석 참고
const playfairDisplay = LocalFont({
  src: [
    { path: '../../public/fonts/PlayfairDisplay-500.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/PlayfairDisplay-600.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/PlayfairDisplay-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-playfair',
  display: 'swap',
})

const notoSerifKR = LocalFont({
  src: [
    { path: '../../public/fonts/NotoSerifKR-500.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/NotoSerifKR-700.woff2', weight: '700', style: 'normal' },
  ],
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
    <>
      <LocaleProvider locale={locale}>
        {children}
      </LocaleProvider>
      {process.env.NODE_ENV === 'production' && <Analytics />}
    </>
  )
}
