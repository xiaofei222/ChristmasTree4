
export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface DualPosition {
  tree: [number, number, number];
  scatter: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  type: 'box' | 'sphere';
  color: string;
}

export interface SceneProps {
  treeState: TreeState;
}