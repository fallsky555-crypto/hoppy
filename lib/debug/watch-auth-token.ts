// 임시 진단 코드 — identity_already_exists 재로그인 시 세션 토큰이 지워지는
// 시점의 콜스택을 확보하기 위함. 범인이 확정되면 제거할 것.
// 관련: memory/oauth_identity_conflict_session_loss.md

const WATCHED_KEY = 'sb-ecbmasjqlgqvwxkzapld-auth-token'

declare global {
  interface Window {
    __authTokenWatcherInstalled?: boolean
  }
}

export function installAuthTokenWatcher() {
  if (typeof window === 'undefined') return
  if (window.__authTokenWatcherInstalled) return
  window.__authTokenWatcherInstalled = true

  const originalSetItem = Storage.prototype.setItem
  const originalRemoveItem = Storage.prototype.removeItem
  const originalClear = Storage.prototype.clear

  Storage.prototype.setItem = function (this: Storage, key: string, value: string) {
    if (key === WATCHED_KEY) {
      console.log(`[auth-token-watcher] setItem("${key}") @ ${new Date().toISOString()}`)
      console.trace('[auth-token-watcher] setItem stack')
    }
    return originalSetItem.call(this, key, value)
  }

  Storage.prototype.removeItem = function (this: Storage, key: string) {
    if (key === WATCHED_KEY) {
      console.log(`[auth-token-watcher] removeItem("${key}") @ ${new Date().toISOString()}`)
      console.trace('[auth-token-watcher] removeItem stack')
    }
    return originalRemoveItem.call(this, key)
  }

  Storage.prototype.clear = function (this: Storage) {
    console.log(
      `[auth-token-watcher] clear() @ ${new Date().toISOString()} — wipes ALL localStorage keys including "${WATCHED_KEY}"`
    )
    console.trace('[auth-token-watcher] clear stack')
    return originalClear.call(this)
  }

  console.log(`[auth-token-watcher] installed, watching "${WATCHED_KEY}"`)
}
