/**
 * 호빵이 추천 픽 (어필리에이트) — 오늘 DO로 선정된 핵심 케어의 slot + 연령대에 맞춰
 * 카테고리가 겹치지 않는 3~4개 제품을 룩북으로 노출한다.
 *
 * 큐레이션 방향: 10~20만 원대 초고가 럭셔리 라인은 배제하고, "성분·장벽 밀폐력이
 * 검증된 실용 고보습/더마 베스트셀러"(에스트라 아토베리어365, 피지오겔 DMT, 일리윤
 * 세라마이드 아토, 라로슈포제 시카플라스트 B5+ 등) 위주로 구성한다.
 *
 * imageUrl — 카드 상단 대표 이미지. 브랜드/리뷰 플랫폼의 공개 제품 컷을 그대로
 *   핫링크한다(카드에서 <img referrerPolicy="no-referrer">로 렌더 → next.config 도메인
 *   허용 불필요). 값이 없으면 카드가 빈 미색 패널로 폴백한다.
 *   ※ 쿠팡 파트너스 단축 링크(link.coupang.com/a/…)에는 이미지 정보가 없어
 *     imageUrl로 쓸 수 없다 — 반드시 별도 이미지 URL을 지정해야 한다.
 *
 * affiliateUrl — 클릭 시 열리는 링크. 문자열(공용) 또는 { ko, en }. http로 시작하지
 *   않으면 oy()(올리브영 검색)로 감싼다.
 */

import type { SlotType } from "@/lib/slot-mapping"
import { getDoSkipPlan, type AgeGroup, type SkinWeather } from "@/lib/skin-weather"
import type { Locale } from "@/lib/i18n"

/** 큐레이션 성격 태그 — 초고가 '프리미엄'은 걷어내고 '고보습'(더마 밀폐 라인)으로 대체 */
export type CurationTag = "가성비" | "순한 성분" | "민감성" | "고보습"

/** 단일 공용 URL 또는 locale별 URL */
export type LocalizedUrl = string | { ko: string; en: string }

export interface AffiliatePick {
  /** 큐레이션 태그 (선택) */
  tag?: CurationTag
  brand: string
  /** 제품명 (용량·SPF 등 포함 가능) */
  title: string
  /** 한 줄 추천 이유 — "오늘 날씨에 왜 이게 맞는지" (~25자 권장) */
  description: string
  /** 카드 상단 대표 이미지 URL (공개 제품 컷 핫링크). 없으면 미색 패널 폴백 */
  imageUrl?: string
  /** 클릭 시 새 창(_blank)으로 열리는 링크. 문자열(공용) 또는 { ko, en } */
  affiliateUrl: LocalizedUrl
}

/** slot 하나당: default 배열 필수 + 연령대별 오버라이드 배열은 선택 */
type PickTable = { default: AffiliatePick[] } & Partial<Record<AgeGroup, AffiliatePick[]>>

const oy = (q: string) =>
  `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(q)}`

const toUrl = (s: string) => (s.startsWith("http") ? s : oy(s))

/**
 * 현재 locale에 맞는 최종 URL 문자열을 고른다.
 * 문자열이면 그대로, { ko, en }이면 해당 locale → 없으면 반대쪽으로 폴백.
 */
export function resolveAffiliateUrl(url: LocalizedUrl, locale: Locale): string {
  if (typeof url === "string") return url
  return url[locale] || url.ko || url.en
}

/**
 * 제품 대표 이미지 (브랜드/리뷰 플랫폼 공개 컷). 카드에서 그대로 핫링크한다.
 * 키는 아래 p() 항목의 imageUrl 인자에서 참조한다.
 */
