"use client"

import { LocaleContext } from "./locale-context"
import type { Locale } from "./i18n"

interface LocaleProviderProps {
  locale: Locale
  children: React.ReactNode
}

export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  return (
    <LocaleContext.Provider value={locale}>
      {children}
    </LocaleContext.Provider>
  )
}
