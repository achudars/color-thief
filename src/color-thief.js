/*
 * Color Thief v2.0 - Modern ES6+ Version
 * Original by Lokesh Dhakar - http://www.lokeshdhakar.com
 * Modernized by Aleksandrs Cudars
 *
 * Licensed under the Creative Commons Attribution 2.5 License - http://creativecommons.org/licenses/by/2.5/
 *
 * A modern JavaScript library for extracting dominant colors and color palettes from images.
 * Uses JavaScript ES6+ features and the canvas API.
 */

import { MMCQ } from './quantize.js';

/**
 * CanvasImage Factory Function
 * Creates a canvas wrapper for image pixel manipulation
 */
function createCanvasImage(image) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // Hide canvas from view
  canvas.style.display = 'none';
  document.body.appendChild(canvas);

  // Handle different image types
  let width, height;
  if (image instanceof HTMLCanvasElement) {
    width = canvas.width = image.width;
    height = canvas.height = image.height;
    context.drawImage(image, 0, 0);
  } else {
    width = canvas.width = image.naturalWidth || image.width;
    height = canvas.height = image.naturalHeight || image.height;
    context.drawImage(image, 0, 0, width, height);
  }

  return {
    canvas,
    context,
    width,
    height,
    getPixelCount: () => width * height,
    getImageData: () => {
      try {
        return context.getImageData(0, 0, width, height);
      } catch (e) {
        console.error('Unable to access image data:', e);
        return null;
      }
    },
    clear: () => context.clearRect(0, 0, width, height),
    update: imageData => context.putImageData(imageData, 0, 0),
    removeCanvas: () => {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  };
}

/**
 * Get the dominant color from an image
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImage - The source image
 * @param {number} quality - Quality/speed trade-off (1-10, default: 10)
 * @returns {number[]|null} RGB array [r, g, b] or null if failed
 */
export function getDominantColor(sourceImage, quality = 10) {
  const palette = getPalette(sourceImage, 5, quality);
  return palette ? palette[0] : null;
}

/**
 * Get a color palette from an image
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImage - The source image
 * @param {number} colorCount - Number of colors to extract (2-20, default: 10)
 * @param {number} quality - Quality/speed trade-off (1-10, default: 10)
 * @returns {number[][]|null} Array of RGB arrays [[r,g,b], [r,g,b], ...] or null if failed
 */
export function getPalette(sourceImage, colorCount = 10, quality = 10) {
  if (!sourceImage?.complete) {
    console.warn('Image not loaded or invalid');
    return null;
  }

  // Validate parameters
  const safeColorCount = Math.max(2, Math.min(20, Math.floor(colorCount)));
  const safeQuality = Math.max(1, Math.min(10, Math.floor(quality)));

  const image = createCanvasImage(sourceImage);
  const imageData = image.getImageData();

  if (!imageData) {
    image.removeCanvas();
    return null;
  }

  const pixels = imageData.data;
  const pixelCount = image.getPixelCount();
  const pixelArray = [];

  // Extract pixels with quality sampling
  for (let i = 0; i < pixelCount; i += safeQuality) {
    const offset = i * 4;
    const r = pixels[offset];
    const g = pixels[offset + 1];
    const b = pixels[offset + 2];
    const a = pixels[offset + 3];

    // Skip transparent and very light pixels
    if (a >= 125 && !(r > 250 && g > 250 && b > 250)) {
      pixelArray.push([r, g, b]);
    }
  }

  if (pixelArray.length === 0) {
    image.removeCanvas();
    return null;
  }

  // Quantize colors using median cut algorithm
  const cmap = MMCQ.quantize(pixelArray, safeColorCount);
  const palette = cmap ? cmap.palette() : null;

  // Clean up
  image.removeCanvas();

  return palette;
}

/**
 * Get average RGB color from an image
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImage - The source image
 * @param {number} sampleSize - Pixel sampling rate (default: 10)
 * @returns {number[]|null} RGB array [r, g, b] or null if failed
 */
export function getAverageColor(sourceImage, sampleSize = 10) {
  if (!sourceImage?.complete) {
    return null;
  }

  const image = createCanvasImage(sourceImage);
  const imageData = image.getImageData();

  if (!imageData) {
    image.removeCanvas();
    return null;
  }

  const pixels = imageData.data;
  const pixelCount = image.getPixelCount();

  let count = 0;
  const rgb = { r: 0, g: 0, b: 0 };

  for (let i = 0; i < pixelCount * 4; i += sampleSize * 4) {
    if (pixels[i + 3] > 125) {
      // Check alpha
      count++;
      rgb.r += pixels[i];
      rgb.g += pixels[i + 1];
      rgb.b += pixels[i + 2];
    }
  }

  if (count === 0) {
    image.removeCanvas();
    return null;
  }

  const avgColor = [
    Math.floor(rgb.r / count),
    Math.floor(rgb.g / count),
    Math.floor(rgb.b / count)
  ];

  image.removeCanvas();
  return avgColor;
}

/**
 * Convert RGB array to hex string
 * @param {number[]} rgb - RGB array [r, g, b]
 * @returns {string} Hex color string
 */
export function rgbToHex(rgb) {
  return `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Convert RGB array to HSL
 * @param {number[]} rgb - RGB array [r, g, b]
 * @returns {number[]} HSL array [h, s, l]
 */
export function rgbToHsl(rgb) {
  const [r, g, b] = rgb.map(c => c / 255);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    if (max === r) {
      h = (g - b) / diff + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else if (max === b) {
      h = (r - g) / diff + 4;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// Legacy function exports for backward compatibility
export const createPalette = getPalette; // Alias for old function name
export const getAverageRGB = getAverageColor;

// Create ColorThief object for backward compatibility
export const ColorThief = {
  getDominantColor,
  getPalette,
  getAverageColor,
  rgbToHex,
  rgbToHsl
};

export default ColorThief;
