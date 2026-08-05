import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
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

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const locale = (await params).locale as 'ko' | 'en'

  return (
    <html lang={locale} className="light">
      <body className="bg-background font-sans antialiased">
        <LocaleProvider locale={locale}>
          {children}
        </LocaleProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
