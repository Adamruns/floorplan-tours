// Procedural textures drawn on canvases so a tour ships as one file with no image requests.
// Tiled textures map to world feet: geometry UVs are in feet and texture.repeat is 1 / span.

let MAX_ANISOTROPY = 8;
// HD mode draws every texture at twice the pixel density; drawing code stays in 1x logical units.
let TEXTURE_SCALE = 1;

function setMaxAnisotropy(value) {
  MAX_ANISOTROPY = value;
}

function setTextureScale(value) {
  TEXTURE_SCALE = value;
}

function scaledCanvas(logicalWidth, logicalHeight = logicalWidth) {
  const canvas = createCanvas(logicalWidth * TEXTURE_SCALE, logicalHeight * TEXTURE_SCALE);
  const context = canvas.getContext('2d');
  return { canvas, context };
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hsl(hue, saturation, lightness, alpha = 1) {
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

function canvasTexture(canvas, { spanFeet = null, colorData = true } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = MAX_ANISOTROPY;

  if (colorData) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  if (spanFeet) {
    texture.repeat.set(1 / spanFeet, 1 / spanFeet);
  }

  return texture;
}

// Planks run along the texture's v axis; floors map v to plan z, so planks run north-south.
function woodPlankTexture({ hue = 30, saturation = 42, lightness = 48, seed = 7 } = {}) {
  const SIZE = 1024;
  const SPAN_FEET = 8;
  const PIXELS_PER_FOOT = SIZE / SPAN_FEET;
  const PLANK_COUNT = 13;
  const plankWidth = SIZE / PLANK_COUNT;
  const random = seededRandom(seed);
  const { canvas, context } = scaledCanvas(SIZE);
  context.scale(TEXTURE_SCALE, TEXTURE_SCALE);

  function drawPlank(left, top, length) {
    const plankHue = hue + (random() - 0.5) * 5;
    const plankLightness = lightness + (random() - 0.5) * 8;
    const plankSaturation = saturation + (random() - 0.5) * 7;
    context.fillStyle = hsl(plankHue, plankSaturation, plankLightness);
    context.fillRect(left, top, plankWidth, length);

    const grainCount = 18 + Math.floor(random() * 14);
    for (let index = 0; index < grainCount; index++) {
      const grainX = left + random() * plankWidth;
      const wobble = 1 + random() * 3;
      const frequency = 0.004 + random() * 0.01;
      const phase = random() * Math.PI * 2;
      context.strokeStyle = hsl(plankHue - 4, plankSaturation + 8, plankLightness - 14 - random() * 10, 0.08 + random() * 0.16);
      context.lineWidth = 0.6 + random() * 1.8;
      context.beginPath();
      for (let step = 0; step <= length; step += 8) {
        const offsetX = Math.sin(step * frequency + phase) * wobble;
        const pointX = Math.min(left + plankWidth - 1, Math.max(left + 1, grainX + offsetX));
        if (step === 0) {
          context.moveTo(pointX, top + step);
        } else {
          context.lineTo(pointX, top + step);
        }
      }
      context.stroke();
    }

    if (random() < 0.35) {
      const knotX = left + plankWidth * (0.25 + random() * 0.5);
      const knotY = top + length * (0.2 + random() * 0.6);
      const gradient = context.createRadialGradient(knotX, knotY, 0, knotX, knotY, 9);
      gradient.addColorStop(0, hsl(plankHue - 6, plankSaturation + 10, plankLightness - 26, 0.55));
      gradient.addColorStop(1, hsl(plankHue, plankSaturation, plankLightness, 0));
      context.fillStyle = gradient;
      context.beginPath();
      context.ellipse(knotX, knotY, 6, 14, 0, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = hsl(hue - 6, saturation, Math.max(8, lightness - 30), 0.55);
    context.fillRect(left, top, 1.5, length);
    context.fillRect(left, top, plankWidth, 1.5);
  }

  for (let column = 0; column < PLANK_COUNT; column++) {
    const left = column * plankWidth;
    let top = -random() * 4 * PIXELS_PER_FOOT;
    while (top < SIZE) {
      const length = (3 + random() * 2.5) * PIXELS_PER_FOOT;
      drawPlank(left, top, length);
      // Draw the wrapped copy so the texture tiles without a seam.
      if (top + length > SIZE) {
        drawPlank(left, top - SIZE, length);
      }
      if (top < 0) {
        drawPlank(left, top + SIZE, length);
      }
      top += length;
    }
  }

  return canvasTexture(canvas, { spanFeet: SPAN_FEET });
}

function noiseFill(context, size, baseRgb, amplitude, random) {
  const image = context.getImageData(0, 0, size, size);
  for (let index = 0; index < image.data.length; index += 4) {
    const noise = (random() + random() + random() - 1.5) * amplitude;
    image.data[index] = Math.max(0, Math.min(255, baseRgb[0] + noise));
    image.data[index + 1] = Math.max(0, Math.min(255, baseRgb[1] + noise));
    image.data[index + 2] = Math.max(0, Math.min(255, baseRgb[2] + noise * 0.9));
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

function carpetTexture({ rgb = [172, 157, 139], seed = 11 } = {}) {
  const SIZE = 512;
  const random = seededRandom(seed);
  const { canvas, context } = scaledCanvas(SIZE);
  noiseFill(context, SIZE * TEXTURE_SCALE, rgb, 26, random);
  context.scale(TEXTURE_SCALE, TEXTURE_SCALE);

  for (let index = 0; index < 2600; index++) {
    context.fillStyle = `rgba(${rgb[0] - 40}, ${rgb[1] - 40}, ${rgb[2] - 40}, ${0.05 + random() * 0.08})`;
    context.fillRect(random() * SIZE, random() * SIZE, 1 + random() * 3, 1 + random() * 3);
  }

  return canvasTexture(canvas, { spanFeet: 3 });
}

function tileTexture({ rgb = [214, 199, 174], grout = 'rgb(196, 181, 156)', tileInches = 12, seed = 5 } = {}) {
  const SIZE = 512;
  const SPAN_FEET = 4;
  const tilesAcross = Math.round((SPAN_FEET * 12) / tileInches);
  const tileSize = SIZE / tilesAcross;
  const random = seededRandom(seed);
  const { canvas, context } = scaledCanvas(SIZE);
  noiseFill(context, SIZE * TEXTURE_SCALE, rgb, 10, random);
  context.scale(TEXTURE_SCALE, TEXTURE_SCALE);

  for (let row = 0; row < tilesAcross; row++) {
    for (let column = 0; column < tilesAcross; column++) {
      const shade = (random() - 0.5) * 14;
      context.fillStyle = `rgba(${rgb[0] + shade}, ${rgb[1] + shade}, ${rgb[2] + shade}, 0.35)`;
      context.fillRect(column * tileSize, row * tileSize, tileSize, tileSize);
      for (let blotch = 0; blotch < 6; blotch++) {
        context.fillStyle = `rgba(${rgb[0] - 20}, ${rgb[1] - 22}, ${rgb[2] - 26}, ${0.04 + random() * 0.05})`;
        context.beginPath();
        context.arc(column * tileSize + random() * tileSize, row * tileSize + random() * tileSize, 6 + random() * 18, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  context.fillStyle = grout;
  for (let line = 0; line <= tilesAcross; line++) {
    context.fillRect(line * tileSize - 1.5, 0, 3, SIZE);
    context.fillRect(0, line * tileSize - 1.5, SIZE, 3);
  }

  return canvasTexture(canvas, { spanFeet: SPAN_FEET });
}

function subwayTileTexture() {
  const SIZE = 512;
  const SPAN_FEET = 2;
  const PIXELS_PER_INCH = SIZE / (SPAN_FEET * 12);
  const tileWidth = 6 * PIXELS_PER_INCH;
  const tileHeight = 3 * PIXELS_PER_INCH;
  const random = seededRandom(19);
  const { canvas, context } = scaledCanvas(SIZE);
  context.scale(TEXTURE_SCALE, TEXTURE_SCALE);
  context.fillStyle = 'rgb(206, 206, 202)';
  context.fillRect(0, 0, SIZE, SIZE);

  for (let row = 0; row * tileHeight < SIZE; row++) {
    const offset = row % 2 === 0 ? 0 : tileWidth / 2;
    for (let column = -1; column * tileWidth < SIZE + tileWidth; column++) {
      const left = column * tileWidth + offset;
      const top = row * tileHeight;
      const shade = 244 + Math.floor((random() - 0.5) * 8);
      const gradient = context.createLinearGradient(left, top, left, top + tileHeight);
      gradient.addColorStop(0, `rgb(${shade + 6}, ${shade + 6}, ${shade + 4})`);
      gradient.addColorStop(1, `rgb(${shade - 6}, ${shade - 6}, ${shade - 8})`);
      context.fillStyle = gradient;
      context.fillRect(left + 1.5, top + 1.5, tileWidth - 3, tileHeight - 3);
    }
  }

  return canvasTexture(canvas, { spanFeet: SPAN_FEET });
}

const COUNTER_STYLES = {
  'granite-beige': {
    base: [200, 178, 140],
    speckles: ['#5a4a3a', '#8a5a3a', '#2a2420', '#e8dcc8', '#b08f62', '#d9c29a'],
    density: 42000,
    veins: false,
    fine: true,
  },
  'quartz-white': {
    base: [240, 239, 235],
    speckles: ['#d8d6d0', '#c9c7c1', '#e4e2dc'],
    density: 2500,
    veins: true,
  },
  'granite-black': {
    base: [32, 31, 32],
    speckles: ['#5b5a5c', '#77746f', '#141414', '#9b968e'],
    density: 24000,
    veins: false,
    fine: true,
  },
};

function counterTexture(style = 'granite-beige', seed = 23) {
  const settings = COUNTER_STYLES[style] ?? COUNTER_STYLES['granite-beige'];
  const SIZE = 1024;
  const random = seededRandom(seed);
  const { canvas, context } = scaledCanvas(SIZE);
  noiseFill(context, SIZE * TEXTURE_SCALE, settings.base, 8, random);
  context.scale(TEXTURE_SCALE, TEXTURE_SCALE);

  for (let index = 0; index < settings.density; index++) {
    context.fillStyle = settings.speckles[Math.floor(random() * settings.speckles.length)];
    context.globalAlpha = 0.45 + random() * 0.55;
    const radius = settings.fine ? 0.5 + random() * 1.3 : random() < 0.85 ? 0.8 + random() * 2.2 : 2.5 + random() * 4.5;
    context.beginPath();
    context.ellipse(random() * SIZE, random() * SIZE, radius, radius * (0.6 + random() * 0.6), random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = 1;

  if (settings.veins) {
    for (let vein = 0; vein < 7; vein++) {
      context.strokeStyle = `rgba(150, 150, 150, ${0.08 + random() * 0.12})`;
      context.lineWidth = 1 + random() * 3;
      context.beginPath();
      context.moveTo(random() * SIZE, 0);
      context.bezierCurveTo(random() * SIZE, SIZE * 0.33, random() * SIZE, SIZE * 0.66, random() * SIZE, SIZE);
      context.stroke();
    }
  }

  return canvasTexture(canvas, { spanFeet: 4 });
}

// Grayscale shaker door face; the material color tints it to the cabinet finish.
function shakerDoorTexture() {
  const SIZE = 256;
  const canvas = createCanvas(SIZE, SIZE);
  const context = canvas.getContext('2d');
  const frame = SIZE * 0.17;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, SIZE, SIZE);
  context.fillStyle = '#e9e9e9';
  context.fillRect(frame, frame, SIZE - frame * 2, SIZE - frame * 2);
  context.fillStyle = 'rgba(0, 0, 0, 0.28)';
  context.fillRect(frame, frame, SIZE - frame * 2, 4);
  context.fillRect(frame, frame, 4, SIZE - frame * 2);
  context.fillStyle = 'rgba(255, 255, 255, 0.9)';
  context.fillRect(frame, SIZE - frame - 3, SIZE - frame * 2, 3);
  context.fillRect(SIZE - frame - 3, frame, 3, SIZE - frame * 2);
  context.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  context.lineWidth = 3;
  context.strokeRect(1.5, 1.5, SIZE - 3, SIZE - 3);
  const texture = canvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Near-white orange-peel drywall; tints the paint color slightly and doubles as its bump map.
function drywallTexture() {
  const SIZE = 512;
  const random = seededRandom(47);
  const { canvas, context } = scaledCanvas(SIZE);
  noiseFill(context, SIZE * TEXTURE_SCALE, [251, 251, 251], 3, random);
  context.scale(TEXTURE_SCALE, TEXTURE_SCALE);
  for (let index = 0; index < 1400; index++) {
    context.fillStyle = `rgba(${random() < 0.5 ? '255, 255, 255' : '228, 228, 228'}, ${0.03 + random() * 0.04})`;
    context.beginPath();
    context.arc(random() * SIZE, random() * SIZE, 1 + random() * 3, 0, Math.PI * 2);
    context.fill();
  }
  return canvasTexture(canvas, { spanFeet: 3 });
}

function grassTexture() {
  const SIZE = 512;
  const random = seededRandom(31);
  const canvas = createCanvas(SIZE, SIZE);
  const context = canvas.getContext('2d');
  noiseFill(context, SIZE, [104, 132, 76], 30, random);
  for (let index = 0; index < 5000; index++) {
    context.fillStyle = random() < 0.5 ? 'rgba(70, 98, 50, 0.5)' : 'rgba(150, 168, 98, 0.4)';
    context.fillRect(random() * SIZE, random() * SIZE, 1, 2 + random() * 4);
  }
  return canvasTexture(canvas, { spanFeet: 12 });
}

function facadeTexture({ wallRgb = [205, 186, 158], seed = 41 } = {}) {
  const SIZE = 512;
  const SPAN_FEET = 24;
  const PIXELS_PER_FOOT = SIZE / SPAN_FEET;
  const random = seededRandom(seed);
  const canvas = createCanvas(SIZE, SIZE);
  const context = canvas.getContext('2d');
  noiseFill(context, SIZE, wallRgb, 10, random);

  for (let floor = 0; floor < 2; floor++) {
    for (let bay = 0; bay < 3; bay++) {
      const left = (bay * 8 + 2.5) * PIXELS_PER_FOOT;
      const top = (floor * 12 + 3) * PIXELS_PER_FOOT;
      context.fillStyle = '#f2efe8';
      context.fillRect(left - 3, top - 3, 3 * PIXELS_PER_FOOT + 6, 5.5 * PIXELS_PER_FOOT + 6);
      const glow = 70 + random() * 50;
      context.fillStyle = `rgb(${glow * 0.7}, ${glow * 0.8}, ${glow})`;
      context.fillRect(left, top, 3 * PIXELS_PER_FOOT, 5.5 * PIXELS_PER_FOOT);
      context.fillStyle = '#f2efe8';
      context.fillRect(left + 1.5 * PIXELS_PER_FOOT - 1.5, top, 3, 5.5 * PIXELS_PER_FOOT);
    }
  }

  return canvasTexture(canvas, { spanFeet: SPAN_FEET });
}

function skyTexture() {
  const canvas = createCanvas(4, 512);
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#6f9fd1');
  gradient.addColorStop(0.42, '#bcd5ea');
  gradient.addColorStop(0.5, '#e9eef0');
  gradient.addColorStop(0.53, '#b9bea9');
  gradient.addColorStop(1, '#7d8a66');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 4, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function fabricTexture({ seed = 3 } = {}) {
  const SIZE = 256;
  const random = seededRandom(seed);
  const canvas = createCanvas(SIZE, SIZE);
  const context = canvas.getContext('2d');
  noiseFill(context, SIZE, [236, 236, 236], 22, random);
  for (let line = 0; line < SIZE; line += 3) {
    context.fillStyle = 'rgba(0, 0, 0, 0.035)';
    context.fillRect(0, line, SIZE, 1);
    context.fillRect(line, 0, 1, SIZE);
  }
  return canvasTexture(canvas, { spanFeet: 1.5 });
}

function artTexture(palette, seed = 1) {
  const SIZE = 256;
  const random = seededRandom(seed);
  const canvas = createCanvas(SIZE, SIZE);
  const context = canvas.getContext('2d');
  context.fillStyle = palette[0];
  context.fillRect(0, 0, SIZE, SIZE);
  for (let index = 0; index < 9; index++) {
    context.fillStyle = palette[1 + Math.floor(random() * (palette.length - 1))];
    context.globalAlpha = 0.5 + random() * 0.5;
    context.beginPath();
    const centerX = random() * SIZE;
    const centerY = random() * SIZE;
    const radius = 20 + random() * 70;
    if (random() < 0.5) {
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    } else {
      context.rect(centerX - radius / 2, centerY - radius / 2, radius, radius * (0.4 + random()));
    }
    context.fill();
  }
  context.globalAlpha = 1;
  const texture = canvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
