import Replicate from 'replicate';
import { Request, Response, NextFunction } from 'express';

// Background removal model: 
// https://replicate.com/cjwbw/rembg
const BACKGROUND_REMOVAL_MODEL = "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";

// Border detection model:
// https://replicate.com/fofr/edge-detection-canny
const BORDER_DETECTION_MODEL = "fofr/edge-detection-canny:36c0a4a8a51e996ca3c55ec9bb9ea6fc9450c29f8458fe8d8c9562dd571a1f28";

/**
 * Process an image to remove its background
 * @param imageUrl URL of the image to process
 * @returns URL of the processed image
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run(
      BACKGROUND_REMOVAL_MODEL,
      {
        input: {
          image: imageUrl
        }
      }
    );

    // Replicate returns the URL as the first item in the output array or as a direct string
    return typeof output === 'string' ? output : Array.isArray(output) ? output[0] : String(output);
  } catch (error) {
    console.error('Error removing background:', error);
    throw new Error('Failed to remove background from image');
  }
}

/**
 * Process an image to detect its borders/edges
 * @param imageUrl URL of the image to process
 * @returns URL of the processed image with edges detected
 */
export async function detectBorders(imageUrl: string, lowThreshold = 100, highThreshold = 200): Promise<string> {
  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run(
      BORDER_DETECTION_MODEL,
      {
        input: {
          image: imageUrl,
          low_threshold: lowThreshold,
          high_threshold: highThreshold
        }
      }
    );

    // Replicate returns the URL as the first item in the output array or as a direct string
    return typeof output === 'string' ? output : Array.isArray(output) ? output[0] : String(output);
  } catch (error) {
    console.error('Error detecting borders:', error);
    throw new Error('Failed to detect borders in image');
  }
}

/**
 * Middleware to check if Replicate API token is provided
 */
export function requireReplicateToken(req: Request, res: Response, next: NextFunction) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return res.status(500).json({ 
      message: "Replicate API token not configured. Please set the REPLICATE_API_TOKEN environment variable." 
    });
  }
  next();
}