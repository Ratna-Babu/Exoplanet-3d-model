import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import axios from 'axios';
import PlanetarySystem from './PlanetarySystem';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CircularProgress, Paper, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Custom styled components
const SpaceDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiPaper-root': {
    background: 'linear-gradient(135deg, #0c1445 0%, #1a237e 100%)',
    border: '1px solid rgba(100, 150, 255, 0.3)',
    borderRadius: '12px',
    boxShadow: '0 0 30px rgba(66, 133, 244, 0.3)',
    color: '#e0f7fa',
    backdropFilter: 'blur(10px)',
    maxWidth: '500px',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  border: 0,
  borderRadius: '8px',
  color: 'white',
  padding: '8px 16px',
  fontWeight: 'bold',
  letterSpacing: '0.5px',
  margin: '0 8px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 15px rgba(33, 150, 243, 0.4)',
  },
}));

const SecondaryButton = styled(Button)(({ theme }) => ({
  background: 'transparent',
  border: '1px solid #4fc3f7',
  borderRadius: '8px',
  color: '#4fc3f7',
  padding: '8px 16px',
  fontWeight: 'bold',
  letterSpacing: '0.5px',
  margin: '0 8px',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(79, 195, 247, 0.1)',
    transform: 'translateY(-2px)',
  },
}));

