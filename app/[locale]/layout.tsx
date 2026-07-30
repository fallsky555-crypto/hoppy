import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { t } from '@/lib/i18n'

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
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const locale = (await params).locale as 'ko' | 'en'

  return (
    <html lang={locale} className="light">
      <body className="bg-background font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
