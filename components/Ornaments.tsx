
import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, ORNAMENT_COLORS } from '../constants';
import { TreeState, DualPosition } from '../types';

interface OrnamentsProps {
  treeState: TreeState;
}

// --- Texture Generators ---

const createGiftTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 1. Fill background - Use white so instance color tints it fully
    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0, 0, 256, 256);

    // 2. Subtle Warm Grain
    for(let i=0; i<300; i++) {
        ctx.fillStyle = `rgba(255,200,100,${Math.random() * 0.1})`; 
        ctx.fillRect(Math.random()*256, Math.random()*256, 2, 2);
    }

    // 3. Ribbon - Bright Gold
    const ribbonW = 30;
    const center = 128;
    
    // Metallic Gradient for Ribbon
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#fffbe6'); 
    grad.addColorStop(0.5, '#fdd835'); // Brighter Gold
    grad.addColorStop(1, '#fffbe6');
    
    ctx.fillStyle = grad;
    
    // Cross Pattern
    ctx.fillRect(center - ribbonW/2, 0, ribbonW, 256);
    ctx.fillRect(0, center - ribbonW/2, 256, ribbonW);
    
    // Borders
    ctx.strokeStyle = '#f9a825'; 
    ctx.lineWidth = 1;
    ctx.strokeRect(center - ribbonW/2, 0, ribbonW, 256);
    ctx.strokeRect(0, center - ribbonW/2, 256, ribbonW);
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
};

// --- Data Generation ---

const generateData = (totalCount: number) => {
  const counts = {
    box: Math.floor(totalCount * 0.3),
    sphere: Math.floor(totalCount * 0.7),
  };

  const allData: DualPosition[] = [];
  const types = ['box', 'sphere'] as const;

  types.forEach(type => {
    const count = counts[type];
    for (let i = 0; i < count; i++) {
      // Tree Distribution
      const h = CONFIG.treeHeight;
      const rBase = CONFIG.treeRadius;
      
      const rDist = Math.sqrt(Math.random());
      const y = (0.5 - rDist) * h;
      const rCurrent = rDist * rBase;
      const angle = Math.random() * Math.PI * 2;
      
      let pushout = 0;
      if (type === 'box') pushout = -0.2 + Math.random() * 0.4; // Buried slightly
      else if (type === 'sphere') pushout = 0.5 + Math.random() * 0.5; // On tips

      const rFinal = Math.max(0, rCurrent + pushout);
      const tx = rFinal * Math.cos(angle);
      const tz = rFinal * Math.sin(angle);
      
      allData.push(createItem(tx, y, tz, type));
    }
  });

  return allData;
};

const createItem = (tx: number, ty: number, tz: number, type: 'box' | 'sphere'): DualPosition => {
  // Scatter Position
  const sr = CONFIG.scatterRadius * 0.9;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const sx = sr * Math.sin(phi) * Math.cos(theta);
  const sy = sr * Math.sin(phi) * Math.sin(theta);
  const sz = sr * Math.cos(phi);

  let scale: [number, number, number] = [1, 1, 1];
  let color = '#ffffff';

  if (type === 'box') {
    const s = 0.6 + Math.random() * 0.5;
    scale = [s, s, s];
    color = ORNAMENT_COLORS.gifts[Math.floor(Math.random() * ORNAMENT_COLORS.gifts.length)];
  } else if (type === 'sphere') {
    const s = 0.25 + Math.random() * 0.15; // Slightly larger for visibility
    scale = [s, s, s];
    color = ORNAMENT_COLORS.baubles[Math.floor(Math.random() * ORNAMENT_COLORS.baubles.length)];
  }

  const rot: [number, number, number] = [
    Math.random() * Math.PI, 
    Math.random() * Math.PI, 
    Math.random() * Math.PI
  ];

  return {
    tree: [tx, ty, tz],
    scatter: [sx, sy, sz],
    rotation: rot,
    scale,
    type,
    color
  };
}

// --- Group Component ---

const OrnamentGroup = ({ 
  data, 
  geometry, 
  material, 
  progress, 
  t 
}: { 
  data: DualPosition[], 
  geometry: THREE.BufferGeometry, 
  material: THREE.Material, 
  progress: number, 
  t: number 
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const temp = useMemo(() => new THREE.Object3D(), []);

  // Set colors
  useLayoutEffect(() => {
    if (meshRef.current) {
      data.forEach((d, i) => {
        const c = new THREE.Color(d.color);
        meshRef.current!.setColorAt(i, c);
      });
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [data]);

  useFrame(() => {
    if (!meshRef.current) return;
    
    data.forEach((d, i) => {
      const { tree, scatter, rotation, scale, type } = d;
      
      const x = THREE.MathUtils.lerp(scatter[0], tree[0], progress);
      const y = THREE.MathUtils.lerp(scatter[1], tree[1], progress);
      const z = THREE.MathUtils.lerp(scatter[2], tree[2], progress);
      
      const floatAmp = (1 - progress) * 0.5;
      const ny = y + Math.sin(t + i * 0.5) * floatAmp;

      temp.position.set(x, ny, z);
      
      let targetRX = rotation[0];
      let targetRY = rotation[1]; 
      let targetRZ = rotation[2];

      if (progress > 0.5) {
         if (type === 'box') {
            targetRX = 0; 
            targetRZ = 0; 
         }
      }
      
      const currRX = THREE.MathUtils.lerp(rotation[0] + t*0.2*(1-progress), targetRX, progress);
      const currRY = THREE.MathUtils.lerp(rotation[1] + t*0.3, targetRY, progress);
      const currRZ = THREE.MathUtils.lerp(rotation[2] + t*0.2*(1-progress), targetRZ, progress);

      temp.rotation.set(currRX, currRY, currRZ);
      temp.scale.set(scale[0], scale[1], scale[2]);
      temp.updateMatrix();
      meshRef.current!.setMatrixAt(i, temp.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, data.length]}
      castShadow
      receiveShadow
    />
  );
};

// --- Main Export ---

const Ornaments: React.FC<OrnamentsProps> = ({ treeState }) => {
  const data = useMemo(() => generateData(CONFIG.ornamentCount), []);
  const groups = useMemo(() => ({
    box: data.filter(d => d.type === 'box'),
    sphere: data.filter(d => d.type === 'sphere'),
  }), [data]);

  // --- Materials ---

  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const boxMat = useMemo(() => {
    const tex = createGiftTexture();
    return new THREE.MeshStandardMaterial({ 
      map: tex,
      roughness: 0.2, 
      metalness: 0.1,
      envMapIntensity: 2.0, // Make ribbons pop
    });
  }, []);

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);
  
  // Custom Material for Baubles to allow colored glow
  const sphereMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.1,
      metalness: 0.9,
      envMapIntensity: 1.5,
    });
    
    // Inject logic to use instance color as emissive color
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        // Boost emissive by instance color
        totalEmissiveRadiance += vColor * 1.5; 
        `
      );
    };
    return mat;
  }, []);

  const progressRef = useRef(0);
  useFrame((state) => {
    const target = treeState === TreeState.TREE_SHAPE ? 1 : 0;
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, 0.03);
  });

  const [t, setT] = React.useState(0);
  useFrame((state) => setT(state.clock.elapsedTime));

  return (
    <group>
      <OrnamentGroup data={groups.box} geometry={boxGeo} material={boxMat} progress={progressRef.current} t={t} />
      <OrnamentGroup data={groups.sphere} geometry={sphereGeo} material={sphereMat} progress={progressRef.current} t={t} />
    </group>
  );
};

export default Ornaments;