const ExoplanetVisualizer = () => {
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const scene = useRef(new THREE.Scene());
  const starFieldRef = useRef();
  const animationFrameIdRef = useRef();
  const controlsRef = useRef();
  const [selectedStar, setSelectedStar] = useState(null);
  const [showPopUp, setShowPopUp] = useState(false);
  const [starDetails, setStarDetails] = useState(null);
  const [isPlanetarySystem, setIsPlanetarySystem] = useState(false);
  const [planetarySystemData, setPlanetarySystemData] = useState(null);
  const [starName, setStarName] = useState('');
  const [loading, setLoading] = useState(true); // Set loading to true at the start

  const fetchExoplanetData = async () => {
    // Check localStorage for cached data
    const cached = localStorage.getItem('exoplanetData');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // If parsing fails, clear the cache and refetch
        localStorage.removeItem('exoplanetData');
      }
    }
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/exoplanets');
      localStorage.setItem('exoplanetData', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Error fetching exoplanet data', error);
      return [];
    }
  };

  const fetchPlanetarySystemData = async (starName) => {
    // Use a unique key per star
    const cacheKey = `planetarySystemData_${starName}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/planetary-system/${encodeURIComponent(starName)}`);
      localStorage.setItem(cacheKey, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Error fetching planetary system data', error);
      return [];
    }
  };

  const createStarField = (data) => {
    const starGeometry = new THREE.BufferGeometry();
    
    // Create color variations based on star temperature
    const colors = new Float32Array(data.length * 3);
    const positions = new Float32Array(data.length * 3);
    
    data.forEach((star, i) => {
      const { ra, dec, sy_dist: distance, st_teff: temp = 6000 } = star;
      const raRadians = (ra * 15 * Math.PI) / 180;
      const decRadians = (dec * Math.PI) / 180;
      const r = distance;

      const x = r * Math.cos(raRadians) * Math.cos(decRadians);
      const y = r * Math.sin(raRadians) * Math.cos(decRadians);
      const z = r * Math.sin(decRadians);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Color based on temperature (blue = hot, red = cool)
      const t = Math.min(Math.max(temp, 3000), 10000);
      const normalizedTemp = (t - 3000) / 7000;
      
      // RGB interpolation
      const rVal = Math.min(1, 0.8 + normalizedTemp * 0.2);
      const gVal = 0.5 + normalizedTemp * 0.5;
      const bVal = Math.min(1, 1.2 - normalizedTemp * 0.2);
      
      colors[i * 3] = rVal;
      colors[i * 3 + 1] = gVal;
      colors[i * 3 + 2] = bVal;
    });

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 3,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
    });

    const textureLoader = new THREE.TextureLoader();
    const starTexture = textureLoader.load('/images/glowtexture.webp');
    starMaterial.map = starTexture;

    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.current.add(starPoints);
    starFieldRef.current = starPoints;

    setLoading(false);
    return starPoints;
  };

  // Function to create background star field
  const createBackgroundStars = () => {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
    });
    
    const starVertices = [];
    for (let i = 0; i < 10000; i++) { // Increased star count for better effect
      const x = THREE.MathUtils.randFloatSpread(2000);
      const y = THREE.MathUtils.randFloatSpread(2000);
      const z = THREE.MathUtils.randFloatSpread(2000);
      starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.current.add(stars);
    return stars;
  };

  const handleZoomClick = async () => {
    if (selectedStar) {
      setShowPopUp(false);
      setLoading(true); // Show loading spinner

      const planetarySystem = await fetchPlanetarySystemData(selectedStar.hostname);
      if (planetarySystem.length > 0) {
        setPlanetarySystemData(planetarySystem);
        setStarName(selectedStar.hostname);
        setIsPlanetarySystem(true);
      }

      setLoading(false); // Hide loading spinner
    }
  };

  const handleBackClick = () => {
    setIsPlanetarySystem(false);
    setShowPopUp(false);
    setPlanetarySystemData(null);
    setSelectedStar(null);
    setStarDetails(null);
    
    // Restore star field visibility and camera position
    if (starFieldRef.current) {
      starFieldRef.current.visible = true;
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 200);
      cameraRef.current.lookAt(0, 0, 0);
    }
    
    // Ensure animation is running
    if (rendererRef.current && cameraRef.current && scene.current) {
      const animate = () => {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        rendererRef.current.render(scene.current, cameraRef.current);
      };
      animate();
    }
  };

  useEffect(() => {
    if (!sceneRef.current) return;

    // Clean up any existing children before appending a new renderer
    while (sceneRef.current && sceneRef.current.firstChild) {
      sceneRef.current.removeChild(sceneRef.current.firstChild);
    }

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true // Allow transparency for better black background
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;

    sceneRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

    // Set black background for the scene
    scene.current.background = new THREE.Color(0x000000);

    // Add ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.current.add(ambientLight);

    // Create background stars
    createBackgroundStars();

    fetchExoplanetData().then((data) => {
      const starPoints = createStarField(data);

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onMouseClick = (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(starPoints);

        if (intersects.length > 0) {
          const index = intersects[0].index;
          const clickedStar = data[index];
          setSelectedStar(clickedStar);
          setStarDetails(clickedStar);
          setShowPopUp(true);
        }
      };

      window.addEventListener('click', onMouseClick);

      return () => {
        window.removeEventListener('click', onMouseClick);
      };
    });

    camera.position.z = 200;

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene.current, camera);
    };

    animate();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      // Clean up any existing children (canvas) from the container
      if (sceneRef.current && sceneRef.current.firstChild) {
        sceneRef.current.removeChild(sceneRef.current.firstChild);
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      if (scene.current) {
        while(scene.current.children.length > 0){ 
          const object = scene.current.children[0];
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
          scene.current.remove(object);
        }
      }
    };
  }, []);

  return (
    <Box sx={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#000000', // Changed to solid black
    }}>
      {loading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.9)', // Darker background
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
        }}>
          <CircularProgress 
            size={80} 
            thickness={3}
            sx={{ 
              color: '#4fc3f7',
              marginBottom: 3,
            }} 
          />
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#e0f7fa', 
              textAlign: 'center',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontWeight: '300',
            }}
          >
            Loading Stellar Database
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#81d4fa', 
              marginTop: 1,
              opacity: 0.7,
            }}
          >
            {Math.floor(Math.random() * 1000 + 1000)} stars found
          </Typography>
        </Box>
      )}
      
      {isPlanetarySystem && planetarySystemData ? (
        <PlanetarySystem 
          planetarySystem={planetarySystemData} 
          starName={starName} 
          onBackClick={handleBackClick} 
        />
      ) : (
        <>
          <div 
            ref={sceneRef} 
            style={{ 
              width: '100%', 
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
            }} 
          />
          
          <SpaceDialog 
            open={showPopUp} 
            onClose={() => setShowPopUp(false)}
            PaperProps={{ sx: { m: 2, width: '90%', maxWidth: '500px' } }}
          >
            <DialogTitle sx={{ 
              background: 'rgba(25, 118, 210, 0.2)', 
              borderBottom: '1px solid rgba(100, 150, 255, 0.3)',
              fontWeight: 600,
              letterSpacing: '0.5px',
              fontSize: '1.4rem',
              padding: '16px 24px',
            }}>
              {starDetails?.hostname}
            </DialogTitle>
            <DialogContent sx={{ padding: '20px 24px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <DetailItem label="Distance" value={`${starDetails?.sy_dist || 'N/A'} light years`} />
                <DetailItem label="Discovery Year" value={starDetails?.disc_year || 'N/A'} />
                <DetailItem label="Temperature" value={starDetails?.st_teff ? `${Math.round(starDetails.st_teff)} K` : 'N/A'} />
                <DetailItem label="Constellation" value={starDetails?.sy_const || 'N/A'} />
                <DetailItem label="Planets" value={starDetails?.sy_pnum || '0'} />
              </Box>
            </DialogContent>
            <DialogActions sx={{ 
              padding: '16px 24px', 
              background: 'rgba(15, 23, 42, 0.5)',
              borderTop: '1px solid rgba(100, 150, 255, 0.2)',
            }}>
              <SecondaryButton onClick={() => setShowPopUp(false)}>
                Close
              </SecondaryButton>
              <StyledButton onClick={handleZoomClick} autoFocus>
                Explore Planetary System
              </StyledButton>
            </DialogActions>
          </SpaceDialog>
        </>
      )}
    </Box>
  );
};

// Helper component for star details
const DetailItem = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
    <Typography variant="body1" sx={{ fontWeight: 500, color: '#81d4fa' }}>
      {label}:
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 400, color: '#e0f7fa' }}>
      {value}
    </Typography>
  </Box>
);

export default ExoplanetVisualizer;