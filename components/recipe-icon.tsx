import { Citrus, Droplet, Droplets, FlaskConical, Heart, Lock, Shield, Sun, Waves, type LucideIcon } from "lucide-react"
import type { RecipeType } from "@/lib/schedule"

/**
 * 캘린더 카테고리 아이콘을 단색 라인 아이콘으로 표현한다. 색은 아이콘 자체가 아니라
 * 호출하는 쪽에서 className으로 입힌다(예: text-defense-barrier) — 배경이 이미 카테고리
 * 색인 곳(예: RecipeCard 태그 필)에서는 currentColor로 자연히 흰 텍스트를 상속받는다.
 */
export const RECIPE_ICON: Record<RecipeType, LucideIcon> = {
  bha: Droplets,
  retinol: FlaskConical,
  defense_barrier: Shield,
  defense_toning: Sun,
  defense_hydration: Droplet,
  barrier_lock: Lock,
  hydration_lock: Waves,
  toning_solo: Citrus,
  sos_rest: Heart,
}
