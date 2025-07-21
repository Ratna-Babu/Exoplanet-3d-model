import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export const generatePlanetTexture = (planet) => {
  const textureSize = 512;
  const canvas = document.createElement('canvas');
  canvas.width = textureSize;
  canvas.height = textureSize;
  const context = canvas.getContext('2d');

  // Determine surface type based on physical properties
  const surfaceType = getSurfaceType(planet);
  
  // Create gradient background
  const gradient = context.createRadialGradient(
    textureSize/2, textureSize/2, 0,
    textureSize/2, textureSize/2, textureSize/2
  );
  
  // Base color and surface features
  const baseColor = getBaseColor(planet, surfaceType);
  const accentColor = getAccentColor(planet, surfaceType);
  
  gradient.addColorStop(0, lightenColor(baseColor, 30));
  gradient.addColorStop(0.7, baseColor);
  gradient.addColorStop(1, darkenColor(baseColor, 20));
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, textureSize, textureSize);

  // Add surface details and atmospheric features
  addSurfaceDetails(context, surfaceType, planet, baseColor, accentColor);
  
  if (planet.pl_atmosphere) {
    addAtmosphericFeatures(context, textureSize);
  }

  // Add specular highlights
  addSpecularHighlights(context, textureSize);

  // Return the texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16; // Improve texture quality
  return texture;
};

const getSurfaceType = (planet) => {
  const { pl_density, pl_eqt } = planet;
  if (pl_density < 0.5) return 'gas'; // Very low density = gas giant
  if (pl_density < 1) return 'oceanic';
  if (pl_eqt < 200) return 'icy';
  if (pl_eqt > 500) return 'lava';
  return 'rocky';
};

const getBaseColor = (planet, surfaceType) => {
  const temperature = planet.pl_eqt || 300;
  
  // Color variations based on temperature and surface type
  switch (surfaceType) {
    case 'gas':
      return getGasGiantColor(planet);
    case 'oceanic':
      return getOceanColor(temperature);
    case 'icy':
      return getIceColor(temperature);
    case 'lava':
      return getLavaColor(temperature);
    case 'rocky':
    default:
      return getRockyColor(temperature);
  }
};

const getAccentColor = (planet, surfaceType) => {
  const temperature = planet.pl_eqt || 300;
  
  switch (surfaceType) {
    case 'gas':
      return '#ffcc00'; // Yellow for gas giant storms
    case 'oceanic':
      return '#00ff80'; // Bright green for algal blooms
    case 'icy':
      return '#a0e0ff'; // Light blue for ice reflections
    case 'lava':
      return '#ff3300'; // Bright red for lava flows
    case 'rocky':
    default:
      return '#ffaa00'; // Orange for desert features
  }
};

const getGasGiantColor = (planet) => {
  // Create bands of color for gas giants
  const colors = [
    '#ff7733', // Orange
    '#ffaa55', // Light orange
    '#cc5533', // Reddish
    '#ffcc99', // Beige
    '#aa7744'  // Brown
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getOceanColor = (temperature) => {
  // Warmer water = greener, colder water = bluer
  if (temperature > 320) return '#1e90ff'; // Deep blue for warm oceans
  if (temperature > 280) return '#00bfff'; // Blue for temperate oceans
  return '#4682b4'; // Steel blue for cold oceans
};

const getIceColor = (temperature) => {
  // Different ice colors based on temperature
  if (temperature < 100) return '#e0f7ff'; // Very cold = bright blue-white
  if (temperature < 150) return '#c0e0ff'; // Medium cold = light blue
  return '#a0c0ff'; // Warmer ice = deeper blue
};

const getLavaColor = (temperature) => {
  // Different lava colors based on temperature
  if (temperature > 900) return '#ff3300'; // Bright red for hottest
  if (temperature > 700) return '#cc3300'; // Dark red
  return '#993300'; // Deep red for cooler lava
};

const getRockyColor = (temperature) => {
  // Different rock colors based on temperature
  if (temperature > 350) return '#b5651d'; // Desert-like
  if (temperature > 280) return '#8b4513'; // Earth-like
  return '#5d4037'; // Cooler = darker brown
};

const addSurfaceDetails = (context, surfaceType, planet, baseColor, accentColor) => {
  const noise2D = createNoise2D();
  const width = context.canvas.width;
  const height = context.canvas.height;
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const detailScale = surfaceType === 'gas' ? 0.01 : 0.03;
  const featureScale = surfaceType === 'gas' ? 0.005 : 0.015;
  
  // Large-scale features
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);
    
    const nx = x / width - 0.5;
    const ny = y / height - 0.5;
    const distance = Math.sqrt(nx * nx + ny * ny) * 2;
    
    if (distance > 1) continue; // Skip pixels outside planet circle
    
    // Generate noise patterns
    const noiseValue = noise2D(x * detailScale, y * detailScale);
    const featureNoise = noise2D(x * featureScale, y * featureScale);
    
    // Create color variations
    const [r, g, b] = hexToRgb(baseColor);
    let dr = 0, dg = 0, db = 0;
    
    if (surfaceType === 'gas') {
      // Create bands for gas giants
      const bandValue = Math.sin(y * 0.02) * 20;
      dr = bandValue;
      dg = bandValue * 0.8;
      db = bandValue * 0.5;
    } else {
      // Create terrain features for other planets
      const variation = (noiseValue + 1) * 30;
      dr = variation;
      dg = variation;
      db = variation;
    }
    
    // Add accent color for special features
    if (featureNoise > 0.7) {
      const [ar, ag, ab] = hexToRgb(accentColor);
      const mix = (featureNoise - 0.7) * 3.33; // Normalize to 0-1
      data[i] = mixColors(r, ar, mix) + dr;
      data[i + 1] = mixColors(g, ag, mix) + dg;
      data[i + 2] = mixColors(b, ab, mix) + db;
    } else {
      data[i] = r + dr;
      data[i + 1] = g + dg;
      data[i + 2] = b + db;
    }
    
    // Add polar ice caps for cold planets
    if (surfaceType === 'icy' || (surfaceType === 'rocky' && planet.pl_eqt < 250)) {
      const latitude = Math.abs(ny) * 2;
      if (latitude > 0.8) {
        const iceAmount = (latitude - 0.8) * 5;
        data[i] = Math.min(255, data[i] + 100 * iceAmount);
        data[i + 1] = Math.min(255, data[i + 1] + 100 * iceAmount);
        data[i + 2] = Math.min(255, data[i + 2] + 150 * iceAmount);
      }
    }
  }
  
  context.putImageData(imageData, 0, 0);
  
  // Add craters to rocky planets
  if (surfaceType === 'rocky' || surfaceType === 'icy') {
    addCraters(context, width, height);
  }
  
  // Add storms to gas giants
  if (surfaceType === 'gas') {
    addStorms(context, width, height);
  }
};

