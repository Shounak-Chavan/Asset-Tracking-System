const IMAGE_MAP_KEY = 'asset_image_map'

type ImageMap = Record<string, string>

function readMap(): ImageMap {
  try {
    const raw = localStorage.getItem(IMAGE_MAP_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as ImageMap
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

export function saveAssetImage(assetCode: string, imageData: string) {
  const imageMap = readMap()
  imageMap[assetCode] = imageData
  writeMap(imageMap)
}

/**
 * Read a File object as a base64 data URL and save it to localStorage
 */
export function saveAssetImageFromFile(assetCode: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      saveAssetImage(assetCode, dataUrl)
      resolve(dataUrl)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Given a list of asset codes and a single file, save the image for each code
 */
export async function saveAssetImageForCodes(codes: string[], file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const imageMap = readMap()
      for (const code of codes) {
        imageMap[code] = dataUrl
      }
      writeMap(imageMap)
      resolve(dataUrl)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
