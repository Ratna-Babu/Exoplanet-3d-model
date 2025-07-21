import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { generatePlanetTexture } from './textures';
import { Button, Box, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const StyledButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  border: 0,
  borderRadius: '8px',
  color: 'white',
  padding: '8px 16px',
  fontWeight: 'bold',
  letterSpacing: '0.5px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 15px rgba(33, 150, 243, 0.4)',
  },
}));

const PlanetInfoCard = styled('div')(({ theme }) => ({
  position: 'absolute',
  right: '20px',
  top: '20px',
  background: 'rgba(12, 20, 69, 0.85)',
  border: '1px solid rgba(100, 150, 255, 0.3)',
  borderRadius: '12px',
  padding: '16px',
  width: '280px',
  backdropFilter: 'blur(5px)',
  boxShadow: '0 0 20px rgba(66, 133, 244, 0.3)',
  color: '#e0f7fa',
  transition: 'transform 0.3s ease, opacity 0.3s ease',
}));

const PlanetarySystem = ({ planetarySystem, starName, onBackClick }) => {
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const planetarySystemGroup = useRef(new THREE.Group());
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [showPlanetInfo, setShowPlanetInfo] = useState(false);
  const planetLabelsRef = useRef([]);
  const planetMeshesRef = useRef([]);
  const addedPlanets = useRef(new Set()); // Track added planets to prevent duplicates

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Pure black background
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    
    // Remove any existing canvas before adding a new one
    if (sceneRef.current.firstChild) {
      sceneRef.current.removeChild(sceneRef.current.firstChild);
    }
    sceneRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Add star field background
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
    });
    
    const starVertices = [];
    for (let i = 0; i < 5000; i++) {
      const x = THREE.MathUtils.randFloatSpread(2000);
      const y = THREE.MathUtils.randFloatSpread(2000);
      const z = THREE.MathUtils.randFloatSpread(2000);
      starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Create star with glow effect
    const starRadius = 0.8;
    const starGeometryMain = new THREE.SphereGeometry(starRadius, 64, 64);
    const starTexture = new THREE.TextureLoader().load('/images/starsurface.jpeg');
    const starMaterialMain = new THREE.MeshBasicMaterial({ 
      map: starTexture,
      color: 0xffddaa
    });
    const starMesh = new THREE.Mesh(starGeometryMain, starMaterialMain);
    planetarySystemGroup.current.add(starMesh);

    // Add star glow
    const starGlowGeometry = new THREE.SphereGeometry(starRadius * 1.8, 32, 32);
    const starGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const starGlow = new THREE.Mesh(starGlowGeometry, starGlowMaterial);
    planetarySystemGroup.current.add(starGlow);

    // Add star corona
    const coronaGeometry = new THREE.SphereGeometry(starRadius * 3, 32, 32);
    const coronaMaterial = new THREE.MeshBasicMaterial({
      color: 0xff9933,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      wireframe: false
    });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    planetarySystemGroup.current.add(corona);

    // Create star label
    const starLabel = createLabel(starName, true);
    starLabel.position.set(0, starRadius + 2, 0);
    planetarySystemGroup.current.add(starLabel);

    const orbitLineThickness = 0.1;
    planetMeshesRef.current.forEach(mesh => planetarySystemGroup.current.remove(mesh));
planetLabelsRef.current.forEach(label => planetarySystemGroup.current.remove(label));
planetMeshesRef.current = [];
planetLabelsRef.current = [];
addedPlanets.current = new Set();
    let maxOrbitRadius = 0;
    const minOrbitGap = 5; // Increased gap between orbits
    const planetMeshes = [];
    const planetLabels = [];

    planetarySystem.forEach((planet, i) => {
      // Ensure each planet is only added once
      if (addedPlanets.current.has(planet.pl_name)) return;
      addedPlanets.current.add(planet.pl_name);

      // Ensure orbits are spaced out with increased minimum distance
      const baseDistance = planet.pl_orbsmax ? planet.pl_orbsmax * 10 : 10;
      const semiMajorAxis = Math.max(baseDistance, starRadius * 2 + i * minOrbitGap);
      maxOrbitRadius = Math.max(maxOrbitRadius, semiMajorAxis);

      const planetRadius = 0.4 + Math.random() * 0.3;
      const planetTexture = generatePlanetTexture(planet);
      const planetMaterial = new THREE.MeshPhongMaterial({ 
        map: planetTexture,
        shininess: 30
      });
      const planetGeometry = new THREE.SphereGeometry(planetRadius, 32, 32);
      const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
      
      // Store reference to planet mesh
      planetMesh.userData = planet;
      planetMesh.userData.orbitRadius = semiMajorAxis;
      planetMesh.userData.initialAngle = i * 2 * Math.PI / planetarySystem.length;

      const angle = planetMesh.userData.initialAngle;
      planetMesh.position.set(
        semiMajorAxis * Math.cos(angle),
        0,
        semiMajorAxis * Math.sin(angle)
      );
      planetarySystemGroup.current.add(planetMesh);
      planetMeshes.push(planetMesh);

      // Add planet glow
      const planetGlowGeometry = new THREE.SphereGeometry(planetRadius * 1.3, 32, 32);
      const planetGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x88aaff,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending
      });
      const planetGlow = new THREE.Mesh(planetGlowGeometry, planetGlowMaterial);
      planetMesh.add(planetGlow);

      const planetLabel = createLabel(planet.pl_name, false);
      planetLabel.position.set(
        semiMajorAxis * Math.cos(angle),
        planetRadius + 0.8,
        semiMajorAxis * Math.sin(angle)
      );
      planetLabel.userData.planetMesh = planetMesh;
      planetarySystemGroup.current.add(planetLabel);
      planetLabels.push(planetLabel);

      const orbitLine = createOrbit(semiMajorAxis, orbitLineThickness, 0);
      planetarySystemGroup.current.add(orbitLine);
    });

    // Store references for animation
    planetMeshesRef.current = planetMeshes;
    planetLabelsRef.current = planetLabels;

    scene.add(planetarySystemGroup.current);

    // Add ambient and directional lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const starLight = new THREE.PointLight(0xffddaa, 2, 300);
    starLight.position.set(0, 0, 0);
    scene.add(starLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    scene.add(directionalLight);

    const fitCameraToSystem = (maxOrbitRadius) => {
      const distanceFactor = 2.5;
      camera.position.set(0, maxOrbitRadius * distanceFactor, maxOrbitRadius * distanceFactor);
      camera.lookAt(0, 0, 0);
      controls.update();
    };

    fitCameraToSystem(maxOrbitRadius);

    // Add raycasting for planet selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const onPlanetClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planetMeshes);
      
      if (intersects.length > 0) {
        const planet = intersects[0].object.userData;
        setSelectedPlanet(planet);
        setShowPlanetInfo(true);
      }
    };
    
    window.addEventListener('click', onPlanetClick);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate planets around the star
      const elapsedTime = clock.getElapsedTime();
      
      // Update planet positions
      planetMeshes.forEach((planet, i) => {
        const angle = elapsedTime * 0.1 + planet.userData.initialAngle;
        const orbitRadius = planet.userData.orbitRadius;
        planet.position.x = orbitRadius * Math.cos(angle);
        planet.position.z = orbitRadius * Math.sin(angle);
      });
      
      // Update label positions to follow their planets
      // and control visibility based on distance to camera
      if (cameraRef.current) {
        planetLabelsRef.current.forEach(label => {
          const planet = label.userData.planetMesh;
          label.position.copy(planet.position);
          label.position.y += planet.geometry.parameters.radius + 0.8;
          
          // Calculate distance to camera
          const distance = cameraRef.current.position.distanceTo(label.position);
          // Hide labels that are too far or too close
          label.visible = distance > 10 && distance < 100;
        });
      }
      
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('click', onPlanetClick);
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current && renderer.domElement.parentNode === sceneRef.current) {
        sceneRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [planetarySystem, starName]);

  const createOrbit = (semiMajorAxis, thickness, eccentricity) => {
    const points = [];
    const numPoints = 128;
  
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const x = semiMajorAxis * Math.cos(angle);
      const y = semiMajorAxis * Math.sin(angle);
      points.push(new THREE.Vector3(x, 0, y));
    }
  
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0x4fc3f7,
      linewidth: thickness,
      transparent: true,
      opacity: 0.5,
      depthTest: true,
      depthWrite: true
    });
    
  
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    orbitLine.renderOrder = 2;
    return orbitLine;
  };

  const createLabel = (text, isStar) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    // Reduced font sizes for better readability
    const fontSize = isStar ? 30 : 18;
    const padding = 10;
    
    context.font = `bold ${fontSize}px Arial`;
    const textWidth = context.measureText(text).width;
    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize + padding * 2;
    
    // Draw background
    context.fillStyle = 'rgba(12, 20, 69, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    context.strokeStyle = '#4fc3f7';
    context.lineWidth = 2;
    context.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.fillStyle = isStar ? '#ffcc44' : '#ffffff';
    context.font = `bold ${fontSize}px Arial`;
    context.fillText(text, padding, fontSize + padding/2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    // Adjusted scale to make labels smaller
    sprite.scale.set(canvas.width/100, canvas.height/100, 1);
    return sprite;
  };

  return (
    <Box sx={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#000000', // Pure black background
    }}>
      <div ref={sceneRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Back button */}
      <Box sx={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 100,
      }}>
        <StyledButton 
          onClick={() => window.location.reload()}
        >
          ← Back to Star Field
        </StyledButton>
      </Box>
      
      {/* Star name header */}
      <Box sx={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        zIndex: 100,
        background: 'rgba(12, 20, 69, 0.7)',
        borderRadius: '12px',
        padding: '8px 24px',
        border: '1px solid rgba(100, 150, 255, 0.3)',
        backdropFilter: 'blur(5px)',
      }}>
        <Typography variant="h5" sx={{ 
          color: '#ffcc44', 
          fontWeight: 'bold',
          textShadow: '0 0 10px rgba(255, 204, 68, 0.5)',
        }}>
          {starName} System
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#88aaff' }}>
          {planetarySystem.length} planets discovered
        </Typography>
      </Box>
      
      {/* Planet info panel */}
      {showPlanetInfo && selectedPlanet && (
        <PlanetInfoCard>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: '#4fc3f7' }}>
              {selectedPlanet.pl_name}
            </Typography>
            <IconButton onClick={() => setShowPlanetInfo(false)} sx={{ color: '#88aaff' }}>
              ✕
            </IconButton>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Mass:</strong> {selectedPlanet.pl_bmassj ? `${selectedPlanet.pl_bmassj} Jupiters` : 'Unknown'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Radius:</strong> {selectedPlanet.pl_radj ? `${selectedPlanet.pl_radj} Jupiters` : 'Unknown'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Orbital Period:</strong> {selectedPlanet.pl_orbper ? `${selectedPlanet.pl_orbper} days` : 'Unknown'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Discovery Year:</strong> {selectedPlanet.disc_year || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              <strong>Discovery Method:</strong> {selectedPlanet.discoverymethod || 'Unknown'}
            </Typography>
          </Box>
        </PlanetInfoCard>
      )}
    </Box>
  );
};

export default PlanetarySystem;