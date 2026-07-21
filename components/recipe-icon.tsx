import { Droplet, Droplets, FlaskConical, Heart, Shield, Sparkle, Sun, type LucideIcon } from "lucide-react"
import type { RecipeType } from "@/lib/schedule"

/**
 * 12-1(v1.6). 캘린더 카테고리 아이콘을 이모지(플랫폼별 고정 원색)에서 단색 라인 아이콘으로 교체한다.
 * 색은 아이콘 자체가 아니라 호출하는 쪽에서 className으로 입힌다(예: text-defense-barrier) —
 * 배경이 이미 카테고리 색인 곳(예: RecipeCard 태그 필)에서는 currentColor로 자연히 흰 텍스트를 상속받는다.
 */
export const RECIPE_ICON: Record<RecipeType, LucideIcon> = {
  rest: Shield,
  moist: Droplet,
  defense_barrier: Shield,
  defense_toning: Sun,
  defense_hydration: Droplet,
  aha: Sparkle,
  bha: Droplets,
  retinol: FlaskConical,
  sos_rest: Heart,
}