const addAtmosphericFeatures = (context, size) => {
  context.globalAlpha = 0.3;
  context.fillStyle = '#a0d0ff'; // Atmospheric blue
  context.beginPath();
  context.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  context.fill();
  
  // Add cloud layers
  context.globalAlpha = 0.2;
  context.fillStyle = '#ffffff';
  
  // Create cloud patterns using noise
  const noise2D = createNoise2D();
  const imageData = context.getImageData(0, 0, size, size);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % size;
    const y = Math.floor((i / 4) / size);
    
    const nx = x / size - 0.5;
    const ny = y / size - 0.5;
    const distance = Math.sqrt(nx * nx + ny * ny) * 2;
    
    if (distance > 1) continue;
    
    const cloudValue = (noise2D(x * 0.03, y * 0.03) + 1) * 0.5;
    if (cloudValue > 0.6 && distance < 0.98) {
      const cloudDensity = (cloudValue - 0.6) * 2.5;
      data[i + 3] = Math.min(255, data[i + 3] + cloudDensity * 100);
    }
  }
  
  context.putImageData(imageData, 0, 0);
  context.globalAlpha = 1.0;
};

const addSpecularHighlights = (context, size) => {
  context.globalAlpha = 0.3;
  const gradient = context.createRadialGradient(
    size * 0.7, size * 0.3, 0,
    size * 0.7, size * 0.3, size * 0.5
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(size * 0.7, size * 0.3, size * 0.5, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1.0;
};

const addCraters = (context, width, height) => {
  const craterCount = Math.floor(Math.random() * 20) + 10;
  
  for (let i = 0; i < craterCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 15 + 5;
    
    // Check if crater is within planet
    const nx = (x / width - 0.5) * 2;
    const ny = (y / height - 0.5) * 2;
    if (Math.sqrt(nx * nx + ny * ny) > 1) continue;
    
    // Draw crater shadow
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fill();
    
    // Draw crater rim
    context.strokeStyle = 'rgba(150, 150, 150, 0.8)';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.stroke();
    
    // Draw highlight
    context.fillStyle = 'rgba(200, 200, 200, 0.3)';
    context.beginPath();
    context.arc(x - size/3, y - size/3, size/3, 0, Math.PI * 2);
    context.fill();
  }
};

const addStorms = (context, width, height) => {
  const stormCount = Math.floor(Math.random() * 3) + 1;
  
  for (let i = 0; i < stormCount; i++) {
    const x = width/2 + (Math.random() - 0.5) * width * 0.6;
    const y = height/2 + (Math.random() - 0.5) * height * 0.6;
    const size = Math.random() * 50 + 30;
    
    // Draw storm
    context.fillStyle = '#ffcc00';
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fill();
    
    // Add storm details
    context.strokeStyle = '#ff6600';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(x, y, size * 0.8, 0, Math.PI * 2);
    context.stroke();
    
    context.beginPath();
    context.arc(x, y, size * 0.6, 0, Math.PI * 2);
    context.stroke();
  }
};

// Helper functions
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

const lightenColor = (color, percent) => {
  const [r, g, b] = hexToRgb(color);
  return `rgb(${Math.min(255, r + 255 * percent/100)}, 
          ${Math.min(255, g + 255 * percent/100)}, 
          ${Math.min(255, b + 255 * percent/100)})`;
};

const darkenColor = (color, percent) => {
  const [r, g, b] = hexToRgb(color);
  return `rgb(${Math.max(0, r - 255 * percent/100)}, 
          ${Math.max(0, g - 255 * percent/100)}, 
          ${Math.max(0, b - 255 * percent/100)})`;
};

const mixColors = (color1, color2, ratio) => {
  return Math.floor(color1 * (1 - ratio) + color2 * ratio);
};