"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { dayFromJoinDate, DEFAULT_ACTIVE_INTERVAL_DAYS, DEFAULT_BHA_INTERVAL_DAYS, RECIPES, TOTAL_DAYS, type Recipe, type ScheduleSettings } from "@/lib/schedule"
import {
  CURRENT_ENGINE_VERSION,
  generateCalendar,
} from "@/lib/scheduling-engine"
import {
  ensureAnonSession,
  loadRemoteState,
  saveActiveIngredients,
  saveAge,
  saveCalendar,
  saveCheckerResultUrl,
  saveConcern,
  saveConcernTags,
  saveCompletionFeedback,
  saveConditionLog,
  saveContextFlags,
  saveEngineVersion,
  saveFreeInputLog,
  saveGender,
  saveHabitLog,
  saveName,
  saveOverlap,
  saveRoutineStepToCheckerDiagnoses,
  saveSkinType,
  saveTier,
  saveSettings,
  saveUsedProducts,
} from "@/lib/supabase/sync"
import type { Concern, SupportId } from "@/lib/routine-copy"
import { heroImageSrcForDay } from "@/lib/hero-image"
import PRODUCTS_DATA from "@/lib/data/products.json"

export interface UsedProduct {
  id: string
  brand: string
  name: string
  lang: "ko" | "en"
}

interface DiaryState {
  /** 가입일(Day 1) — ISO 문자열 */
  joinDate: string
  /** usage_log에 슬롯이 탭된 날짜 목록 */
  loggedDays: number[]
  /** 이미 본 Weekly Mini Insight 마일스톤 (7, 14, 21, 28) */
  seenMilestones: number[]
  /** 날별 슬롯 기록: { day: [{ slot, tag }, ...] } */
  loggedSlots: Record<number, Array<{ slot: string; tag: string }>>
  conditions: Record<number, "good" | "neutral" | "bad">
  /** 날별 자유입력 메모 — day당 1건, 재저장 시 덮어쓴다 */
  freeInputs: Record<number, string>
  /** BHA/레티놀 도입 간격 슬라이더. 아무것도 안 건드리면 워크북 기본값(7/7)을 그대로 쓴다 */
  settings: ScheduleSettings
  /** 루틴 문구에 강조할 관심사. 스케줄 계산과는 무관하고 문구에만 영향을 준다 */
  concern: Concern
  /** 유저가 이미 갖고 있다고 답한 성분 id 목록 */
  supportOwned: SupportId[]
  /** 온보딩에서 선택한 고민케어 사용 성분 — 레티놀/비타민C/나이아신아마이드/모름, 리포트 카피 분기용 */
  activeIngredients: string[]
  /** 체커에서 전달받은 제품 목록 (Day 0 온보딩 시에만 저장, 갱신은 별도 self-report 기능에서 처리 예정) */
  usedProducts: UsedProduct[] | null
  /**
   * 이 유저의 데이터가 마지막으로 확인된 엔진 버전. null이면 이 필드가 생기기 전의
   * 레거시 상태 — CURRENT_ENGINE_VERSION과 다르면 하이드레이션 직후 갱신한다.
   */
  engineVersion: string | null
  /** 피부 기록 수집에 동의했는지 여부 (온보딩 1단계) */
  dataConsent: boolean
  /** 동의한 시점 (ISO 8601 형식, UTC) */
  dataConsentAt: string | null
  /** 체커에서 선택한 피부 타입 (sensitive/dry/combo/oily) */
  skinType: string | null
  /** 체커에서 선택한 나이대 (teen/20s/30s/40s/50s/60s_plus) */
  age: string | null
  /** 체커의 beauty_concerns (DRY,TONE 등 콤마 구분) */
  concernTags: string | null
  /** 성분 겹침 개수 */
  overlap: number | null
  /** 진단 등급 (0/1/2) */
  tier: string | null
  /** 체커 Q1에서 선택한 성별 (female/male/other/unspecified) */
  gender: string | null
  /** 다이어리 커버에서 입력한 이름 (선택, 미입력 시 null) */
  name: string | null
  /** 체커 자신의 결과 화면(성분 리스트, 컨설턴트 코멘트 등)을 재현하는 링크 */
  checkerResultUrl: string | null
}

