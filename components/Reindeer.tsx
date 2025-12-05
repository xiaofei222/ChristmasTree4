
import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

interface ReindeerProps {
  treeState: TreeState;
  index: number;
  total: number;
  scatterPos: [number, number, number];
  scatterRot: [number, number, number];
}

// --- Shader for Glowing Particles ---
const particleVertexShader = `
  attribute float aSize;
  attribute float aRandom;
  varying float vAlpha;
  uniform float uTime;
  
  void main() {
    vAlpha = 0.6 + 0.4 * sin(uTime * 3.0 + aRandom * 10.0); // Shimmer
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // Adjusted size attenuation for denser clouds
    gl_PointSize = aSize * (120.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;
  
  void main() {
    // Soft circular particle
    float r = length(gl_PointCoord - vec2(0.5));
    if (r > 0.5) discard;
    
    // Sharp core, soft glow
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 2.0); 
    
    gl_FragColor = vec4(uColor, glow * vAlpha);
  }
`;

// --- Helper: Particle Cloud Mesh ---
const ParticleShape = ({ count, spread, color, sizeBase = 0.5 }: { count: number, spread: [number, number, number], color: string, sizeBase?: number }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const { positions, sizes, randoms } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const rnd = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
        // Gaussian-ish distribution to concentrate points in center of shape
        const r1 = Math.random() - 0.5 + (Math.random() - 0.5);
        const r2 = Math.random() - 0.5 + (Math.random() - 0.5);
        const r3 = Math.random() - 0.5 + (Math.random() - 0.5);

        pos[i*3] = r1 * spread[0];
        pos[i*3+1] = r2 * spread[1];
        pos[i*3+2] = r3 * spread[2];
        
        sz[i] = sizeBase * (0.6 + Math.random() * 0.8);
        rnd[i] = Math.random();
    }
    return { positions: pos, sizes: sz, randoms: rnd };
  }, [count, spread, sizeBase]);

  useFrame((state) => {
    if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) }
  }), [color]);

  return (
    <points>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
            <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial 
            ref={materialRef}
            vertexShader={particleVertexShader}
            fragmentShader={particleFragmentShader}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
        />
    </points>
  );
};

// --- Helper: Dense Antler Generator ---
const AntlerParticles = () => {
   const count = 800; // Much denser
   const materialRef = useRef<THREE.ShaderMaterial>(null);

   const { positions, sizes, randoms } = useMemo(() => {
     const pos = [];
     const sz = [];
     const rnd = [];
     
     const addCluster = (x:number, y:number, z:number, r:number, c:number) => {
        for(let i=0; i<c; i++) {
            pos.push(x + (Math.random()-0.5)*r, y + (Math.random()-0.5)*r, z + (Math.random()-0.5)*r);
            sz.push(0.35); // Fine detail
            rnd.push(Math.random());
        }
     };

     // Left Antler
     for(let i=0; i<20; i++) {
        // Main beam curves out and up
        const t = i/20;
        const x = -0.2 - t * 0.5;
        const y = t * 0.8;
        const z = t * 0.2;
        addCluster(x, y, z, 0.08, 15);
        
        // Tines
        if(i === 8) {
            // Forward tine
             for(let k=0; k<5; k++) addCluster(x, y + k*0.1, z + k*0.1 + 0.1, 0.06, 10);
        }
        if(i === 15) {
            // Upward tine
             for(let k=0; k<5; k++) addCluster(x - k*0.05, y + k*0.15, z, 0.06, 10);
        }
     }

     // Right Antler
     for(let i=0; i<20; i++) {
        const t = i/20;
        const x = 0.2 + t * 0.5;
        const y = t * 0.8;
        const z = t * 0.2;
        addCluster(x, y, z, 0.08, 15);
        
        if(i === 8) for(let k=0; k<5; k++) addCluster(x, y + k*0.1, z + k*0.1 + 0.1, 0.06, 10);
        if(i === 15) for(let k=0; k<5; k++) addCluster(x + k*0.05, y + k*0.15, z, 0.06, 10);
     }

     const finalPos = new Float32Array(pos);
     const finalSz = new Float32Array(sz);
     const finalRnd = new Float32Array(rnd);
     
     return { positions: finalPos, sizes: finalSz, randoms: finalRnd };
   }, []);

   useFrame((state) => {
     if (materialRef.current) materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
   });

   return (
    <points>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={positions.length/3} array={positions} itemSize={3} />
            <bufferAttribute attach="attributes-aSize" count={sizes.length} array={sizes} itemSize={1} />
            <bufferAttribute attach="attributes-aRandom" count={randoms.length} array={randoms} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial 
            ref={materialRef}
            vertexShader={particleVertexShader}
            fragmentShader={particleFragmentShader}
            uniforms={{ uTime: { value: 0 }, uColor: { value: new THREE.Color('#F0E68C') } }} // Khaki/Gold antlers
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
        />
    </points>
   );
}


