export const MAX_ASSET_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_ASSET_TYPES = ["image/png", "image/webp"] as const;

export interface ValidatedImage {
  file: File;
  width: number;
  height: number;
  mimeType: "image/png" | "image/webp";
  previewUrl: string;
}

const transparencyCache = new Map<string, Promise<boolean>>();

function decodedImageHasTransparency(image: HTMLImageElement) {
  const maxSampleSize = 1024;
  const scale = Math.min(1, maxSampleSize / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Could not inspect frame transparency.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 255) return true;
  }
  return false;
}

/** Resolves true only when the decoded image contains at least one transparent pixel. */
export function imageHasTransparency(src: string) {
  const cached = transparencyCache.get(src);
  if (cached) return cached;

  const result = new Promise<boolean>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        resolve(decodedImageHasTransparency(image));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("Could not load frame image."));
    image.src = src;
  });
  transparencyCache.set(src, result);
  result.catch(() => transparencyCache.delete(src));
  return result;
}

export async function validateImageAsset(file: File): Promise<ValidatedImage> {
  if (!ACCEPTED_ASSET_TYPES.includes(file.type as (typeof ACCEPTED_ASSET_TYPES)[number])) {
    throw new Error("Use a PNG or WebP image.");
  }
  if (file.size > MAX_ASSET_BYTES) {
    throw new Error("Images must be 10 MB or smaller.");
  }
  if (file.size === 0) throw new Error("The selected file is empty.");

  const previewUrl = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("The selected image is corrupt or unsupported."));
      image.src = previewUrl;
    });
    if (dimensions.width < 32 || dimensions.height < 32) {
      throw new Error("Images must be at least 32 × 32 pixels.");
    }
    if (dimensions.width > 8000 || dimensions.height > 8000) {
      throw new Error("Images cannot exceed 8000 pixels on either side.");
    }
    return {
      file,
      ...dimensions,
      mimeType: file.type as ValidatedImage["mimeType"],
      previewUrl
    };
  } catch (error) {
    URL.revokeObjectURL(previewUrl);
    throw error;
  }
}

export function assetExtension(mimeType: string) {
  return mimeType === "image/webp" ? "webp" : "png";
}
