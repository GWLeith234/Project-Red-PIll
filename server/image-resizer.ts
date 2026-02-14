import sharp from 'sharp';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import dns from 'dns';
import { promisify } from 'util';
import type { AdSize } from './ad-sizes';

const dnsLookup = promisify(dns.lookup);

export interface ResizedImage {
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  base64: string;
  size: number;
  error?: string;
}

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
  /^fd/,
  /^localhost$/i,
];

function isPrivateAddress(ip: string): boolean {
  return PRIVATE_IP_RANGES.some(range => range.test(ip));
}

async function validateUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are allowed');
  }

  if (isPrivateAddress(parsed.hostname)) {
    throw new Error('Access to private/internal addresses is not allowed');
  }

  try {
    const result = await dnsLookup(parsed.hostname);
    if (isPrivateAddress(result.address)) {
      throw new Error('Access to private/internal addresses is not allowed');
    }
  } catch (err: any) {
    if (err.message.includes('private')) throw err;
    throw new Error(`DNS resolution failed for ${parsed.hostname}`);
  }
}

export async function fetchImageFromUrl(url: string): Promise<Buffer> {
  await validateUrl(url);

  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchImageFromUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`Failed to fetch image: HTTP ${res.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      let totalSize = 0;
      res.on('data', (chunk) => {
        totalSize += chunk.length;
        if (totalSize > 50 * 1024 * 1024) {
          request.destroy();
          reject(new Error('Image too large (max 50MB)'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    request.on('error', reject);
    request.on('timeout', () => { request.destroy(); reject(new Error('Request timeout')); });
  });
}

const VALID_FITS = ['cover', 'contain', 'fill', 'inside', 'outside'] as const;
type FitOption = typeof VALID_FITS[number];

export function validateFit(fit: string): FitOption {
  if (VALID_FITS.includes(fit as FitOption)) return fit as FitOption;
  return 'cover';
}

export async function resizeImage(
  imageBuffer: Buffer,
  width: number,
  height: number,
  fit: keyof sharp.FitEnum = 'cover'
): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(width, height, {
      fit,
      position: 'center',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .jpeg({ quality: 90 })
    .toBuffer();
}

export async function processImageForSizes(
  imageBuffer: Buffer,
  sizes: AdSize[],
  fit: keyof sharp.FitEnum = 'cover'
): Promise<ResizedImage[]> {
  const results: ResizedImage[] = [];

  for (const size of sizes) {
    try {
      const resizedBuffer = await resizeImage(imageBuffer, size.width, size.height, fit);
      results.push({
        name: size.name,
        width: size.width,
        height: size.height,
        aspectRatio: size.aspectRatio,
        base64: resizedBuffer.toString('base64'),
        size: resizedBuffer.length,
      });
    } catch (error: any) {
      results.push({
        name: size.name,
        width: size.width,
        height: size.height,
        aspectRatio: size.aspectRatio,
        base64: '',
        size: 0,
        error: error.message,
      });
    }
  }

  return results;
}

export async function getImageMetadata(imageBuffer: Buffer) {
  const metadata = await sharp(imageBuffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: metadata.size || 0,
    aspectRatio: metadata.width && metadata.height
      ? (metadata.width / metadata.height).toFixed(2)
      : '0',
  };
}
