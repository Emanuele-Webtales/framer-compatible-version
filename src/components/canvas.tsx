import * as THREE from 'three';
import { Canvas, CanvasProps, extend } from '@react-three/fiber';

extend(THREE as any);

export const WebGPUCanvas = (props: CanvasProps) => {
  return (
    <Canvas
      {...props}
      flat
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        precision: "mediump",
        depth: true,
      }}
      style={{
        width: "100%",
        height: "100%",
      }}
      resize={{ offsetSize: true }}
      dpr={[1, 2]}
    >
      {props.children}
    </Canvas>
  );
};
