
import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import Foliage from './components/Foliage';
import Ornaments from './components/Ornaments';
import TreeStar from './components/TreeStar';
import LightStrip from './components/LightStrip';
import Snow from './components/Snow';
import Overlay from './components/Overlay';
import ReindeerRing from './components/ReindeerRing';
import { TreeState } from './types';
import { COLORS } from './constants';

const Scene: React.FC<{ treeState: TreeState }> = ({ treeState }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={35} />
      <OrbitControls 
        enablePan={false} 
        minDistance={10} 
        maxDistance={40} 
        autoRotate={treeState === TreeState.TREE_SHAPE} 
        autoRotateSpeed={0.5}
      />

      {/* Lighting System for Warmth */}
      <ambientLight intensity={0.4} color="#554433" /> {/* Warm ambient */}
      
      {/* Main Warm Glow */}
      <pointLight position={[10, 10, 15]} intensity={1.5} color="#ffaa00" distance={60} decay={2} />
      
      {/* Backlight / Rim light */}
      <pointLight position={[-10, 5, -10]} intensity={1.0} color="#ff6600" distance={50} decay={2} />
      
      {/* Top Highlight */}
      <spotLight 
        position={[0, 25, 5]} 
        angle={0.4} 
        penumbra={1} 
        intensity={2.5} 
        color="#fff0d0" 
        castShadow 
      />

      {/* Environment for warm reflections */}
      <Environment preset="sunset" />

      {/* Objects */}
      <group position={[0, -2, 0]}>
        <TreeStar treeState={treeState} />
        <Foliage treeState={treeState} />
        <Ornaments treeState={treeState} />
        <LightStrip treeState={treeState} />
        <ReindeerRing treeState={treeState} />
        <Snow />
      </group>

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.5} 
          mipmapBlur 
          intensity={1.0} 
          radius={0.5}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </>
  );
};

function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.TREE_SHAPE);

  return (
    <div className="relative w-full h-full bg-[#0f0502]">
      <Overlay treeState={treeState} setTreeState={setTreeState} />
      
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: false, toneMappingExposure: 1.1, shadowMap: { enabled: true } }}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          <Scene treeState={treeState} />
        </Suspense>
      </Canvas>
      
      {/* Background radial gradient via CSS for depth */}
      <div 
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #2b1d0e 0%, #0f0502 90%)'
        }}
      />
    </div>
  );
}

export default App;
