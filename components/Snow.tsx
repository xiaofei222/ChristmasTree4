
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  attribute float aSize;
  attribute float aSpeed;
  
  void main() {
    vec3 pos = position;
    
    // Falling Logic
    // Box height 50 (-20 to +30)
    float fallSpeed = aSpeed * 2.0; 
    float fallDist = uTime * fallSpeed;
    
    // Wrap Y
    // Initial range is roughly -20 to 30
    float height = 50.0;
    float bottom = -20.0;
    
    // We offset the initial Y by fallDist, then wrap
    // Standard wrap: mod(value - min, range) + min
    pos.y = mod(pos.y - fallDist - bottom, height) + bottom;
    
    // Sway
    float swayFreq = 0.5 + aSpeed;
    float swayAmp = 0.5;
    pos.x += sin(uTime * swayFreq + pos.y * 0.1) * swayAmp;
    pos.z += cos(uTime * swayFreq + pos.x * 0.1) * swayAmp;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (30.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  void main() {
    // Soft circle
    vec2 coord = gl_PointCoord - vec2(0.5);
    float r = length(coord) * 2.0;
    if (r > 1.0) discard;
    
    // Radial gradient for softness
    float a = 1.0 - pow(r, 2.0);
    
    gl_FragColor = vec4(1.0, 1.0, 1.0, a * 0.6); 
  }
`;

const Snow: React.FC = () => {
  const count = 3000;
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread wide area
      positions[i * 3] = (Math.random() - 0.5) * 60;     // X
      positions[i * 3 + 1] = (Math.random() - 0.4) * 50; // Y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60; // Z

      sizes[i] = 1.0 + Math.random() * 3.0;
      speeds[i] = 1.0 + Math.random();
    }
    return { positions, sizes, speeds };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={count}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSpeed"
          count={count}
          array={speeds}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Snow;
