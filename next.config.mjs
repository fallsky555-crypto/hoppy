/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 추천 룩북 카드의 제품 대표 이미지는 <img referrerPolicy="no-referrer">로
    // 직접 핫링크하므로 이 허용 목록이 "필수"는 아니다. 다만 나중에 next/image로
    // 전환할 경우를 대비해 사용 중인 CDN 호스트를 등록해 둔다.
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "godomall-storage.cdn-nhncommerce.com" },
      { protocol: "https", hostname: "image.aestura.com" },
      { protocol: "https", hostname: "**.coupangcdn.com" },
    ],
  },
}

export default nextConfig
