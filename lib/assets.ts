export const MAX_ASSET_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_ASSET_TYPES = ["image/png", "image/webp"] as const;

export interface ValidatedImage {
  file: File;
  width: number;
  height: number;
  mimeType: "image/png" | "image/webp";
  previewUrl: string;
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
