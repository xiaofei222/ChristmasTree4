

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, COLORS } from '../constants';
import { TreeState } from '../types';

const vertexShader = `
  uniform float uTime;
  uniform float uProgress; // 0.0 for Scattered, 1.0 for Tree
  
  attribute vec3 aTreePos;
  attribute vec3 aScatterPos;
  attribute float aRandom;
  
  varying float vRandom;

  float easeOutCubic(float x) {
    return 1.0 - pow(1.0 - x, 3.0);
  }

  void main() {
    vRandom = aRandom;

    float t = easeOutCubic(uProgress);
    
    vec3 pos = mix(aScatterPos, aTreePos, t);

    float breathe = sin(uTime * 2.0 + aRandom * 10.0) * 0.15;
    pos += normalize(pos) * breathe * (1.0 - t * 0.2); 

    if (t > 0.1 && t < 0.9) {
       float angle = (1.0 - t) * 3.14 * 2.0 * (aRandom - 0.5);
       float s = sin(angle);
       float c = cos(angle);
       float x = pos.x;
       float z = pos.z;
       pos.x = x * c - z * s;
       pos.z = x * s + z * c;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation
    float size = (120.0 * aRandom + 80.0);
    gl_PointSize = size * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorBright;
  
  varying float vRandom;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;

    float glow = 1.0 - (dist * 2.0);
    glow = pow(glow, 1.5); // Softer falloff for more glow area

    vec3 color;
    
    if (vRandom < 0.4) {
      color = mix(uColorDeep, uColorMid, vRandom * 2.5);
    } else if (vRandom < 0.8) {
      color = mix(uColorMid, uColorBright, (vRandom - 0.4) * 2.5);
    } else {
      color = mix(uColorBright, vec3(0.8, 1.0, 0.5), (vRandom - 0.8) * 5.0); 
    }

    // Boost brightness significantly for "magical" feel
    vec3 finalColor = color + (uColorBright * glow * 1.5); 
    
    // Output high values for bloom
    gl_FragColor = vec4(finalColor * 2.5, glow); 
  }
`;

interface FoliageProps {
  treeState: TreeState;
}

const Foliage: React.FC<FoliageProps> = ({ treeState }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const targetProgress = treeState === TreeState.TREE_SHAPE ? 1.0 : 0.0;
  
  const { positions, treePositions, scatterPositions, randoms } = useMemo(() => {
    const count = CONFIG.foliageCount;
    const positions = new Float32Array(count * 3);
    const treePositions = new Float32Array(count * 3);
    const scatterPositions = new Float32Array(count * 3);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const h = CONFIG.treeHeight;
      const rBase = CONFIG.treeRadius;
      
      const rDist = Math.sqrt(Math.random()); 
      const y = (0.5 - rDist) * h; 
      
      const rCurrent = rDist * rBase;
      const angle = Math.random() * Math.PI * 2;
      
      const rVolume = rCurrent * (0.3 + 0.7 * Math.sqrt(Math.random()));

      treePositions[i * 3] = rVolume * Math.cos(angle);
      treePositions[i * 3 + 1] = y;
      treePositions[i * 3 + 2] = rVolume * Math.sin(angle);

      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const radiusScatter = CONFIG.scatterRadius * (0.5 + Math.random() * 0.5);
      
      scatterPositions[i * 3] = radiusScatter * Math.sin(phi) * Math.cos(theta);
      scatterPositions[i * 3 + 1] = radiusScatter * Math.sin(phi) * Math.sin(theta);
      scatterPositions[i * 3 + 2] = radiusScatter * Math.cos(phi);

      positions[i * 3] = scatterPositions[i * 3];
      positions[i * 3 + 1] = scatterPositions[i * 3 + 1];
      positions[i * 3 + 2] = scatterPositions[i * 3 + 2];

      randoms[i] = Math.random();
    }
    
    return { positions, treePositions, scatterPositions, randoms };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uProgress.value,
        targetProgress,
        0.03
      );
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    // Warmer Green Palette
    uColorDeep: { value: new THREE.Color("#1a2e05") },   
    uColorMid: { value: new THREE.Color("#4a6b0a") },    
    uColorBright: { value: new THREE.Color("#8bc34a") }, 
  }), []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={treePositions.length / 3}
          array={treePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScatterPos"
          count={scatterPositions.length / 3}
          array={scatterPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent={true}
      />
    </points>
  );
};

export default Foliage;