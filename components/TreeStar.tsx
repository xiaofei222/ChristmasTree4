import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { COLORS, CONFIG } from '../constants';

interface TreeStarProps {
  treeState: TreeState;
}

const TreeStar: React.FC<TreeStarProps> = ({ treeState }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  // We need to access material to animate emissive intensity
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // 1. Define Star Shape
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 1.2;
    const innerRadius = 0.5;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  // 2. Define Positions
  const positions = useMemo(() => {
    // Tree: Apex of the cone
    const treePos = new THREE.Vector3(0, CONFIG.treeHeight / 2 + 0.8, 0);
    
    // Scatter: Random high position
    const r = CONFIG.scatterRadius;
    const scatterPos = new THREE.Vector3(
      (Math.random() - 0.5) * r,
      (Math.random() * 0.5 + 0.5) * r, 
      (Math.random() - 0.5) * r
    );
    
    return { treePos, scatterPos };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const t = state.clock.elapsedTime;
    const isTree = treeState === TreeState.TREE_SHAPE;
    
    // Lerp progress stored in userData for simplicity
    const currentProgress = meshRef.current.userData.progress || 0;
    const target = isTree ? 1 : 0;
    const nextProgress = THREE.MathUtils.lerp(currentProgress, target, 0.025);
    meshRef.current.userData.progress = nextProgress;

    // Interpolate position
    meshRef.current.position.lerpVectors(
      positions.scatterPos,
      positions.treePos,
      nextProgress
    );

    // Subtle floating when scattered
    if (nextProgress < 0.9) {
      meshRef.current.position.y += Math.sin(t) * 0.05;
      meshRef.current.rotation.z += 0.01;
      meshRef.current.rotation.x += 0.01;
      if (materialRef.current) materialRef.current.emissiveIntensity = 0.8;
    } else {
      // Gentle twist when on tree
      meshRef.current.rotation.set(0, t * 0.5, 0);
      
      // Shimmer effect
      if (materialRef.current) {
        materialRef.current.emissiveIntensity = 1.0 + Math.sin(t * 3.0) * 0.4;
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <extrudeGeometry 
        args={[
          starShape, 
          { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 }
        ]} 
      />
      <meshStandardMaterial 
        ref={materialRef}
        color={COLORS.goldMetallic}
        emissive={COLORS.goldMetallic}
        emissiveIntensity={1.0}
        roughness={0.2}
        metalness={1.0}
      />
    </mesh>
  );
};

export default TreeStar;