const IMG = {
  ilyeonAtoLotion: "https://dn5hzapyfrpio.cloudfront.net/product/676/676cd5d0-46ba-11ec-8f1f-dbc610dbb8fe.jpeg",
  aesturaAtobarrier365CreamPlus: "https://dn5hzapyfrpio.cloudfront.net/product/f83/f83a90b0-7348-11ec-b3af-9be365d70ca5.jpeg",
  lrpCicaplastB5: "https://dn5hzapyfrpio.cloudfront.net/home/glowmee/upload/20191206/1575599329454.jpg",
  physiogelDmt: "https://dn5hzapyfrpio.cloudfront.net/product/268/2686f5d0-36cc-11ec-a04a-933dab945114.jpeg",
  zeroidIntensive: "https://dn5hzapyfrpio.cloudfront.net/product/af8/af8672c0-d49e-11ef-b7a5-27ddae6ebd72.jpeg",
  roundlabDokdoToner: "https://dn5hzapyfrpio.cloudfront.net/product/47d/47d5b5b0-8572-11f1-9f6e-358bbfe373a3.jpeg",
  anuaHeartleafToner: "https://dn5hzapyfrpio.cloudfront.net/product/08c/08c654c0-bc3b-11eb-afcc-87e40c79f13e.jpeg",
  torridenDiveInSerum: "https://godomall-storage.cdn-nhncommerce.com/4d7876b81b0d37f8a7cfa4d402d68be4/goods/58/image/main/58_main_025.png",
  drgRedBlemishCicaSerum: "https://dn5hzapyfrpio.cloudfront.net/product/4ee/4ee14080-f25d-11ef-a09d-bdd28c06a35e.jpeg",
  joseonRiceSuncream: "https://dn5hzapyfrpio.cloudfront.net/product/175/175430b0-2833-11ed-a63d-677e4d744622.jpeg",
  roundlabBirchSuncream: "https://dn5hzapyfrpio.cloudfront.net/product/5ed/5ed6e5d0-7851-11ee-bdb8-a9fd59bf9d4f.jpeg",
  aesturaDermaUv365: "https://dn5hzapyfrpio.cloudfront.net/product/e9f/e9f851a0-df69-11ef-ba00-5bbd3c0050cf.jpeg",
  innisfreeRetinolCica: "https://dn5hzapyfrpio.cloudfront.net/product/a8e/a8eb3e10-7850-11ee-bdb8-a9fd59bf9d4f.jpeg",
  lrpMelaB3Serum: "https://dn5hzapyfrpio.cloudfront.net/product/0f0/0f0fdc80-0c41-11ef-9662-4fa46ae74dbe.jpeg",
  lrpHyaluB5Serum: "https://dn5hzapyfrpio.cloudfront.net/home/glowmee/upload/20180228/1519797636935.png",
} as const

/** 항목 작성 헬퍼 — 6번째 인자에 대표 이미지 URL 지정 (없으면 미색 패널 폴백) */
const p = (
  tag: CurationTag,
  brand: string,
  title: string,
  description: string,
  url: LocalizedUrl,
  imageUrl?: string,
): AffiliatePick => ({
  tag,
  brand,
  title,
  description,
  imageUrl,
  affiliateUrl: typeof url === "string" ? toUrl(url) : { ko: toUrl(url.ko), en: toUrl(url.en) },
})

