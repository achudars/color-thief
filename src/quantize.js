/*
 * Modern ES6+ port of the MMCQ (modified median cut quantization) algorithm
 * Original by Nick Rabinowitz
 * Modernized and simplified for Color Thief v2.0
 *
 * Licensed under the MIT license
 */

/**
 * Utility functions
 */
const utils = {
  naturalOrder: (a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  },
  sum: (array, fn) => array.reduce((p, d, i) => p + (fn ? fn(d, i) : d), 0),
  max: (array, fn) => Math.max(...(fn ? array.map(fn) : array))
};

/**
 * Simple priority queue implementation
 */
class PQueue {
  constructor(comparator) {
    this.contents = [];
    this.sorted = false;
    this.compare = comparator;
  }

  sort() {
    this.contents.sort(this.compare);
    this.sorted = true;
  }

  push(item) {
    this.contents.push(item);
    this.sorted = false;
  }

  peek(index = this.contents.length - 1) {
    if (!this.sorted) this.sort();
    return this.contents[index];
  }

  pop() {
    if (!this.sorted) this.sort();
    return this.contents.pop();
  }

  size() {
    return this.contents.length;
  }

  map(fn) {
    return this.contents.map(fn);
  }
}

/**
 * 3D color space box for median cut algorithm
 */
class VBox {
  constructor(r1, r2, g1, g2, b1, b2, histo) {
    this.r1 = r1;
    this.r2 = r2;
    this.g1 = g1;
    this.g2 = g2;
    this.b1 = b1;
    this.b2 = b2;
    this.histo = histo;
    this._volume = null;
    this._count = null;
    this._avg = null;
  }

  volume(force = false) {
    if (!this._volume || force) {
      this._volume = (this.r2 - this.r1 + 1) * (this.g2 - this.g1 + 1) * (this.b2 - this.b1 + 1);
    }
    return this._volume;
  }

  count(force = false) {
    if (!this._count || force) {
      let npix = 0;
      for (let i = this.r1; i <= this.r2; i++) {
        for (let j = this.g1; j <= this.g2; j++) {
          for (let k = this.b1; k <= this.b2; k++) {
            const index = getColorIndex(i, j, k);
            npix += this.histo[index] || 0;
          }
        }
      }
      this._count = npix;
    }
    return this._count;
  }

  copy() {
    return new VBox(this.r1, this.r2, this.g1, this.g2, this.b1, this.b2, this.histo);
  }

  avg(force = false) {
    if (!this._avg || force) {
      let ntot = 0;
      const mult = 1 << (8 - SIGBITS);
      let rsum = 0,
        gsum = 0,
        bsum = 0;

      for (let i = this.r1; i <= this.r2; i++) {
        for (let j = this.g1; j <= this.g2; j++) {
          for (let k = this.b1; k <= this.b2; k++) {
            const histoindex = getColorIndex(i, j, k);
            const hval = this.histo[histoindex] || 0;
            ntot += hval;
            rsum += hval * (i + 0.5) * mult;
            gsum += hval * (j + 0.5) * mult;
            bsum += hval * (k + 0.5) * mult;
          }
        }
      }

      if (ntot) {
        this._avg = [Math.floor(rsum / ntot), Math.floor(gsum / ntot), Math.floor(bsum / ntot)];
      } else {
        this._avg = [
          Math.floor((mult * (this.r1 + this.r2 + 1)) / 2),
          Math.floor((mult * (this.g1 + this.g2 + 1)) / 2),
          Math.floor((mult * (this.b1 + this.b2 + 1)) / 2)
        ];
      }
    }
    return this._avg;
  }

  contains(pixel) {
    const rval = pixel[0] >> RSHIFT;
    const gval = pixel[1] >> RSHIFT;
    const bval = pixel[2] >> RSHIFT;
    return (
      rval >= this.r1 &&
      rval <= this.r2 &&
      gval >= this.g1 &&
      gval <= this.g2 &&
      bval >= this.b1 &&
      bval <= this.b2
    );
  }
}

