"use client"

import Image from "next/image"

interface ProgressHeaderProps {
  /** 상단 히어로 이미지 — "스페셜케어 사이클"마다 바뀐다(lib/hero-image.ts 참고) */
  heroImageSrc: string
}

/**
 * 상단 히어로 배너. 바로 아래 SkinWeatherCard와 하나의 카드 컨테이너 안에서
 * 이어붙어 한 장의 다이어리 카드처럼 보인다 — 자체 라운딩·테두리·여백 없음.
 */
export function ProgressHeader({ heroImageSrc }: ProgressHeaderProps) {
  return (
    <div className="relative block h-52 w-full">
      <Image
        src={heroImageSrc}
        alt=""
        fill
        className="object-cover object-[center_30%]"
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  )
}