/** 로그아웃 시 로컬 캐시를 지우는 용도로도 쓰인다(login-banner.tsx) */
export const STORAGE_KEY = "hoppy-skin-diary-v1"
/**
 * [2026-08-09] STORAGE_KEY에 저장된 진단 데이터가 어느 userId 소유인지 기록해두는 태그.
 * 다른 계정으로 로그인 전환(signInExistingIdentity 등)했을 때, 하이드레이션이 "로컬에
 * 뭐라도 있으면 무조건 그걸 신뢰"하던 기존 방식이 소유자 확인을 전혀 안 해서 다른 계정의
 * 원격 기록을 못 불러오던 버그의 수정 — 태그 없는(이 수정 이전) 로컬 데이터는 하위호환으로
 * "내 것"으로 간주한다.
 */
const OWNER_STORAGE_KEY = "hoppy-skin-diary-v1-owner"
/** 소유자 불일치로 원격 데이터를 우선하게 될 때, 실제 기록이 있던 로컬 데이터를 조용히
 * 버리지 않고 백업해두는 키 접두사. UI 노출은 없고, 필요 시 개발자가 브라우저 스토리지에서
 * 직접 복구할 수 있는 수준의 안전망이다. */
const ORPHANED_BACKUP_PREFIX = "hoppy-skin-diary-v1-orphaned-"

function todayISO() {
  return new Date().toISOString()
}

function freshState(): DiaryState {
  return {
    joinDate: todayISO(),
    loggedDays: [],
    seenMilestones: [],
    loggedSlots: {},
    conditions: {},
    freeInputs: {},
    settings: {},
    concern: "none",
    supportOwned: [],
    activeIngredients: [],
    usedProducts: null,
    engineVersion: null,
    dataConsent: false,
    dataConsentAt: null,
    skinType: null,
    age: null,
    concernTags: null,
    overlap: null,
    tier: null,
    gender: null,
    name: null,
    checkerResultUrl: null,
  }
}

function loadLocalState(): DiaryState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DiaryState>
    const fresh = freshState()
    return {
      joinDate: parsed.joinDate ?? fresh.joinDate,
      loggedDays: parsed.loggedDays ?? [],
      seenMilestones: parsed.seenMilestones ?? [],
      loggedSlots: parsed.loggedSlots ?? {},
      conditions: parsed.conditions ?? {},
      freeInputs: parsed.freeInputs ?? {},
      settings: parsed.settings ?? {},
      concern: parsed.concern ?? "none",
      supportOwned: parsed.supportOwned ?? [],
      activeIngredients: parsed.activeIngredients ?? [],
      usedProducts: parsed.usedProducts ?? null,
      engineVersion: parsed.engineVersion ?? null,
      dataConsent: parsed.dataConsent ?? false,
      dataConsentAt: parsed.dataConsentAt ?? null,
      skinType: parsed.skinType ?? null,
      age: parsed.age ?? null,
      concernTags: parsed.concernTags ?? null,
      overlap: parsed.overlap ?? null,
      tier: parsed.tier ?? null,
      gender: parsed.gender ?? null,
      name: parsed.name ?? null,
      checkerResultUrl: parsed.checkerResultUrl ?? null,
    }
  } catch {
    return null
  }
}

/** STORAGE_KEY의 로컬 데이터가 어느 userId 소유인지 읽는다. 태그가 없으면(이 수정 이전
 * 데이터, 또는 애초에 저장된 적 없음) null을 반환한다. */
function loadLocalOwner(): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(OWNER_STORAGE_KEY)
  } catch {
    return null
  }
}

/** 소유자가 다른 로컬 데이터를 원격 데이터로 대체하기 전, 실제 기록이 있으면 별도 키로
 * 백업해 조용히 유실되지 않게 한다. UI로 노출하지 않는 안전망이라 console.warn으로만 남긴다. */
function backupOrphanedLocalState(localState: DiaryState): void {
  if (typeof window === "undefined") return
  try {
    const backupKey = `${ORPHANED_BACKUP_PREFIX}${Date.now()}`
    window.localStorage.setItem(backupKey, JSON.stringify(localState))
    console.warn(
      `[useDiary] 로컬 기록(${localState.loggedDays.length}일치)이 현재 로그인 계정 소유가 아니라 ` +
        `원격 데이터로 대체됩니다. 백업: localStorage["${backupKey}"]`
    )
  } catch {
    // 백업 실패해도 원격 데이터 로드는 계속 진행 — 백업은 최선 노력 수준의 안전망이다
  }
}

/** 동적으로 생성: products.json에서 모든 id 추출 */
const VALID_PRODUCT_IDS = new Set(PRODUCTS_DATA.map(p => p.id))
const PRODUCTS_BY_ID = new Map(
  PRODUCTS_DATA.map(p => [p.id, p])
)