/**
 * Color map for storing quantized colors
 */
class CMap {
  constructor() {
    this.vboxes = new PQueue((a, b) =>
      utils.naturalOrder(a.vbox.count() * a.vbox.volume(), b.vbox.count() * b.vbox.volume())
    );
  }

  push(vbox) {
    this.vboxes.push({
      vbox,
      color: vbox.avg()
    });
  }

  palette() {
    return this.vboxes.map(vb => vb.color);
  }

  size() {
    return this.vboxes.size();
  }

  map(color) {
    for (const item of this.vboxes.contents) {
      if (item.vbox.contains(color)) {
        return item.color;
      }
    }
    return this.nearest(color);
  }

  nearest(color) {
    let minDistance = Infinity;
    let nearest = null;

    this.vboxes.contents.forEach(({ color: vbColor }) => {
      const distance = Math.sqrt(
        Math.pow(color[0] - vbColor[0], 2) +
          Math.pow(color[1] - vbColor[1], 2) +
          Math.pow(color[2] - vbColor[2], 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = vbColor;
      }
    });

    return nearest;
  }
}

// Algorithm constants
const SIGBITS = 5;
const RSHIFT = 8 - SIGBITS;
const MAX_ITERATIONS = 1000;
const FRACT_BY_POPULATIONS = 0.75;

/**
 * Get reduced-space color index for a pixel
 */
function getColorIndex(r, g, b) {
  return (r << (2 * SIGBITS)) + (g << SIGBITS) + b;
}

/**
 * Create histogram from pixels
 */
function getHisto(pixels) {
  const histo = {};
  let index;

  pixels.forEach(pixel => {
    index = getColorIndex(pixel[0] >> RSHIFT, pixel[1] >> RSHIFT, pixel[2] >> RSHIFT);
    histo[index] = (histo[index] || 0) + 1;
  });

  return histo;
}

/**
 * Create VBox from pixels
 */
function vboxFromPixels(pixels, histo) {
  let rmin = Infinity,
    rmax = 0;
  let gmin = Infinity,
    gmax = 0;
  let bmin = Infinity,
    bmax = 0;

  pixels.forEach(pixel => {
    const rval = pixel[0] >> RSHIFT;
    const gval = pixel[1] >> RSHIFT;
    const bval = pixel[2] >> RSHIFT;

    rmin = Math.min(rval, rmin);
    rmax = Math.max(rval, rmax);
    gmin = Math.min(gval, gmin);
    gmax = Math.max(gval, gmax);
    bmin = Math.min(bval, bmin);
    bmax = Math.max(bval, bmax);
  });

  return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo);
}

/**
 * Apply median cut to a vbox
 */
