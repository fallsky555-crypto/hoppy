"use client"

import { createContext, useContext } from "react"
import type { Locale } from "./i18n"

const LocaleContext = createContext<Locale | undefined>(undefined)

export function useLocale(): Locale {
  const locale = useContext(LocaleContext)
  if (!locale) {
    throw new Error("useLocale must be used within LocaleProvider")
  }
  return locale
}

export { LocaleContext }