/** 체커(checker.html)에서 돌아올 때 실려오는, 스케줄과 무관한 부가 정보 */
interface URLContextPayload {
  concern: Concern
  supportOwned: SupportId[]
  usedProducts: UsedProduct[] | null
  skinType: string | null
  age: string | null
  concernTags: string | null
  overlap: number | null
  tier: string | null
  gender: string | null
  /** diary_profiles가 아니라 checker_diagnoses의 최근 진단 행에 반영된다 (아래 하이드레이션 effect 참고) */
  routineStep: string | null
  /** 체커 자신의 결과 화면을 재현하는 링크. skinType 등과 동일하게 diary_profiles에 반영된다 */
  checkerResultUrl: string | null
}

const VALID_CONCERNS: Concern[] = ["dry", "flush", "flaky", "trouble", "none"]
const VALID_SUPPORT_IDS: SupportId[] = ["hya", "cica", "nia", "cer"]
const VALID_SKIN_TYPES = ["sensitive", "dry", "combo", "oily"]
const VALID_AGES = ["teen", "20s", "30s", "40s", "50s", "60s_plus"]
const VALID_CONCERN_TAGS = ["DRY", "TONE", "TEXTURE", "TROUBLE", "AGING", "BARRIER"]
const VALID_TIERS = ["0", "1", "2"]
const VALID_GENDERS = ["female", "male", "other", "unspecified"]

function parseConcern(raw: string | null): Concern {
  return VALID_CONCERNS.includes(raw as Concern) ? (raw as Concern) : "none"
}

function parseSkinType(raw: string | null): string | null {
  return raw && VALID_SKIN_TYPES.includes(raw) ? raw : null
}

function parseAge(raw: string | null): string | null {
  return raw && VALID_AGES.includes(raw) ? raw : null
}

function parseGender(raw: string | null): string | null {
  return raw && VALID_GENDERS.includes(raw) ? raw : null
}

function parseConcernTags(raw: string | null): string | null {
  if (!raw) return null
  const tags = raw.split(",").map(t => t.trim())
  const validTags = tags.filter(t => VALID_CONCERN_TAGS.includes(t))
  return validTags.length > 0 ? validTags.join(",") : null
}

function parseOverlap(raw: string | null): number | null {
  if (!raw) return null
  const num = parseInt(raw, 10)
  return isNaN(num) ? null : num
}

function parseTier(raw: string | null): string | null {
  return raw && VALID_TIERS.includes(raw) ? raw : null
}

/** routine_step은 값의 종류가 아직 고정되지 않아 화이트리스트 없이 길이만 제한한다 */
function parseRoutineStep(raw: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed.slice(0, 100) : null
}

/**
 * 체커 결과 화면 링크. target="_blank"로 그대로 여는 값이라 http/https가 아닌
 * 스킴(javascript: 등)은 걸러낸다. URLSearchParams가 이미 퍼센트 디코딩을 해준다.
 */
function parseCheckerResultUrl(raw: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (trimmed.length === 0 || trimmed.length > 2000) return null
  try {
    const url = new URL(trimmed)
    return url.protocol === "http:" || url.protocol === "https:" ? trimmed : null
  } catch {
    return null
  }
}

function parseSupportOwned(raw: string | null): SupportId[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id): id is SupportId => VALID_SUPPORT_IDS.includes(id as SupportId))
}

function parseItems(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map(id => id.trim())
    .filter(id => VALID_PRODUCT_IDS.has(id))
}

function buildProductDetails(itemIds: string[]): UsedProduct[] {
  return itemIds
    .map(id => {
      const product = PRODUCTS_BY_ID.get(id)
      return product
        ? {
            id: product.id,
            brand: product.brand,
            name: product.name,
            lang: product.lang,
          }
        : null
    })
    .filter((p): p is UsedProduct => p !== null)
}

/**
 * 외부 진단 화면(myroutinediet.com의 checker.html)에서 넘어올 때 쓰는 URL 파라미터를 읽는다.
 * ?skin_type={sensitive/dry/combo/oily}&concern={dry/flush/flaky/trouble/none}
 * &support={hya,cica,nia,cer 콤마 구분}&items={...}&age={teen/20s/30s/40s/50s/60s_plus}
 * &beauty_concerns={DRY,TONE 등 콤마 구분}&overlap={숫자}&tier={0/1/2}
 * &gender={female/male/other/unspecified}&routine_step={자유 문자열}
 * &checker_result_url={인코딩된 링크}
 *
 * type/preg/rx/compat_score는 의도적으로 파싱하지 않는다: preg/rx는 diary_profiles
 * 컬럼이 삭제된 이력이 있고(0015 마이그레이션), type/compat_score는 현재 값의 용도가
 * 불분명해 저장 대상에서 제외했다(2026-08-13 결정). routine_step만 예외적으로 받되,
 * diary_profiles가 아니라 checker_diagnoses의 최근 진단 행에 반영된다 — applyURLContext가
 * 아니라 하이드레이션 effect에서 별도로 처리하는 이유가 이 때문이다. checker_result_url은
 * skinType 등과 동일하게 diary_profiles에 반영된다(기기 바뀌어도 ReportCard에서 다시
 * 보여줘야 해서, routine_step과 달리 checker_diagnoses가 아니다).
 */