export const AFFILIATE_PICKS: Partial<Record<SlotType, PickTable>> = {
  sun_care: {
    default: [
      p("가성비", "조선미녀", "맑은 쌀 선크림 SPF50+ PA++++", "얇고 촉촉하게 발리는 저자극 데일리 선크림, 부담 없는 가격", "https://link.coupang.com/a/gRhJwU7tDM", IMG.joseonRiceSuncream),
      p("순한 성분", "라운드랩", "자작나무 수분 선크림 SPF50+", "진정 성분 함유, 백탁 없이 촉촉하게 밀착되는 데일리", "https://link.coupang.com/a/gRhTorvc4a", IMG.roundlabBirchSuncream),
      p("고보습", "에스트라", "더마UV365 비타C 광채수분 선크림 SPF50+", "장벽 케어까지 겸하는 고보습·저자극 더마 선크림", "https://link.coupang.com/a/gRLlozuxYy", IMG.aesturaDermaUv365),
    ],
    "4050": [
      p("고보습", "에스트라", "더마UV365 비타C 광채수분 선크림 SPF50+", "UV에 지친 장벽을 달래는 고보습 더마 선크림", "https://link.coupang.com/a/gRLlozuxYy", IMG.aesturaDermaUv365),
      p("순한 성분", "라운드랩", "자작나무 수분 선크림 SPF50+", "건조함 없이 촉촉하게 밀착되는 저자극 데일리", "https://link.coupang.com/a/gRhTorvc4a", IMG.roundlabBirchSuncream),
      p("가성비", "조선미녀", "맑은 쌀 선크림 SPF50+ PA++++", "얇고 촉촉한 저자극 데일리, 덧바르기 부담 없는 가격", "https://link.coupang.com/a/gRhJwU7tDM", IMG.joseonRiceSuncream),
    ],
    "60plus": [
      p("고보습", "에스트라", "더마UV365 비타C 광채수분 선크림 SPF50+", "속건조·칙칙함까지 잡는 고보습 더마 선크림", "https://link.coupang.com/a/gRLlozuxYy", IMG.aesturaDermaUv365),
      p("순한 성분", "라운드랩", "자작나무 수분 선크림 SPF50+", "자극 없이 촉촉하게 밀착되는 저자극 데일리", "https://link.coupang.com/a/gRhTorvc4a", IMG.roundlabBirchSuncream),
    ],
  },

  hydration: {
    default: [
      p("가성비", "라운드랩", "1025 독도 토너", "자극받은 날 부담 없이 쓰는 대용량 진정 토너", "https://link.coupang.com/a/gRLKUVqNrw", IMG.roundlabDokdoToner),
      p("민감성", "아누아", "어성초 77 수딩 토너", "붉어짐·따가움 있는 날 물광 충전용 저자극 토너", "https://link.coupang.com/a/gRLTyZbxpA", IMG.anuaHeartleafToner),
      p("순한 성분", "닥터지", "레드 블레미쉬 클리어 시카 세럼", "진정과 수분을 한 번에 잡는 저자극 시카 세럼", "https://link.coupang.com/a/gRL2Z9gbpA", IMG.drgRedBlemishCicaSerum),
    ],
    "4050": [
      p("고보습", "토리든", "다이브인 저분자 히알루론산 세럼", "속건조 채우는 5종 히알루론산 고보습 세럼", "https://link.coupang.com/a/gRL6m1TvQy", IMG.torridenDiveInSerum),
      p("순한 성분", "닥터지", "레드 블레미쉬 클리어 시카 세럼", "지친 피부 진정 + 수분을 한 겹 더 올려주는 시카 세럼", "https://link.coupang.com/a/gRL2Z9gbpA", IMG.drgRedBlemishCicaSerum),
      p("민감성", "아누아", "어성초 77 수딩 토너", "붉어짐·예민한 날 물광 충전용 저자극 토너", "https://link.coupang.com/a/gRLTyZbxpA", IMG.anuaHeartleafToner),
    ],
    "60plus": [
      p("고보습", "토리든", "다이브인 저분자 히알루론산 세럼", "얇아진 피부 속건조를 채우는 5종 히알루론산 세럼", "https://link.coupang.com/a/gRL6m1TvQy", IMG.torridenDiveInSerum),
      p("순한 성분", "라운드랩", "1025 독도 토너", "자극 없이 수분을 겹겹이 채우는 대용량 진정 토너", "https://link.coupang.com/a/gRLKUVqNrw", IMG.roundlabDokdoToner),
    ],
  },

  barrier: {
    default: [
      p("가성비", "일리윤", "세라마이드 아토 로션", "건조·미세먼지 날 부담 없이 장벽 밀폐", "https://link.coupang.com/a/gRNcx7kbkq", IMG.ilyeonAtoLotion),
      p("순한 성분", "라로슈포제", "시카플라스트 밤 B5+", "각질·트러블·건조 부위 집중 진정 밀폐 밤", "https://link.coupang.com/a/gRNtMJzjd6", IMG.lrpCicaplastB5),
      p("고보습", "에스트라", "아토베리어365 크림 플러스", "장벽 회복에 집중한 고보습·밀폐 데일리 크림", "https://link.coupang.com/a/gRNk060rUy", IMG.aesturaAtobarrier365CreamPlus),
    ],
    "4050": [
      p("고보습", "에스트라", "아토베리어365 크림 플러스", "무너진 장벽을 채우고 덮는 검증된 고보습 더마 크림", "https://link.coupang.com/a/gRNk060rUy", IMG.aesturaAtobarrier365CreamPlus),
      p("순한 성분", "피지오겔", "데일리 모이스처 테라피 페이셜 크림", "무향·저자극으로 유수분막을 지켜주는 스테디셀러", "피지오겔 DMT 페이셜 크림", IMG.physiogelDmt),
      p("민감성", "라로슈포제", "시카플라스트 밤 B5+", "예민해진 부위를 집중 진정·밀폐하는 더마 밤", "https://link.coupang.com/a/gRNtMJzjd6", IMG.lrpCicaplastB5),
    ],
    "60plus": [
      p("고보습", "제로이드", "인텐시브 크림", "고농도 세라마이드로 수분 손실을 막는 밀폐 크림", "https://link.coupang.com/a/gRN1FGpHeC", IMG.zeroidIntensive),
      p("순한 성분", "에스트라", "아토베리어365 크림 플러스", "얇아진 장벽을 채워 덮는 고보습 더마 크림", "https://link.coupang.com/a/gRNk060rUy", IMG.aesturaAtobarrier365CreamPlus),
    ],
  },

  active: {
    default: [
      p("가성비", "이니스프리", "레티놀 시카 흔적 앰플", "자극 없는 날 밤 루틴에 더하는 입문용 저자극 레티놀", "https://link.coupang.com/a/gROa8QQiu4", IMG.innisfreeRetinolCica),
      p("민감성", "라로슈포제", "멜라 B3 세럼", "민감 피부용 나이아신아마이드, 낮 색소·톤 케어", "라로슈포제 멜라 B3 세럼", IMG.lrpMelaB3Serum),
      p("고보습", "라로슈포제", "히알루 B5 세럼", "히알루론산 + 판테놀로 탄력·볼륨을 채우는 더마 세럼", "라로슈포제 히알루 B5 세럼", IMG.lrpHyaluB5Serum),
    ],
    "4050": [
      p("고보습", "라로슈포제", "히알루 B5 세럼", "꺼진 볼륨·잔주름을 히알루론산 + 판테놀로 채우는 세럼", "라로슈포제 히알루 B5 세럼", IMG.lrpHyaluB5Serum),
      p("순한 성분", "라로슈포제", "멜라 B3 세럼", "낮 동안 받은 색소 스트레스를 줄이는 저자극 세럼", "라로슈포제 멜라 B3 세럼", IMG.lrpMelaB3Serum),
    ],
    "60plus": [
      p("고보습", "라로슈포제", "히알루 B5 세럼", "얇아진 피부에 탄력·수분을 채우는 히알루론산 세럼", "라로슈포제 히알루 B5 세럼", IMG.lrpHyaluB5Serum),
      p("순한 성분", "라로슈포제", "멜라 B3 세럼", "칙칙함·색소를 순하게 케어하는 데일리 세럼", "라로슈포제 멜라 B3 세럼", IMG.lrpMelaB3Serum),
    ],
  },

  exfoliation: {
    default: [
      p("가성비", "스킨푸드", "블랙슈가 퍼펙트 에센셜 스크럽", "피부 편안한 날 주 1회 순한 물리적 각질 정돈", "https://link.coupang.com/a/gROVScppdI"),
      p("순한 성분", "닥터지", "브라이트닝 필링 젤", "문질러 쓰는 저자극 필링 젤, 주 1~2회", "https://link.coupang.com/a/gRQKgvbQlM"),
    ],
  },
}