const Reindeer: React.FC<ReindeerProps> = ({ treeState, index, total, scatterPos, scatterRot }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const neckRef = useRef<THREE.Group>(null);
  const FLRef = useRef<THREE.Group>(null);
  const FRRef = useRef<THREE.Group>(null);
  const BLRef = useRef<THREE.Group>(null);
  const BRRef = useRef<THREE.Group>(null);

  // Constants
  const ORBIT_RADIUS = 9.0;
  const WALK_SPEED = 0.6;
  const Y_LEVEL = -6.0;

  // Stable objects
  const vec = useMemo(() => new THREE.Vector3(), []);
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const scatterPosVec = useMemo(() => new THREE.Vector3(...scatterPos), [scatterPos]);
  const scatterRotEuler = useMemo(() => new THREE.Euler(...scatterRot), [scatterRot]);
  const scatterRotQuat = useMemo(() => new THREE.Quaternion().setFromEuler(scatterRotEuler), [scatterRotEuler]);

  const progressRef = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    
    // 1. State Lerp
    const targetProgress = treeState === TreeState.TREE_SHAPE ? 1 : 0;
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, targetProgress, 0.02);
    const p = progressRef.current; 

    // 2. Orbit Calculation (Clockwise)
    const angleOffset = (index / total) * Math.PI * 2;
    const currentAngle = angleOffset - t * WALK_SPEED; 

    const orbitX = Math.cos(currentAngle) * ORBIT_RADIUS;
    const orbitZ = Math.sin(currentAngle) * ORBIT_RADIUS;

    targetPos.lerpVectors(scatterPosVec, vec.set(orbitX, Y_LEVEL, orbitZ), p);
    groupRef.current.position.copy(targetPos);

    // 3. Rotation
    if (p > 0.5) {
      // Facing Tangent for Clockwise
      const lookX = orbitX + Math.sin(currentAngle);
      const lookZ = orbitZ - Math.cos(currentAngle);
      groupRef.current.lookAt(lookX, Y_LEVEL, lookZ);
    } else {
      groupRef.current.quaternion.slerp(scatterRotQuat, 0.05);
    }

    // 4. Animation
    const walkCycle = t * 10; // Faster trot
    const legAmp = 0.4 * p;

    if (FLRef.current) FLRef.current.rotation.x = Math.sin(walkCycle) * legAmp;
    if (FRRef.current) FRRef.current.rotation.x = Math.cos(walkCycle) * legAmp;
    if (BLRef.current) BLRef.current.rotation.x = Math.cos(walkCycle) * legAmp;
    if (BRRef.current) BRRef.current.rotation.x = Math.sin(walkCycle) * legAmp;

    if (headRef.current) {
        headRef.current.position.y = 1.0 + Math.abs(Math.sin(walkCycle)) * 0.05 * p;
        headRef.current.rotation.z = Math.sin(t * 0.5) * 0.05;
    }
    if (neckRef.current) {
        neckRef.current.position.y = 0.7 + Math.abs(Math.sin(walkCycle)) * 0.03 * p;
    }
  });

  const bodyColor = "#FFD700"; // Gold
  const noseColor = "#FF0000"; // Red

  // High density particle counts
  return (
    <group ref={groupRef}>
      {/* Main Body - Dense Oval */}
      <group position={[0, 0.6, 0]}>
         <ParticleShape count={2000} spread={[0.7, 0.6, 1.2]} color={bodyColor} sizeBase={0.35} />
      </group>

      {/* Neck - Connecting Body to Head */}
      <group ref={neckRef} position={[0, 0.9, 0.7]} rotation={[0.5, 0, 0]}>
         <ParticleShape count={600} spread={[0.4, 0.6, 0.4]} color={bodyColor} sizeBase={0.35} />
      </group>

      {/* Head Group */}
      <group ref={headRef} position={[0, 1.3, 0.9]}>
         {/* Cranium */}
         <ParticleShape count={800} spread={[0.5, 0.55, 0.6]} color={bodyColor} sizeBase={0.35} />
         
         {/* Snout */}
         <group position={[0, -0.15, 0.35]}>
            <ParticleShape count={400} spread={[0.3, 0.25, 0.4]} color={bodyColor} sizeBase={0.3} />
         </group>

         {/* Nose */}
         <group position={[0, -0.1, 0.6]}>
            <ParticleShape count={80} spread={[0.12, 0.12, 0.12]} color={noseColor} sizeBase={0.6} />
         </group>

         {/* Antlers */}
         <group position={[0, 0.35, 0]}>
            <AntlerParticles />
         </group>
      </group>

      {/* Legs - Thinner and denser */}
      <group ref={FLRef} position={[-0.25, 0.5, 0.4]}>
         <group position={[0, -0.5, 0]}>
             {/* Upper Leg */}
             <ParticleShape count={500} spread={[0.18, 0.9, 0.18]} color={bodyColor} sizeBase={0.3} />
         </group>
      </group>

      <group ref={FRRef} position={[0.25, 0.5, 0.4]}>
         <group position={[0, -0.5, 0]}>
             <ParticleShape count={500} spread={[0.18, 0.9, 0.18]} color={bodyColor} sizeBase={0.3} />
         </group>
      </group>

      <group ref={BLRef} position={[-0.25, 0.5, -0.4]}>
         <group position={[0, -0.5, 0]}>
             <ParticleShape count={500} spread={[0.18, 0.9, 0.18]} color={bodyColor} sizeBase={0.3} />
         </group>
      </group>

      <group ref={BRRef} position={[0.25, 0.5, -0.4]}>
         <group position={[0, -0.5, 0]}>
             <ParticleShape count={500} spread={[0.18, 0.9, 0.18]} color={bodyColor} sizeBase={0.3} />
         </group>
      </group>
      
      {/* Tail */}
      <group position={[0, 0.8, -0.6]} rotation={[0.5, 0, 0]}>
         <ParticleShape count={200} spread={[0.2, 0.3, 0.2]} color={bodyColor} sizeBase={0.3} />
      </group>
    </group>
  );
};

export default Reindeer;
