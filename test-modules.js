// Test file to validate module imports
import { ColorThief } from './src/color-thief.js';

console.log('ColorThief imported successfully:', ColorThief);
console.log('Available methods:', Object.getOwnPropertyNames(ColorThief));

// Test if the app initializes
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, testing ColorThief...');

  // Create a test canvas to verify the functionality
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');

  // Draw a simple red square
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 100, 100);

  try {
    const color = ColorThief.getDominantColor(canvas);
    console.log('Test successful! Dominant color:', color);
  } catch (error) {
    console.error('Error testing ColorThief:', error);
  }
});
