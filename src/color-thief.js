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
 * CanvasImage Class
 * Wraps an HTML image element with canvas functionality for pixel manipulation
 */
class CanvasImage {
  constructor(image) {
    // Handle both DOM elements and image objects
    this.imgEl = image;

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    // Hide canvas from view
    this.canvas.style.display = 'none';
    document.body.appendChild(this.canvas);

    // Handle different image types
    if (image instanceof HTMLCanvasElement) {
      this.width = this.canvas.width = image.width;
      this.height = this.canvas.height = image.height;
      this.context.drawImage(image, 0, 0);
    } else {
      this.width = this.canvas.width = image.naturalWidth || image.width;
      this.height = this.canvas.height = image.naturalHeight || image.height;
      this.context.drawImage(image, 0, 0, this.width, this.height);
    }
  }

  getPixelCount() {
    return this.width * this.height;
  }

  getImageData() {
    try {
      return this.context.getImageData(0, 0, this.width, this.height);
    } catch (e) {
      console.error('Unable to access image data:', e);
      return null;
    }
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  update(imageData) {
    this.context.putImageData(imageData, 0, 0);
  }

  removeCanvas() {
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

/**
 * ColorThief Class - Main API
 */
export class ColorThief {
  /**
   * Get the dominant color from an image
   * @param {HTMLImageElement|HTMLCanvasElement} sourceImage - The source image
   * @param {number} quality - Quality/speed trade-off (1-10, default: 10)
   * @returns {number[]|null} RGB array [r, g, b] or null if failed
   */
  static getDominantColor(sourceImage, quality = 10) {
    const palette = ColorThief.getPalette(sourceImage, 5, quality);
    return palette ? palette[0] : null;
  }

  /**
   * Get a color palette from an image
   * @param {HTMLImageElement|HTMLCanvasElement} sourceImage - The source image
   * @param {number} colorCount - Number of colors to extract (2-20, default: 10)
   * @param {number} quality - Quality/speed trade-off (1-10, default: 10)
   * @returns {number[][]|null} Array of RGB arrays [[r,g,b], [r,g,b], ...] or null if failed
   */
  static getPalette(sourceImage, colorCount = 10, quality = 10) {
    if (!sourceImage?.complete) {
      console.warn('Image not loaded or invalid');
      return null;
    }

    // Validate parameters
    colorCount = Math.max(2, Math.min(20, Math.floor(colorCount)));
    quality = Math.max(1, Math.min(10, Math.floor(quality)));

    const image = new CanvasImage(sourceImage);
    const imageData = image.getImageData();

    if (!imageData) {
      image.removeCanvas();
      return null;
    }

    const pixels = imageData.data;
    const pixelCount = image.getPixelCount();
    const pixelArray = [];

    // Extract pixels with quality sampling
    for (let i = 0; i < pixelCount; i += quality) {
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
    const cmap = MMCQ.quantize(pixelArray, colorCount);
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
  static getAverageColor(sourceImage, sampleSize = 10) {
    if (!sourceImage?.complete) {
      return null;
    }

    const image = new CanvasImage(sourceImage);
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
  static rgbToHex(rgb) {
    return `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`;
  }

  /**
   * Convert RGB array to HSL
   * @param {number[]} rgb - RGB array [r, g, b]
   * @returns {number[]} HSL array [h, s, l]
   */
  static rgbToHsl(rgb) {
    const [r, g, b] = rgb.map(c => c / 255);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

      switch (max) {
        case r:
          h = (g - b) / diff + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / diff + 2;
          break;
        case b:
          h = (r - g) / diff + 4;
          break;
      }
      h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }
}

// Legacy function exports for backward compatibility
export const { getDominantColor } = ColorThief;
export const { getPalette } = ColorThief;
export const createPalette = ColorThief.getPalette; // Alias for old function name
export const getAverageRGB = ColorThief.getAverageColor;

export default ColorThief;
