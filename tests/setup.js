import { vi } from 'vitest';

// Mock DOM globals for jsdom environment
Object.defineProperty(globalThis, 'HTMLCanvasElement', {
  value: class HTMLCanvasElement {
    constructor() {
      this.width = 100;
      this.height = 100;
      this.style = {
        display: ''
      };
      // Add Node properties for DOM compatibility
      this.nodeType = 1; // ELEMENT_NODE
      this.nodeName = 'CANVAS';
      this.tagName = 'CANVAS';
      this.parentNode = null;
      this.ownerDocument = globalThis.document;
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

// Mock document.createElement for canvas
const originalCreateElement = globalThis.document?.createElement;
if (globalThis.document) {
  globalThis.document.createElement = vi.fn(tagName => {
    if (tagName === 'canvas') {
      return new globalThis.HTMLCanvasElement();
    }
    return originalCreateElement ? originalCreateElement.call(globalThis.document, tagName) : {};
  });

  // Mock document.body.appendChild to avoid DOM manipulation issues
  const originalAppendChild = globalThis.document.body?.appendChild;
  if (globalThis.document.body) {
    globalThis.document.body.appendChild = vi.fn(child => {
      // For canvas elements in test environment, just return the child
      if (child instanceof globalThis.HTMLCanvasElement || (child && child.tagName === 'CANVAS')) {
        return child;
      }
      // For other elements, use original method if available
      if (originalAppendChild) {
        return originalAppendChild.call(globalThis.document.body, child);
      }
      return child;
    });
  }
}

Object.defineProperty(globalThis, 'HTMLImageElement', {
  value: class HTMLImageElement {
    constructor() {
      this.complete = true;
      this.naturalWidth = 100;
      this.naturalHeight = 100;
      this.width = 100;
      this.height = 100;
      this.src = '';
      this.dataset = {};
      this.style = {};
    }

    load() {
      this.complete = true;
    }
  },
  writable: true
});

// Mock FileReader for file upload tests
Object.defineProperty(globalThis, 'FileReader', {
  value: class FileReader {
    constructor() {
      this.onload = null;
      this.readAsDataURL = vi.fn(() => {
        // Simulate async file reading
        Promise.resolve().then(() => {
          if (this.onload) {
            this.onload({ target: { result: 'data:image/jpeg;base64,fake-image-data' } });
          }
        });
      });
    }
    // Add a dummy abort method to avoid "class with only a constructor" error
    abort() {
      // intentionally left blank
    }
  },
  writable: true
});

// Mock File API
Object.defineProperty(globalThis, 'File', {
  value: class File {
    constructor(bits, name, options = {}) {
      this.name = name;
      this.type = options.type || '';
      this.size = bits.length;
      this.lastModified = Date.now();
    }
    // Add a dummy method to avoid "class with only a constructor" error
    dummy() {
      // intentionally left blank
    }
  },
  writable: true
});

// Mock clipboard API
Object.defineProperty(globalThis, 'navigator', {
  value: {
    ...globalThis.navigator,
    clipboard: {
      writeText: vi.fn(() => Promise.resolve())
    }
  },
  writable: true
});

// Mock console to reduce noise during tests but keep essential functionality
globalThis.console = {
  ...globalThis.console,
  warn: vi.fn(),
  error: vi.fn()
};