function contextFromURL(): URLContextPayload | null {
  if (typeof window === "undefined") return null
  const params = new URLSearchParams(window.location.search)

  const hasSkinType = params.get("skin_type") !== null
  const hasConcern = params.get("concern") !== null
  const hasSupport = params.get("support") !== null
  const hasItems = params.get("items") !== null
  const hasAge = params.get("age") !== null
  const hasBeautyConcerns = params.get("beauty_concerns") !== null
  const hasOverlap = params.get("overlap") !== null
  const hasTier = params.get("tier") !== null
  const hasGender = params.get("gender") !== null
  const hasRoutineStep = params.get("routine_step") !== null
  const hasCheckerResultUrl = params.get("checker_result_url") !== null

  if (!hasSkinType && !hasConcern && !hasSupport && !hasItems && !hasAge && !hasBeautyConcerns && !hasOverlap && !hasTier && !hasGender && !hasRoutineStep && !hasCheckerResultUrl) return null

  const itemIds = parseItems(params.get("items"))

  return {
    concern: parseConcern(params.get("concern")),
    supportOwned: parseSupportOwned(params.get("support")),
    usedProducts: itemIds.length > 0 ? buildProductDetails(itemIds) : null,
    skinType: parseSkinType(params.get("skin_type")),
    age: parseAge(params.get("age")),
    concernTags: parseConcernTags(params.get("beauty_concerns")),
    overlap: parseOverlap(params.get("overlap")),
    tier: parseTier(params.get("tier")),
    gender: parseGender(params.get("gender")),
    routineStep: parseRoutineStep(params.get("routine_step")),
    checkerResultUrl: parseCheckerResultUrl(params.get("checker_result_url")),
  }
}

/** 체커에서 돌아온 뒤 새로고침해도 같은 처리가 반복되지 않도록 URL에서 컨텍스트 파라미터를 지운다 */
function clearContextURLParams() {
  if (typeof window === "undefined") return
  const params = new URLSearchParams(window.location.search)
  for (const key of ["type", "preg", "rx", "concern", "support", "skin_type", "items", "age", "beauty_concerns", "overlap", "tier", "gender", "routine_step", "checker_result_url"]) {
    params.delete(key)
  }
  const query = params.toString()
  window.history.replaceState({}, "", window.location.pathname + (query ? `?${query}` : ""))
}

/**
 * 진단 결과 정보를 자동 적용 (usedProducts, skinType, age, concernTags, overlap, tier, gender,
 * concern, supportOwned). 체커를 항상 거쳐 들어온다는 전제이므로 "체커 데이터 있음/없음"을
 * 가려서 임시 보류했다가 나중에 확인받고 적용하는 단계 없이, 파싱된 값을 곧바로 반영한다.
 */
function applyURLContext(base: DiaryState, context: URLContextPayload | null): DiaryState {
  if (!context) return base
  return {
    ...base,
    usedProducts: context.usedProducts,
    skinType: context.skinType,
    age: context.age,
    concernTags: context.concernTags,
    overlap: context.overlap,
    tier: context.tier,
    gender: context.gender,
    concern: context.concern,
    supportOwned: context.supportOwned,
    // 이 값만 예외적으로 "없으면 기존 값 유지"로 병합한다 — ReportCard의 "검사지 보기"
    // 링크가 이 값 하나에 의존하는데, 다른 필드처럼 매번 덮어쓰면 checker_result_url이
    // 없는 URL로 재방문할 때(예: 파라미터 일부만 들고 오는 경우) 이미 저장해둔 링크가
    // null로 지워져버린다.
    checkerResultUrl: context.checkerResultUrl ?? base.checkerResultUrl,
  }
}