function medianCutApply(histo, vbox) {
  if (!vbox.count()) return;

  const rw = vbox.r2 - vbox.r1 + 1;
  const gw = vbox.g2 - vbox.g1 + 1;
  const bw = vbox.b2 - vbox.b1 + 1;
  const maxw = Math.max(rw, gw, bw);

  if (vbox.count() === 1) {
    return [vbox.copy()];
  }

  let total = 0;
  const partialsum = [];
  const lookaheadsum = [];

  let i, j, k, sum, index;

  if (maxw === rw) {
    for (i = vbox.r1; i <= vbox.r2; i++) {
      sum = 0;
      for (j = vbox.g1; j <= vbox.g2; j++) {
        for (k = vbox.b1; k <= vbox.b2; k++) {
          index = getColorIndex(i, j, k);
          sum += histo[index] || 0;
        }
      }
      total += sum;
      partialsum[i] = total;
    }
  } else if (maxw === gw) {
    for (i = vbox.g1; i <= vbox.g2; i++) {
      sum = 0;
      for (j = vbox.r1; j <= vbox.r2; j++) {
        for (k = vbox.b1; k <= vbox.b2; k++) {
          index = getColorIndex(j, i, k);
          sum += histo[index] || 0;
        }
      }
      total += sum;
      partialsum[i] = total;
    }
  } else {
    for (i = vbox.b1; i <= vbox.b2; i++) {
      sum = 0;
      for (j = vbox.r1; j <= vbox.r2; j++) {
        for (k = vbox.g1; k <= vbox.g2; k++) {
          index = getColorIndex(j, k, i);
          sum += histo[index] || 0;
        }
      }
      total += sum;
      partialsum[i] = total;
    }
  }

  partialsum.forEach((d, i) => {
    lookaheadsum[i] = total - d;
  });

  function doCut(color) {
    const dim1 = `${color}1`;
    const dim2 = `${color}2`;
    let left,
      right,
      vbox1,
      vbox2,
      d2,
      count2 = 0;

    for (i = vbox[dim1]; i <= vbox[dim2]; i++) {
      if (partialsum[i] > total / 2) {
        vbox1 = vbox.copy();
        vbox2 = vbox.copy();
        left = i - vbox[dim1];
        right = vbox[dim2] - i;

        if (left <= right) {
          d2 = Math.min(vbox[dim2] - 1, ~~(i + right / 2));
        } else {
          d2 = Math.max(vbox[dim1], ~~(i - 1 - left / 2));
        }

        while (!partialsum[d2]) d2++;
        count2 = lookaheadsum[d2];
        while (!count2 && partialsum[d2 - 1]) count2 = lookaheadsum[--d2];

        vbox1[dim2] = d2;
        vbox2[dim1] = vbox1[dim2] + 1;
        return [vbox1, vbox2];
      }
    }
  }

  if (maxw === rw) {
    return doCut('r');
  } else if (maxw === gw) {
    return doCut('g');
  } else {
    return doCut('b');
  }
}

/**
 * Main quantization function
 */
function quantize(pixels, maxcolors) {
  if (!pixels.length || maxcolors < 2 || maxcolors > 256) {
    return null;
  }

  const histo = getHisto(pixels);

  // Check if we have fewer colors than requested
  const nColors = Object.keys(histo).length;
  if (nColors <= maxcolors) {
    const cmap = new CMap();
    Object.keys(histo).forEach(key => {
      const [r, g, b] = [
        (key >> (2 * SIGBITS)) << RSHIFT,
        ((key >> SIGBITS) & ((1 << SIGBITS) - 1)) << RSHIFT,
        (key & ((1 << SIGBITS) - 1)) << RSHIFT
      ];
      cmap.push(new VBox(r, r, g, g, b, b, { [key]: histo[key] }));
    });
    return cmap;
  }

  const vbox = vboxFromPixels(pixels, histo);
  const pq = new PQueue((a, b) => utils.naturalOrder(a.count(), b.count()));
  pq.push(vbox);

  function iter(lh, target) {
    let ncolors = 1;
    let niters = 0;

    while (niters < MAX_ITERATIONS) {
      const vbox = lh.pop();
      if (!vbox.count()) {
        lh.push(vbox);
        niters++;
        continue;
      }

      const vboxes = medianCutApply(histo, vbox);
      const [vbox1, vbox2] = vboxes || [];

      if (!vbox1) return;

      lh.push(vbox1);
      if (vbox2) {
        lh.push(vbox2);
        ncolors++;
      }
      if (ncolors >= target) return;
      if (niters++ > MAX_ITERATIONS) return;
    }
  }

  // First iteration
  iter(pq, FRACT_BY_POPULATIONS * maxcolors);

  // Re-sort by volume * count
  const pq2 = new PQueue((a, b) =>
    utils.naturalOrder(a.count() * a.volume(), b.count() * b.volume())
  );
  while (pq.size()) {
    pq2.push(pq.pop());
  }

  // Second iteration
  iter(pq2, maxcolors - pq2.size());

  // Generate final color map
  const cmap = new CMap();
  while (pq2.size()) {
    cmap.push(pq2.pop());
  }

  return cmap;
}

/**
 * MMCQ object for backward compatibility
 */
export const MMCQ = {
  quantize
};

export default MMCQ;
