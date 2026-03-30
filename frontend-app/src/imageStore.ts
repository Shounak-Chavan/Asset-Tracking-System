const IMAGE_MAP_KEY = 'asset_image_map'

type ImageMap = Record<string, string>

function readMap(): ImageMap {
  try {
    const raw = localStorage.getItem(IMAGE_MAP_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as ImageMap
    return parsed
  } catch {
    return {}
  }
}

function writeMap(imageMap: ImageMap) {
  localStorage.setItem(IMAGE_MAP_KEY, JSON.stringify(imageMap))
}

export function getAssetImage(assetCode: string): string | null {
  const imageMap = readMap()
  return imageMap[assetCode] ?? null
}

export function saveAssetImage(assetCode: string, imageUrl: string) {
  const imageMap = readMap()
  imageMap[assetCode] = imageUrl
  writeMap(imageMap)
}