export function useDiary() {
  // 하이드레이션 불일치를 피하기 위해 초기엔 기본값, 마운트 후 localStorage 로드
  const [state, setState] = useState<DiaryState>(freshState)
  const [hydrated, setHydrated] = useState(false)

  // Supabase 익명 세션 — localStorage가 여전히 1차 캐시이고, 이건 기기 간 복원용 백엔드다.
  // 아래 하이드레이션 effect도 소유자 비교를 위해 독립적으로 ensureAnonSession()을 호출하는데,
  // 두 곳 다 같은 캐시된 promise(anonSessionPromise)를 공유해서 중복 요청은 아니다.
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    ensureAnonSession().then((id) => {
      if (!cancelled) setUserId(id)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const localState = loadLocalState()
      const urlContext = contextFromURL()

      // [2026-08-09] 로컬 데이터를 신뢰하기 전에 지금 로그인된 userId부터 확인한다 — 이전엔
      // 로컬에 뭐라도 있으면 소유자 확인 없이 무조건 그걸 썼는데, 다른 계정으로 로그인
      // 전환(signInExistingIdentity 등)했을 때 그 계정의 원격 기록을 영영 못 불러오는
      // 버그가 있었다(로컬 데이터가 이전 세션/다른 계정 것이어도 구분 못 함).
      const userId = await ensureAnonSession()
      if (cancelled) return

      // routine_step은 diary_profiles가 아니라 checker_diagnoses의 최근 진단 행에
      // 반영된다 — applyURLContext(로컬 state 갱신)와는 별개의 side effect라 여기서
      // 한 번만 fire-and-forget으로 처리한다. userId를 못 구했으면 매칭할 방법이 없어 건너뛴다.
      if (userId && urlContext?.routineStep) {
        saveRoutineStepToCheckerDiagnoses(userId, urlContext.routineStep).catch((err) => {
          console.warn("[saveRoutineStepToCheckerDiagnoses] error:", err)
        })
      }

      const localOwner = loadLocalOwner()
      // userId를 못 구했으면(Supabase 미설정 등) 소유자 비교가 불가능하니 기존 동작대로
      // 로컬을 그대로 신뢰한다. 태그가 없는 로컬 데이터(이 수정 이전 유저)도 하위호환으로
      // "내 것"으로 간주한다.
      const ownerMatches = !userId || localOwner === null || localOwner === userId

      if (localState && ownerMatches) {
        // 이 기기에 이미 진행 중인 로컬 기록이 있고, 지금 로그인된 계정 소유가 맞다 —
        // joinDate/진행 기록은 그대로 두고, 체커에서 돌아온 경우라면 concern/support 같은
        // 부가 정보만 갱신한다
        setState(applyURLContext(localState, urlContext))
        if (urlContext) clearContextURLParams()
        setHydrated(true)
        return
      }

      if (localState && !ownerMatches && localState.loggedDays.length > 0) {
        // 소유자가 다른데 로컬에 실제 기록이 있다 — 조용히 버리지 않고 별도 키로 백업해둔다
        backupOrphanedLocalState(localState)
      }

      // 로컬 기록이 없거나(신규 기기) 소유자가 다르다(계정 전환) — 로그인 계정이면 다른
      // 기기에서 이어오던 원격 기록이 있는지 확인한다 (없으면 새 계정으로 보고 기본 워크북
      // 시퀀스를 새로 시작)
      const remote = userId ? await loadRemoteState(userId) : null
      if (cancelled) return

      const base: DiaryState = remote
        ? {
            ...freshState(),
            joinDate: remote.profile.signupDate,
            settings: remote.profile.settings,
            concern: remote.profile.concern,
            supportOwned: remote.profile.supportOwned,
            activeIngredients: remote.profile.activeIngredients,
            engineVersion: remote.profile.engineVersion,
            skinType: remote.profile.skinType,
            age: remote.profile.age,
            concernTags: remote.profile.concernTags,
            overlap: remote.profile.overlap,
            tier: remote.profile.tier,
            gender: remote.profile.gender,
            checkerResultUrl: remote.profile.checkerResultUrl,
            name: remote.profile.name,
            loggedDays: Object.keys(remote.loggedSlots).map(Number).sort((a, b) => a - b),
            loggedSlots: remote.loggedSlots,
            conditions: remote.conditions,
            freeInputs: remote.freeInputs,
          }
        : freshState()

      setState(applyURLContext(base, urlContext))
      if (urlContext) clearContextURLParams()
      setHydrated(true)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      // 소유자 태그를 상태와 함께 갱신한다 — userId가 아직 안 풀렸으면(드문 타이밍) 이번엔
      // 건너뛰고 userId effect가 값을 채운 뒤 이 effect가 재실행될 때 같이 써진다.
      if (userId) window.localStorage.setItem(OWNER_STORAGE_KEY, userId)
    } catch {
      // 저장 실패는 무시 (사파리 프라이빗 모드 등)
    }
  }, [state, hydrated, userId])

  // 캐시 무효화. 엔진 로직이 바뀔 때마다 CURRENT_ENGINE_VERSION을 올리도록 강제하는 릴리스 체크포인트다.
  useEffect(() => {
    if (!hydrated || state.engineVersion === CURRENT_ENGINE_VERSION) return
    setState((prev) => (prev.engineVersion === CURRENT_ENGINE_VERSION ? prev : { ...prev, engineVersion: CURRENT_ENGINE_VERSION }))
  }, [hydrated, state.engineVersion])

  useEffect(() => {
    if (!userId || state.engineVersion !== CURRENT_ENGINE_VERSION) return
    saveEngineVersion(userId, state.joinDate, CURRENT_ENGINE_VERSION)
  }, [userId, state.joinDate, state.engineVersion])

  const currentDay = dayFromJoinDate(state.joinDate)

  /**
   * 온보딩 완료 여부를 별도 필드 없이 판단한다. completeOnboarding()이 항상 두 값을
   * 함께 채워 넣으므로(둘 다 undefined 아니면 온보딩 끝난 것), 새 컬럼/로컬 필드가
   * 필요 없다.
   */
  const onboarded = state.settings.activeIntervalDays !== undefined && state.settings.bhaIntervalDays !== undefined

  const calendar = useMemo(
    () => generateCalendar({ signupDate: state.joinDate, settings: state.settings }),
    [state.joinDate, state.settings],
  )

  const totalDays = calendar.length

  // 상단 여정 카드 히어로 이미지 — BHA가 새로 들어가는 날마다 다음 사이클 이미지로 바뀐다
  const heroImageSrc = useMemo(() => heroImageSrcForDay(calendar, currentDay), [calendar, currentDay])

  // 스케줄 설정 + 캘린더 진행 상황(완료 여부 포함)을 diary_profiles / calendar_entries에 반영한다
  //
  // [Bug fix] 모든 sync effect가 userId만 확인하고 hydrated는 확인하지 않았다. userId를
  // 세팅하는 effect(위)와 원격 프로필을 state에 반영하는 하이드레이션 effect가 서로 독립적으로
  // 실행되는데, ensureAnonSession()은 캐시된 세션이면 빠르게 끝나는 반면 loadRemoteState()는
  // 네트워크 왕복이 필요해 더 오래 걸린다 — 그 사이에 userId는 채워졌지만 state는 아직
  // freshState()(전부 null)인 렌더가 실제로 발생했고, 이 순간 아래 모든 effect가 null 값으로
  // diary_profiles를 upsert해 방금 복원했어야 할 기존 프로필을 통째로 덮어썼다. hydrated는
  // localStorage/원격 복원이 끝나고 state가 실제 값으로 세팅된 시점에만 true가 되므로, 이
  // 가드 하나로 레이스를 원천 차단한다.
  useEffect(() => {
    if (!userId || !hydrated) return
    saveSettings(userId, state.joinDate, state.settings)
    saveCalendar(
      userId,
      calendar.map((entry) => ({ ...entry, completed: state.loggedDays.includes(entry.day) })),
    )
  }, [userId, hydrated, state.joinDate, state.settings, state.loggedDays, calendar])

  // 루틴 문구에 강조할 관심사 + 보유 성분
  useEffect(() => {
    if (!userId || !hydrated) return
    saveConcern(userId, state.joinDate, state.concern, state.supportOwned)
  }, [userId, hydrated, state.joinDate, state.concern, state.supportOwned])

  // 체커에서 선택한 피부 타입
  useEffect(() => {
    if (!userId || !hydrated) return
    saveSkinType(userId, state.joinDate, state.skinType)
  }, [userId, hydrated, state.joinDate, state.skinType])

  // 체커에서 선택한 나이대
  useEffect(() => {
    if (!userId || !hydrated) return
    saveAge(userId, state.joinDate, state.age)
  }, [userId, hydrated, state.joinDate, state.age])

  // 체커 Q1에서 선택한 성별
  useEffect(() => {
    if (!userId || !hydrated) return
    saveGender(userId, state.joinDate, state.gender)
  }, [userId, hydrated, state.joinDate, state.gender])

  // 다이어리 커버에서 입력한 이름
  useEffect(() => {
    if (!userId || !hydrated) return
    saveName(userId, state.joinDate, state.name)
  }, [userId, hydrated, state.joinDate, state.name])

  // 체커의 beauty_concerns
  useEffect(() => {
    if (!userId || !hydrated) return
    saveConcernTags(userId, state.joinDate, state.concernTags)
  }, [userId, hydrated, state.joinDate, state.concernTags])

  // 성분 겹침 개수
  useEffect(() => {
    if (!userId || !hydrated) return
    saveOverlap(userId, state.joinDate, state.overlap)
  }, [userId, hydrated, state.joinDate, state.overlap])

  // 진단 등급
  useEffect(() => {
    if (!userId || !hydrated) return
    saveTier(userId, state.joinDate, state.tier)
  }, [userId, hydrated, state.joinDate, state.tier])

  // 체커 결과 화면 링크 — ReportCard "검사지 보기"가 이 값을 연다
  useEffect(() => {
    if (!userId || !hydrated) return
    saveCheckerResultUrl(userId, state.joinDate, state.checkerResultUrl)
  }, [userId, hydrated, state.joinDate, state.checkerResultUrl])

  // 데일리슬롯 "고민케어" 드롭다운에서 누적된 성분 목록
  useEffect(() => {
    if (!userId || !hydrated) return
    saveActiveIngredients(userId, state.joinDate, state.activeIngredients)
  }, [userId, hydrated, state.joinDate, state.activeIngredients])

  const getRecipeForDay = useCallback(
    (day: number): Recipe => {
      const entry = calendar.find((e) => e.day === day)
      return entry ? entry.recipe : RECIPES.defense_barrier
    },
    [calendar],
  )

  const setSettings = useCallback((settings: ScheduleSettings) => {
    setState((prev) => ({ ...prev, settings }))
  }, [])

  /**
   * Step Q 답변을 로컬 state에 반영한다. 여기서 직접 Supabase에 쓰지 않는 이유:
   * 이미 skinType/concernTags를 감시하는 sync effect(아래 saveSkinType/saveConcernTags
   * 호출)가 있고, completeOnboarding()이 joinDate를 바꿀 때 그 effect가 재실행되며
   * state 값으로 덮어쓴다 — Step Q가 로컬 state를 안 거치고 Supabase에 직접 쓰면
   * 이 재실행이 방금 쓴 값을 stale null로 도로 덮어써버린다.
   */
  const setSkinType = useCallback((skinType: string | null) => {
    setState((prev) => ({ ...prev, skinType }))
  }, [])

  const setConcernTags = useCallback((concernTags: string | null) => {
    setState((prev) => ({ ...prev, concernTags }))
  }, [])

  /** Step Q에서 성별을 직접 답한 경우 로컬 state에 반영한다. skinType/concernTags와 동일한 이유로 여기서 직접 Supabase에 쓰지 않는다 (위 saveGender sync effect가 감시) */
  const setGender = useCallback((gender: string | null) => {
    setState((prev) => ({ ...prev, gender }))
  }, [])

  /** 다이어리 커버에서 이름을 입력/스킵한 경우 로컬 state에 반영한다 */
  const setName = useCallback((name: string | null) => {
    setState((prev) => ({ ...prev, name }))
  }, [])

  /** Step Q에서 나이대를 직접 답한 경우 로컬 state에 반영한다. setGender와 동일한 이유로 여기서 직접 Supabase에 쓰지 않는다 (위 saveAge sync effect가 감시) */
  const setAge = useCallback((age: string | null) => {
    setState((prev) => ({ ...prev, age }))
  }, [])

  /**
   * 데일리슬롯 "고민케어" 드롭다운에서 성분을 선택하면 호출된다. 그날 기록을 지워도(체크
   * 해제) 이 목록에서는 빼지 않는다 — 한 번이라도 쓴다고 답한 성분은 성분 경고 카드 등에서
   * 계속 참고할 값이라 "이 사람이 지금까지 답한 성분들의 누적 집합"으로 취급한다.
   */
  const addActiveIngredient = useCallback((ingredientId: string) => {
    setState((prev) =>
      prev.activeIngredients.includes(ingredientId)
        ? prev
        : { ...prev, activeIngredients: [...prev.activeIngredients, ingredientId] },
    )
  }, [])

  /**
   * 온보딩 consent 단계 전용. activeIntervalDays/bhaIntervalDays를 항상 같은
   * 값으로 한 번에 채워 넣고(온보딩 판단 기준이 "둘 다 있는지"라 절대 따로 저장되면
   * 안 된다), 가입일(Day 1)도 이 순간으로 스탬프한다 — 온보딩을 보는 동안은 아직
   * Day 1이 시작되지 않은 것으로 취급한다. StepQ가 사라지면서 activeIngredients/condition은
   * 더 이상 온보딩 시점에 묻지 않는다(고민케어 성분은 데일리슬롯에서, 컨디션은 daily_checkin에서).
   */
  const completeOnboarding = useCallback(
    async (dataConsent: boolean) => {
      const now = todayISO()
      setState((prev) => ({
        ...prev,
        joinDate: now,
        settings: { activeIntervalDays: DEFAULT_ACTIVE_INTERVAL_DAYS, bhaIntervalDays: DEFAULT_BHA_INTERVAL_DAYS },
        dataConsent,
        dataConsentAt: dataConsent ? now : null,
      }))
      if (userId) {
        // diary_profiles 행이 반드시 먼저 생성되도록 await
        await saveContextFlags(userId, now, { dataConsent })

        // 이후 used_products 저장 (fire-and-forget, 위의 await로 안전성 보장)
        // Day 0 전용: 갱신은 별도 self-report 기능에서 처리 예정
        if (state.usedProducts) {
          saveUsedProducts(userId, now, state.usedProducts)
        }
      }
    },
    [userId, state.usedProducts],
  )

  const recordLoggedDay = useCallback((day: number) => {
    setState((prev) =>
      prev.loggedDays.includes(day) ? prev : { ...prev, loggedDays: [...prev.loggedDays, day] },
    )
  }, [])

  const markMilestoneAsSeen = useCallback((milestone: number) => {
    setState((prev) =>
      prev.seenMilestones.includes(milestone) ? prev : { ...prev, seenMilestones: [...prev.seenMilestones, milestone] },
    )
  }, [])

  const recordLoggedSlot = useCallback((day: number, slot: string, tag: string) => {
    setState((prev) => {
      const daySlots = prev.loggedSlots[day] ?? []
      const newSlots = [...daySlots, { slot, tag }]

      const newLoggedDays = prev.loggedDays.includes(day) ? prev.loggedDays : [...prev.loggedDays, day]

      return { ...prev, loggedSlots: { ...prev.loggedSlots, [day]: newSlots }, loggedDays: newLoggedDays }
    })
  }, [])



  const recordCondition = useCallback(
    (day: number, condition: "good" | "neutral" | "bad") => {
      setState((prev) => {
        if (userId) {
          const recipe = getRecipeForDay(day)
          saveConditionLog(userId, day, condition, "daily_checkin", recipe.type)
        }
        return { ...prev, conditions: { ...prev.conditions, [day]: condition } }
      })
    },
    [userId, getRecipeForDay],
  )

  /** day당 1건, 재저장 시 덮어쓴다(서버는 upsert, 로컬은 값 교체) */
  const recordFreeInput = useCallback(
    (day: number, content: string) => {
      if (userId) saveFreeInputLog(userId, day, content)
      setState((prev) => ({ ...prev, freeInputs: { ...prev.freeInputs, [day]: content } }))
    },
    [userId],
  )

  /**
   * 설정 화면의 "루틴 처음부터 다시 시작하기" 버튼 전용. 체커 재방문 흐름과는 완전히
   * 분리된, 유저가 직접 요청한 명시적 초기화다 — 가입일을 오늘로 재설정해 진행 기록을
   * 지우되, 슬라이더 설정·관심사·보유 성분 등 개인화 정보는 그대로 유지한다.
   */
  const startFresh = useCallback(() => {
    setState((prev) => ({ ...prev, joinDate: todayISO(), conditions: {} }))
  }, [])

  const submitFeedback = useCallback(
    async (feedbackText: string) => {
      if (!userId) return
      await saveCompletionFeedback(userId, feedbackText)
    },
    [userId],
  )

  return {
    hydrated,
    onboarded,
    completeOnboarding,
    currentDay,
    totalDays,
    heroImageSrc,
    calendar,
    loggedDays: state.loggedDays,
    recordLoggedDay,
    loggedSlots: state.loggedSlots,
    recordLoggedSlot,
    seenMilestones: state.seenMilestones,
    markMilestoneAsSeen,
    conditions: state.conditions,
    recordCondition,
    freeInputs: state.freeInputs,
    recordFreeInput,
    settings: state.settings,
    setSettings,
    getRecipeForDay,
    concern: state.concern,
    supportOwned: state.supportOwned,
    activeIngredients: state.activeIngredients,
    addActiveIngredient,
    usedProducts: state.usedProducts,
    skinType: state.skinType,
    setSkinType,
    age: state.age,
    setAge,
    concernTags: state.concernTags,
    setConcernTags,
    overlap: state.overlap,
    tier: state.tier,
    gender: state.gender,
    setGender,
    name: state.name,
    setName,
    checkerResultUrl: state.checkerResultUrl,
    userId,
    joinDate: state.joinDate,
    startFresh,
    submitFeedback,
  }
}
