const sharp = require("sharp")
const fs = require("fs")
const path = require("path")

const CALENDAR_DIR = path.join(__dirname, "public/calendar")
const BACKUP_DIR = path.join(CALENDAR_DIR, "originals")
const TARGET_WIDTH = 1200
const JPEG_QUALITY = 80

async function optimizeImages() {
  // 백업 폴더 생성
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    console.log(`✅ Created backup directory: ${BACKUP_DIR}`)
  }

  // 처리할 이미지 파일 목록
  const files = fs
    .readdirSync(CALENDAR_DIR)
    .filter(f => /\.(jpeg|jpg|png)$/i.test(f))

  console.log(`\n📊 Image Optimization Report\n`)
  console.log(`Target width: ${TARGET_WIDTH}px`)
  console.log(`JPEG quality: ${JPEG_QUALITY}%\n`)

  let totalOriginalSize = 0
  let totalOptimizedSize = 0

  for (const file of files) {
    const srcPath = path.join(CALENDAR_DIR, file)
    const backupPath = path.join(BACKUP_DIR, file)

    // 원본 파일 정보
    const stat = fs.statSync(srcPath)
    const originalSize = stat.size
    totalOriginalSize += originalSize

    // 원본을 백업에 복사 (이미 있으면 스킵)
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(srcPath, backupPath)
    }

    // 이미지 메타데이터 얻기
    const metadata = await sharp(srcPath).metadata()

    // 리사이즈 및 재압축 (임시 파일에 쓴 후 덮어쓰기)
    const tmpPath = srcPath + ".tmp"
    await sharp(srcPath)
      .resize(TARGET_WIDTH, Math.round((metadata.height * TARGET_WIDTH) / metadata.width), {
        withoutEnlargement: true,
        fit: "cover",
      })
      .jpeg({ quality: JPEG_QUALITY, progressive: true })
      .toFile(tmpPath)

    // 임시 파일로 원본 덮어쓰기
    fs.renameSync(tmpPath, srcPath)

    // 최적화된 파일 크기
    const optimizedStat = fs.statSync(srcPath)
    const optimizedSize = optimizedStat.size
    totalOptimizedSize += optimizedSize

    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1)
    console.log(`${file}`)
    console.log(`  Original:  ${(originalSize / 1024 / 1024).toFixed(2)}MB (${metadata.width}x${metadata.height}px)`)
    console.log(`  Optimized: ${(optimizedSize / 1024 / 1024).toFixed(2)}MB → ${reduction}% smaller`)
  }

  console.log(`\n📈 Total Savings`)
  console.log(`  Original total:  ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`)
  console.log(`  Optimized total: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB`)
  console.log(`  Reduction: ${((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(1)}%`)
  console.log(`\n✅ Originals backed up to: ${BACKUP_DIR}\n`)
}

optimizeImages().catch(console.error)
