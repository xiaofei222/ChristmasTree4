
import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, COLORS } from '../constants';
import { TreeState } from '../types';

interface LightStripProps {
  treeState: TreeState;
}

const LightStrip: React.FC<LightStripProps> = ({ treeState }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const count = 1200; 

  // Generate Data
  const { treePos, scatterPos } = useMemo(() => {
    const tPos = new Float32Array(count * 3);
    const sPos = new Float32Array(count * 3);
    
    // Spiral Logic
    const turns = 7;
    const h = CONFIG.treeHeight + 2; 
    // Increased radius to wrap OUTSIDE the ornaments (Tree Radius is ~4.5 + ornaments ~0.5)
    const rBase = CONFIG.treeRadius + 1.2; 

    for (let i = 0; i < count; i++) {
        const pct = i / count;
        
        // Tree: Spiral
        const angle = pct * Math.PI * 2 * turns;
        const y = (pct - 0.5) * h;
        // Cone tapering
        const r = rBase * (1 - pct);
        
        tPos[i*3] = Math.cos(angle) * r;
        tPos[i*3+1] = y;
        tPos[i*3+2] = Math.sin(angle) * r;

        // Scatter: Random cloud
        const sr = CONFIG.scatterRadius;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        sPos[i*3] = sr * Math.sin(phi) * Math.cos(theta);
        sPos[i*3+1] = sr * Math.sin(phi) * Math.sin(theta);
        sPos[i*3+2] = sr * Math.cos(phi);
    }
    return { treePos: tPos, scatterPos: sPos };
  }, []);

  const progressRef = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;

    const target = treeState === TreeState.TREE_SHAPE ? 1 : 0;
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, 0.04);
    
    const p = progressRef.current;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
        // Interpolate position
        const tx = treePos[i*3];
        const ty = treePos[i*3+1];
        const tz = treePos[i*3+2];
        
        const sx = scatterPos[i*3];
        const sy = scatterPos[i*3+1];
        const sz = scatterPos[i*3+2];

        const x = THREE.MathUtils.lerp(sx, tx, p);
        const y = THREE.MathUtils.lerp(sy, ty, p);
        const z = THREE.MathUtils.lerp(sz, tz, p);

        // Add some life/wiggle
        const wiggle = Math.sin(time * 3 + i * 0.1) * 0.05 * p;

        tempObject.position.set(x + wiggle, y + wiggle, z + wiggle);
        
        const scale = 0.08 * (0.5 + 0.5 * p); 
        tempObject.scale.set(scale, scale, scale);
        
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial 
        color={COLORS.lightStrip}
        emissive={COLORS.lightStrip}
        emissiveIntensity={3.0} // High glow
        toneMapped={false}
      />
    </instancedMesh>
  );
};

export default LightStrip;
