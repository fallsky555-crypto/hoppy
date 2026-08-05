import { createBrowserClient, type SupabaseClient } from "@supabase/ssr"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

let client: SupabaseClient | null = null

/**
 * 브라우저용 싱글턴 Supabase 클라이언트 (CookieStorage 사용).
 * publishable key는 RLS로 보호되는 걸 전제로 클라이언트에 노출해도 되는 키라 그대로 env에서 읽어 쓴다.
 *
 * CookieStorage는 myroutinediet.com과 app.myroutinediet.com 간 세션 공유를 위해
 * 명시적으로 ".myroutinediet.com" 도메인으로 설정한다.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null
  if (!client) {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      cookieOptions: {
        domain: ".myroutinediet.com",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,  // 7일
        sameSite: "lax"
      }
    })
  }
  return client
}
