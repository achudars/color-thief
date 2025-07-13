# Color Thief - Modern Edition\*

[![npm version](https://badge.fury.io/js/color-thief-modern.svg)](https://badge.fury.io/js/color-thief-modern)
[![License: CC BY 2.5](https://img.shields.io/badge/License-CC%20BY%202.5-lightgrey.svg)](https://creativecommons.org/licenses/by/2.5/)

A modern, fast JavaScript library for extracting dominant colors and color palettes from images. Built with ES6+ features and optimized for modern browsers.

### \*With additional upload functionality, so now it provides you the possibility to try this plugin to see if it fits your needs. -Aleks

[See a Demo](http://lokeshdhakar.com/projects/color-thief) | [Read more on Lokesh's blog](http://lokeshdhakar.com/color-thief) | [Try the Modern Version](https://achudars.github.io/color-thief/)

![Color Thief Demo](https://i.imgur.com/AKoBgXK.png)

## ✨ Features

- 🎨 **Advanced Algorithm**: Uses modified median cut quantization (MMCQ) for accurate color extraction
- ⚡ **Modern Performance**: Built with ES6+ features, optimized for speed
- 📱 **Responsive**: Works on desktop, tablet, and mobile devices
- 🔗 **Easy Integration**: Simple API that works with any image source
- 🌙 **Dark Mode**: Automatic dark mode support
- ♿ **Accessible**: Built with accessibility in mind
- 📦 **Tree Shakable**: ES modules for optimal bundle size

## 🚀 Quick Start

### Installation

```bash
npm install color-thief-modern
```

### Basic Usage

```javascript
import { ColorThief } from 'color-thief-modern';

// Get dominant color
const dominantColor = ColorThief.getDominantColor(imageElement);
// Returns: [r, g, b] array

// Get color palette
const palette = ColorThief.getPalette(imageElement, 8);
// Returns: [[r,g,b], [r,g,b], ...] array

// Convert to hex
const hexColor = ColorThief.rgbToHex(dominantColor);
// Returns: "#ff5733"

// Convert to HSL
const hslColor = ColorThief.rgbToHsl(dominantColor);
// Returns: [h, s, l] array
```

### HTML Usage

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module">
      import { ColorThief } from './path/to/color-thief.js';

      const img = document.getElementById('myImage');
      img.addEventListener('load', function () {
        const dominantColor = ColorThief.getDominantColor(this);
        console.log('Dominant color:', dominantColor);
      });
    </script>
  </head>
  <body>
    <img id="myImage" src="image.jpg" crossorigin="anonymous" />
  </body>
</html>
```

## 📖 API Reference

### `ColorThief.getDominantColor(image, quality?)`

Returns the dominant color from an image. Uses the median cut algorithm provided by quantize.js to cluster similar colors and return the base color from the largest cluster.

**Parameters:**

- `image` (HTMLImageElement|HTMLCanvasElement): The source image
- `quality` (number, optional): Quality/speed trade-off (1-10, default: 10)

**Returns:** `number[]|null` - RGB array [r, g, b] or null if failed

### `ColorThief.getPalette(image, colorCount?, quality?)`

Returns a color palette from an image. Uses the median cut algorithm provided by quantize.js to cluster similar colors.

**Parameters:**

- `image` (HTMLImageElement|HTMLCanvasElement): The source image
- `colorCount` (number, optional): Number of colors to extract (2-20, default: 10)
- `quality` (number, optional): Quality/speed trade-off (1-10, default: 10)

**Returns:** `number[][]|null` - Array of RGB arrays [[r,g,b], ...] or null if failed

### Legacy API (Backward Compatibility)

The original function names are still available as named exports:

```javascript
import { getDominantColor, createPalette } from 'color-thief-modern';

// Original API still works
getDominantColor(sourceImage); // Returns [num, num, num]
createPalette(sourceImage, colorCount); // Returns [[num, num, num], ...]
```

### `ColorThief.getAverageColor(image, sampleSize?)`

Returns the average color from an image.

**Parameters:**

- `image` (HTMLImageElement|HTMLCanvasElement): The source image
- `sampleSize` (number, optional): Pixel sampling rate (default: 10)

**Returns:** `number[]|null` - RGB array [r, g, b] or null if failed

### `ColorThief.rgbToHex(rgb)`

Converts RGB array to hex string.

**Parameters:**

- `rgb` (number[]): RGB array [r, g, b]

**Returns:** `string` - Hex color string (e.g., "#ff5733")

### `ColorThief.rgbToHsl(rgb)`

Converts RGB array to HSL array.

**Parameters:**

- `rgb` (number[]): RGB array [r, g, b]

**Returns:** `number[]` - HSL array [h, s, l]

## 🛠️ Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/achudars/color-thief.git
cd color-thief

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Format code
npm run format
```

### Project Structure

```
├── src/
│   ├── color-thief.js     # Main library
│   ├── quantize.js        # Color quantization algorithm
│   ├── main.js           # Demo application
│   └── styles.css        # Modern CSS styles
├── public/               # Static assets
├── dist/                # Built files
├── index.html           # Modern demo page
├── package.json
├── vite.config.js       # Vite configuration
├── eslint.config.js     # ESLint configuration
└── .prettierrc          # Prettier configuration
```

## 🌟 Improvements Over Original

### Modern JavaScript Features

- ✅ ES6+ classes and modules
- ✅ Async/await and Promises
- ✅ Optional chaining and nullish coalescing
- ✅ Template literals and destructuring
- ✅ Arrow functions and const/let

### Performance Optimizations

- ✅ Improved algorithm efficiency
- ✅ Better memory management
- ✅ Reduced DOM manipulation
- ✅ Tree-shakable modules

### Developer Experience

- ✅ TypeScript-like JSDoc annotations
- ✅ Modern build system (Vite)
- ✅ ESLint and Prettier configuration
- ✅ Better error handling and validation

### User Experience

- ✅ Drag & drop file upload
- ✅ Click to copy colors
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Accessibility improvements

## 🔧 Browser Support

- Chrome 61+
- Firefox 60+
- Safari 12+
- Edge 79+

## 📄 License

**By** [Lokesh Dhakar](http://www.lokeshdhakar.com) | [lokeshdhakar.com](http://www.lokeshdhakar.com) | [twitter.com/lokeshdhakar](http://twitter.com/lokeshdhakar)  
**Modernized by** [Aleksandrs Cudars](https://github.com/achudars) with additional upload functionality

Thanks to [Nick Rabinowitz](https://github.com/NickRabinowitz) for creating quantize.js which provides the MMCQ algorithm, [jfsiii](https://github.com/jfsiii) for a large number of code improvements, and others for submitting issues and fixes.

Licensed under the [Creative Commons Attribution 2.5 License](https://creativecommons.org/licenses/by/2.5/)

- ✅ Free for use in both personal and commercial projects
- ✅ Attribution required: Leave author name, author homepage link, and the license info intact

## 📊 Migration Guide

### From Original Color Thief

```javascript
// Old way (jQuery dependency)
$(document).ready(function () {
  var colorThief = new ColorThief();
  var color = colorThief.getColor(img);
  var palette = colorThief.getPalette(img, 5);
});

// New way (modern ES6+)
import { ColorThief } from 'color-thief-modern';

const color = ColorThief.getDominantColor(img);
const palette = ColorThief.getPalette(img, 5);
```

### Breaking Changes

- No jQuery dependency
- Static methods instead of class instantiation
- ES modules instead of global variables
- `getColor()` renamed to `getDominantColor()`
- `getPalette()` parameters reordered

## 🔗 Links

- [Original Color Thief](https://github.com/lokesh/color-thief)
- [Lokesh's Blog Post](http://www.lokeshdhakar.com/color-thief/)
- [Demo](https://achudars.github.io/color-thief/)
- [Report Issues](https://github.com/achudars/color-thief/issues)
