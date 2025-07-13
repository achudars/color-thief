/*
 * Color Thief Demo Application - Modern ES6+ Version
 * Original by Lokesh Dhakar, modernized with upload functionality by Aleksandrs Cudars
 */

import { ColorThief } from './color-thief.js';

/**
 * UI Manager for the Color Thief demo
 */
class ColorThiefApp {
  constructor() {
    this.imageInput = null;
    this.imagePreview = null;
    this.mainContainer = null;
    this.template = null;

    this.init();
  }

  init() {
    this.createUI();
    this.setupEventListeners();
    this.animateTitle();
  }

  createUI() {
    this.mainContainer = document.getElementById('main');
    if (!this.mainContainer) {
      console.error('Main container not found');
      return;
    }

    // Create the main interface
    this.mainContainer.innerHTML = `
      <div class="upload-section">
        <input id="uploadImage" type="file" name="myPhoto" accept="image/*" />
        <label for="uploadImage" class="upload-label">
          <span>Choose an image or drag & drop</span>
        </label>
      </div>
      <div class="imageSection" style="display: none;">
        <div class="imageWrap">
          <img class="targetImage" id="uploadPreview" data-colorcount="10" />
        </div>
        <div class="colors">
          <div class="function dominantColor">
            <h3>Dominant Color</h3>
            <div class="swatches"></div>
          </div>
          <div class="function medianCutPalette clearfix">
            <h3>Palette</h3>
            <div class="swatches"></div>
          </div>
        </div>
      </div>
    `;

    this.imageInput = document.getElementById('uploadImage');
    this.imagePreview = document.getElementById('uploadPreview');
  }

  setupEventListeners() {
    if (!this.imageInput || !this.imagePreview) return;

    // File input change event
    this.imageInput.addEventListener('change', event => {
      this.handleImageUpload(event);
    });

    // Drag and drop events
    const uploadSection = document.querySelector('.upload-section');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadSection.addEventListener(eventName, this.preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadSection.addEventListener(
        eventName,
        () => {
          uploadSection.classList.add('drag-over');
        },
        false
      );
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadSection.addEventListener(
        eventName,
        () => {
          uploadSection.classList.remove('drag-over');
        },
        false
      );
    });

    uploadSection.addEventListener(
      'drop',
      event => {
        const { files } = event.dataTransfer;
        if (files.length > 0) {
          this.processImageFile(files[0]);
        }
      },
      false
    );

    // Image load event
    this.imagePreview.addEventListener('load', () => {
      this.processImage();
    });
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
      this.processImageFile(file);
    }
  }

  processImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      this.imagePreview.src = event.target.result;
      document.querySelector('.imageSection').style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  processImage() {
    if (!this.imagePreview.complete) return;

    // Clear previous swatches
    const swatches = document.querySelectorAll('.swatches');
    swatches.forEach(swatch => {
      while (swatch.children.length >= 10) {
        swatch.removeChild(swatch.firstChild);
      }
    });

    try {
      // Get dominant color
      const dominantColor = ColorThief.getDominantColor(this.imagePreview);
      if (dominantColor) {
        const dominantSwatch = document.querySelector('.dominantColor .swatches');
        this.appendColors([dominantColor], dominantSwatch);
      }

      // Get color palette
      const colorCount = parseInt(this.imagePreview.dataset.colorcount) || 10;
      const palette = ColorThief.getPalette(this.imagePreview, colorCount);
      if (palette) {
        const paletteSwatch = document.querySelector('.medianCutPalette .swatches');
        this.appendColors(palette, paletteSwatch);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try a different image.');
    }
  }

  appendColors(colors, container) {
    colors.forEach((color, index) => {
      const swatchEl = document.createElement('div');
      swatchEl.className = 'swatch';
      swatchEl.style.backgroundColor = `rgb(${color.join(',')})`;
      swatchEl.title = `RGB(${color.join(', ')}) | ${ColorThief.rgbToHex(color)}`;

      // Add click to copy functionality
      swatchEl.addEventListener('click', () => {
        this.copyColorToClipboard(color);
      });

      container.appendChild(swatchEl);
    });
  }

  async copyColorToClipboard(color) {
    const hexColor = ColorThief.rgbToHex(color);
    try {
      await navigator.clipboard.writeText(hexColor);
      this.showNotification(`Copied ${hexColor} to clipboard!`);
    } catch (err) {
      console.warn('Could not copy color to clipboard', err);
      this.showNotification(`Color: ${hexColor} (copy manually)`);
    }
  }

  showNotification(message) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }

  animateTitle() {
    // Modern CSS animation approach instead of lettering.js
    const title = document.querySelector('h1');
    if (title) {
      title.classList.add('animated-title');

      // Split text into spans for animation
      const text = title.textContent;
      title.innerHTML = text
        .split('')
        .map((char, i) => `<span style="animation-delay: ${i * 0.1}s">${char}</span>`)
        .join('');
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new ColorThiefApp();
  // Make app available globally for debugging
  window.colorThiefApp = app;
});

export default ColorThiefApp;
