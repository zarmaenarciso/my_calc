const MAX_DIMENSION = 1024
const MAX_OUTPUT_LENGTH = 450_000
const MAX_FILE_BYTES = 10 * 1024 * 1024

/**
 * Resize and compress an uploaded image file to a JPEG data URL so it fits
 * comfortably within Firestore document size limits without external storage setup.
 */
export async function compressImageToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file.')
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Image must be smaller than 10 MB.')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Failed to load image file.'))
      image.src = objectUrl
    })

    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(img.naturalWidth || 1, img.naturalHeight || 1),
    )
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Unable to process image in this browser.')
    }

    ctx.drawImage(img, 0, 0, width, height)

    let quality = 0.78
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    while (dataUrl.length > MAX_OUTPUT_LENGTH && quality > 0.35) {
      quality -= 0.12
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }

    if (dataUrl.length > MAX_OUTPUT_LENGTH) {
      throw new Error(
        'Compressed image is still too large. Please pick a smaller image.',
      )
    }

    return dataUrl
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
