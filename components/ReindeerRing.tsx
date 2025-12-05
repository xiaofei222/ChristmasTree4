
import React, { useMemo } from 'react';
import Reindeer from './Reindeer';
import { TreeState } from '../types';
import { CONFIG } from '../constants';

interface ReindeerRingProps {
  treeState: TreeState;
}

const ReindeerRing: React.FC<ReindeerRingProps> = ({ treeState }) => {
  const count = 8;
  
  const deerData = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      // Scatter positions: Random high in the sky or wide out
      const r = CONFIG.scatterRadius;
      const x = (Math.random() - 0.5) * r * 1.5;
      const y = (Math.random() - 0.5) * r + 5; // Float higher
      const z = (Math.random() - 0.5) * r * 1.5;

      const rot: [number, number, number] = [
        Math.random() * Math.PI, 
        Math.random() * Math.PI, 
        Math.random() * Math.PI
      ];

      return {
        scatterPos: [x, y, z] as [number, number, number],
        scatterRot: rot
      };
    });
  }, []);

  return (
    <group>
      {deerData.map((data, i) => (
        <Reindeer
          key={i}
          index={i}
          total={count}
          treeState={treeState}
          scatterPos={data.scatterPos}
          scatterRot={data.scatterRot}
        />
      ))}
    </group>
  );
};

export default ReindeerRing;
