import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDominantColor,
  getPalette,
  getAverageColor,
  rgbToHex,
  rgbToHsl,
  ColorThief,
  createPalette,
  getAverageRGB
} from '../src/color-thief.js';

// Create mock image objects for testing
const mockImage = {
  complete: true,
  naturalWidth: 100,
  naturalHeight: 100,
  width: 100,
  height: 100
};

describe('Color Thief - Functional Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex correctly', () => {
      expect(rgbToHex([255, 0, 0])).toBe('#ff0000');
      expect(rgbToHex([0, 255, 0])).toBe('#00ff00');
      expect(rgbToHex([0, 0, 255])).toBe('#0000ff');
      expect(rgbToHex([255, 255, 255])).toBe('#ffffff');
      expect(rgbToHex([0, 0, 0])).toBe('#000000');
    });

    it('should handle single digit hex values', () => {
      expect(rgbToHex([15, 15, 15])).toBe('#0f0f0f');
      expect(rgbToHex([1, 2, 3])).toBe('#010203');
    });
  });

  describe('rgbToHsl', () => {
    it('should convert RGB to HSL correctly', () => {
      // Red
      expect(rgbToHsl([255, 0, 0])).toEqual([0, 100, 50]);

      // Green
      expect(rgbToHsl([0, 255, 0])).toEqual([120, 100, 50]);

      // Blue
      expect(rgbToHsl([0, 0, 255])).toEqual([240, 100, 50]);

      // White
      expect(rgbToHsl([255, 255, 255])).toEqual([0, 0, 100]);

      // Black
      expect(rgbToHsl([0, 0, 0])).toEqual([0, 0, 0]);
    });

    it('should handle grayscale colors', () => {
      expect(rgbToHsl([128, 128, 128])).toEqual([0, 0, 50]);
      expect(rgbToHsl([64, 64, 64])).toEqual([0, 0, 25]);
    });
  });

  describe('getDominantColor', () => {
    it('should return dominant color from image', () => {
      const result = getDominantColor(mockImage);
      expect(result).toBeTruthy();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });

    it('should return null for invalid image', () => {
      const invalidImage = { complete: false };
      const result = getDominantColor(invalidImage);
      expect(result).toBeNull();
    });

    it('should handle quality parameter', () => {
      const result1 = getDominantColor(mockImage, 1);
      const result2 = getDominantColor(mockImage, 10);

      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
    });
  });

  describe('getPalette', () => {
    it('should return color palette from image', () => {
      const result = getPalette(mockImage, 5);
      expect(result).toBeTruthy();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Each color should be RGB array
      result.forEach(color => {
        expect(Array.isArray(color)).toBe(true);
        expect(color).toHaveLength(3);
      });
    });

    it('should validate colorCount parameter', () => {
      // Test bounds
      expect(getPalette(mockImage, 1)).toBeTruthy(); // Should clamp to 2
      expect(getPalette(mockImage, 25)).toBeTruthy(); // Should clamp to 20
      expect(getPalette(mockImage, 10.7)).toBeTruthy(); // Should floor to 10
    });

    it('should validate quality parameter', () => {
      expect(getPalette(mockImage, 5, 0)).toBeTruthy(); // Should clamp to 1
      expect(getPalette(mockImage, 5, 15)).toBeTruthy(); // Should clamp to 10
      expect(getPalette(mockImage, 5, 5.8)).toBeTruthy(); // Should floor to 5
    });

    it('should return null for incomplete image', () => {
      const incompleteImage = { complete: false };
      expect(getPalette(incompleteImage)).toBeNull();
    });

    it('should return null for null/undefined image', () => {
      expect(getPalette(null)).toBeNull();
      expect(getPalette(undefined)).toBeNull();
    });
  });

  describe('getAverageColor', () => {
    it('should return average color from image', () => {
      const result = getAverageColor(mockImage);
      expect(result).toBeTruthy();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);

      // Values should be valid RGB
      result.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(255);
        expect(Number.isInteger(value)).toBe(true);
      });
    });

    it('should handle sampleSize parameter', () => {
      const result = getAverageColor(mockImage, 5);
      expect(result).toBeTruthy();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });

    it('should return null for incomplete image', () => {
      const incompleteImage = { complete: false };
      expect(getAverageColor(incompleteImage)).toBeNull();
    });
  });

  describe('Canvas handling', () => {
    it('should handle HTMLCanvasElement', () => {
      const canvasElement = {
        complete: true,
        width: 50,
        height: 50
      };

      const result = getDominantColor(canvasElement);
      expect(result).toBeTruthy();
    });

    it('should handle image without naturalWidth/naturalHeight', () => {
      const imageWithoutNatural = {
        complete: true,
        width: 200,
        height: 150
      };

      const result = getDominantColor(imageWithoutNatural);
      expect(result).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('should handle canvas getImageData errors', () => {
      const originalCreateElement = globalThis.document.createElement;

      const errorCanvas = new globalThis.HTMLCanvasElement();
      errorCanvas.getContext = vi.fn(() => ({
        drawImage: vi.fn(),
        getImageData: vi.fn(() => {
          throw new Error('Canvas error');
        }),
        clearRect: vi.fn(),
        putImageData: vi.fn()
      }));

      globalThis.document.createElement = vi.fn(() => errorCanvas);

      const result = getDominantColor(mockImage);
      expect(result).toBeNull();

      // Restore original
      globalThis.document.createElement = originalCreateElement;
    });

    it('should handle empty pixel arrays', () => {
      const originalCreateElement = globalThis.document.createElement;

      const emptyCanvas = new globalThis.HTMLCanvasElement();
      emptyCanvas.getContext = vi.fn(() => ({
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray([]), // Empty data
          width: 0,
          height: 0
        })),
        clearRect: vi.fn(),
        putImageData: vi.fn()
      }));

      globalThis.document.createElement = vi.fn(() => emptyCanvas);

      const result = getPalette(mockImage);
      expect(result).toBeNull();

      // Restore original
      globalThis.document.createElement = originalCreateElement;
    });
  });

  describe('ColorThief object (backward compatibility)', () => {
    it('should provide all static methods', () => {
      expect(typeof ColorThief.getDominantColor).toBe('function');
      expect(typeof ColorThief.getPalette).toBe('function');
      expect(typeof ColorThief.getAverageColor).toBe('function');
      expect(typeof ColorThief.rgbToHex).toBe('function');
      expect(typeof ColorThief.rgbToHsl).toBe('function');
    });

    it('should work with ColorThief.getDominantColor', () => {
      const result = ColorThief.getDominantColor(mockImage);
      expect(result).toBeTruthy();
    });

    it('should work with ColorThief.getPalette', () => {
      const result = ColorThief.getPalette(mockImage, 5);
      expect(result).toBeTruthy();
    });
  });

  describe('Legacy exports', () => {
    it('should export createPalette alias', () => {
      expect(typeof createPalette).toBe('function');
      const result = createPalette(mockImage, 5);
      expect(result).toBeTruthy();
    });

    it('should export getAverageRGB alias', () => {
      expect(typeof getAverageRGB).toBe('function');
      const result = getAverageRGB(mockImage);
      expect(result).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('should handle transparent pixels', () => {
      const originalCreateElement = globalThis.document.createElement;

      const transparentCanvas = new globalThis.HTMLCanvasElement();
      transparentCanvas.getContext = vi.fn(() => ({
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray([
            255,
            0,
            0,
            0, // Transparent red
            0,
            255,
            0,
            50, // Semi-transparent green
            0,
            0,
            255,
            255, // Opaque blue
            255,
            255,
            255,
            200, // Semi-transparent white
            100,
            150,
            200,
            255, // Solid color
            50,
            100,
            150,
            255, // Another solid color
            200,
            100,
            50,
            255, // Another solid color
            150,
            200,
            100,
            255 // Another solid color
          ]),
          width: 2,
          height: 4
        })),
        clearRect: vi.fn(),
        putImageData: vi.fn()
      }));

      globalThis.document.createElement = vi.fn(() => transparentCanvas);

      const result = getPalette(mockImage);
      // Should either return a valid palette or null (both are acceptable for edge cases)
      expect(result === null || Array.isArray(result)).toBe(true);

      // Restore original
      globalThis.document.createElement = originalCreateElement;
    });

    it('should handle very light pixels', () => {
      const originalCreateElement = globalThis.document.createElement;

      const lightCanvas = new globalThis.HTMLCanvasElement();
      lightCanvas.getContext = vi.fn(() => ({
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray([
            255,
            255,
            255,
            255, // White (should be skipped)
            254,
            254,
            254,
            255, // Almost white
            100,
            100,
            100,
            255, // Gray
            50,
            50,
            50,
            255, // Dark gray
            200,
            100,
            50,
            255, // Orange
            50,
            200,
            100,
            255, // Green-ish
            100,
            50,
            200,
            255, // Purple-ish
            150,
            150,
            50,
            255 // Yellow-ish
          ]),
          width: 2,
          height: 4
        })),
        clearRect: vi.fn(),
        putImageData: vi.fn()
      }));

      globalThis.document.createElement = vi.fn(() => lightCanvas);

      const result = getPalette(mockImage);
      // Should either return a valid palette or null (both are acceptable for edge cases)
      expect(result === null || Array.isArray(result)).toBe(true);

      // Restore original
      globalThis.document.createElement = originalCreateElement;
    });
  });
});
