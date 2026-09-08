"use client"

import Image from "next/image"

interface ProgressHeaderProps {
  /** 상단 히어로 이미지 — "스페셜케어 사이클"마다 바뀐다(lib/hero-image.ts 참고) */
  heroImageSrc: string
}

/**
 * 상단 히어로 배너. SKIN JOURNAL / 이름 / 날짜 회색 박스 카드는 제거하고
 * 큰 일러스트 하나만 남겼다 — 바로 아래 '오늘의 스킨 웨더' 카드로 연결된다.
 * (오늘 날짜는 스킨 웨더 카드 상단 캡션으로 흡수)
 */
export function ProgressHeader({ heroImageSrc }: ProgressHeaderProps) {
  return (
    <header className="relative h-48 w-full overflow-hidden rounded-4xl ring-1 ring-border">
      <Image
        src={heroImageSrc}
        alt=""
        fill
        className="object-cover object-[center_top]"
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </header>
  )
}
