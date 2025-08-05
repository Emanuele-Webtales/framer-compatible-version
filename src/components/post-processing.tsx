import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';

export const PostProcessing = ({
  strength = 1,
  threshold = 1,
}: {
  strength?: number;
  threshold?: number;
}) => {
  const { gl, scene, camera } = useThree();

  // Simple post-processing setup that works with current Three.js version
  const render = useMemo(() => {
    // For now, just return the standard renderer
    return { gl, scene, camera };
  }, [gl, scene, camera]);

  useFrame(() => {
    // Use standard rendering instead of renderAsync
    gl.setRenderTarget(null);
    gl.render(scene, camera);
  });

  return null;
};
