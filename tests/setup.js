import { vi } from 'vitest';

// Mock DOM globals
Object.defineProperty(globalThis, 'document', {
  value: {
    createElement: vi.fn(tagName => {
      if (tagName === 'canvas') {
        return new globalThis.HTMLCanvasElement();
      }
      return {};
    }),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
  },
  writable: true
});

Object.defineProperty(globalThis, 'HTMLCanvasElement', {
  value: class HTMLCanvasElement {
    constructor() {
      this.width = 100;
      this.height = 100;
      this.style = {};
    }

    getContext() {
      return {
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(
            Array(400)
              .fill()
              .map((_, i) => {
                const pixelIndex = Math.floor(i / 4);
                const channel = i % 4;
                if (channel === 3) return 255; // Alpha
                return (pixelIndex * 17 + channel * 50) % 256; // RGB
              })
          ),
          width: 10,
          height: 10
        }))
      };
    }
  },
  writable: true
});

Object.defineProperty(globalThis, 'HTMLImageElement', {
  value: class HTMLImageElement {
    constructor() {
      this.complete = true;
      this.naturalWidth = 100;
      this.naturalHeight = 100;
      this.width = 100;
      this.height = 100;
    }

    load() {
      this.complete = true;
    }
  },
  writable: true
});

// Mock console to reduce noise during tests
globalThis.console = {
  ...globalThis.console,
  warn: vi.fn(),
  error: vi.fn()
};
