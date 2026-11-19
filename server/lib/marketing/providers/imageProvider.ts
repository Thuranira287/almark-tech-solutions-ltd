import { v2 as cloudinary } from "cloudinary";

export interface ImageGenerationRequest {
  prompt: string;
  imageSize?: "square" | "square_hd" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9";
}

export interface StoredImageResult {
  success: boolean;
  provider?: string;
  providerAssetId?: string;
  cloudinaryPublicId?: string;
  secureUrl?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  errorSafe?: string;
}

export interface ImageGenerationProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateAndStore(req: ImageGenerationRequest): Promise<StoredImageResult>;
}

export class NotConfiguredImageProvider implements ImageGenerationProvider {
  readonly name = "not_configured";
  isConfigured() {
    return false;
  }
  async generateAndStore(): Promise<StoredImageResult> {
    return { success: false, errorSafe: "No image generation provider is configured" };
  }
}

function cloudinaryConfigured(): boolean {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const FAL_ENDPOINT = "https://fal.run/fal-ai/flux/schnell";

export class FalImageProvider implements ImageGenerationProvider {
  readonly name = "fal.ai";

  isConfigured(): boolean {
    return !!process.env.FAL_KEY && cloudinaryConfigured();
  }

  async generateAndStore(req: ImageGenerationRequest): Promise<StoredImageResult> {
    if (!process.env.FAL_KEY) {
      return { success: false, errorSafe: "FAL_KEY is not set" };
    }
    if (!cloudinaryConfigured()) {
      return { success: false, errorSafe: "Cloudinary is not configured" };
    }

    let falResult: any;
    try {
      const res = await fetch(FAL_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.FAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: req.prompt, image_size: req.imageSize ?? "square_hd" }),
      });
      if (!res.ok) {
        return { success: false, errorSafe: `fal.ai returned HTTP ${res.status}` };
      }
      falResult = await res.json();
    } catch {
      return { success: false, errorSafe: "Network error contacting fal.ai" };
    }

    const image = falResult?.images?.[0];
    if (!image?.url) {
      return { success: false, errorSafe: "fal.ai response did not include an image URL" };
    }

    try {
      configureCloudinary();
      const upload = await cloudinary.uploader.upload(image.url, {
        folder: "ai-marketing",
        resource_type: "image",
      });
      return {
        success: true,
        provider: this.name,
        providerAssetId: falResult.request_id ?? image.url,
        cloudinaryPublicId: upload.public_id,
        secureUrl: upload.secure_url,
        width: upload.width,
        height: upload.height,
        mimeType: image.content_type ?? `image/${upload.format}`,
      };
    } catch {
      return { success: false, errorSafe: "Image was generated but could not be stored in Cloudinary" };
    }
  }
}

export function getImageProvider(): ImageGenerationProvider {
  return new FalImageProvider();
}