/** slot + 연령대에 맞는 추천 픽 목록 (없으면 default, 그것도 없으면 빈 배열) */
export function getAffiliatePicks(slot: SlotType, ageGroup: AgeGroup): AffiliatePick[] {
  const table = AFFILIATE_PICKS[slot]
  if (!table) return []
  return table[ageGroup] ?? table.default
}

/** 오늘의 추천 픽 한 장 — 카테고리(slot) 정보를 함께 담아 라벨/아이콘에 쓴다 */
export interface TodayPick extends AffiliatePick {
  slot: SlotType
}

/**
 * 연령대별 큐레이션 태그 우선순위 — 같은 카테고리 안에서 어떤 제형/성분을 먼저 고를지.
 *  2030 : 산뜻·가성비 우선
 *  4050 / 60+ : 초고가 럭셔리가 아니라 '검증된 실용 고보습/더마 밀폐' 라인 우선
 */
const AGE_TAG_PRIORITY: Record<AgeGroup, CurationTag[]> = {
  "2030": ["가성비", "순한 성분", "민감성", "고보습"],
  "4050": ["고보습", "순한 성분", "민감성", "가성비"],
  "60plus": ["고보습", "순한 성분", "민감성", "가성비"],
}

/** 날씨 DO로 카테고리가 3개가 안 될 때 채워 넣을 대표 카테고리 순서 */
const FALLBACK_SLOTS: SlotType[] = ["hydration", "barrier", "sun_care", "active"]

/**
 * 오늘의 날씨 지표 × 선택 연령대 → 카테고리가 겹치지 않는 추천 제품 3~4개.
 *
 *  1) 필요한 카테고리: getDoSkipPlan(오늘 DO)의 슬롯 순서를 그대로 따른다
 *     (UV·건조·미세먼지·시간대·연령대가 이미 반영된 결과). 3개 미만이면 대표 카테고리로 보강.
 *  2) 카테고리별 1개: 해당 연령대 픽 목록에서 AGE_TAG_PRIORITY 순으로 매칭
 *     (4050·60+는 고보습·밀폐·탄력 라인 우선).
 *  3) 같은 제품 중복 제거, 최대 4개.
 */
export function getTodayWeatherPicks(
  weather: SkinWeather,
  ageGroup: AgeGroup,
  now: Date = new Date(),
): TodayPick[] {
  const { doItems } = getDoSkipPlan(weather, now, ageGroup)

  const slots: SlotType[] = []
  const addSlot = (s: SlotType) => {
    if (!slots.includes(s) && (AFFILIATE_PICKS[s]?.default.length ?? 0) > 0) slots.push(s)
  }
  for (const item of doItems) addSlot(item.slot)
  for (const s of FALLBACK_SLOTS) {
    if (slots.length >= 3) break
    addSlot(s)
  }

  const priority = AGE_TAG_PRIORITY[ageGroup]
  const out: TodayPick[] = []
  const seen = new Set<string>()

  for (const slot of slots) {
    if (out.length >= 4) break
    const list = getAffiliatePicks(slot, ageGroup)
    if (list.length === 0) continue
    const chosen = priority.map((tag) => list.find((x) => x.tag === tag)).find(Boolean) ?? list[0]
    const key = `${chosen.brand}|${chosen.title}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...chosen, slot })
  }

  return out
}
