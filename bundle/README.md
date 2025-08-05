# Three.js Effect Bundle

This bundle contains the Three.js libraries needed for the shader effect to work in Framer.

## Contents

The bundle includes:
- **Three.js** (v0.172.0) - Core 3D library
- **@react-three/fiber** (v8.16.6) - React renderer for Three.js
- **@react-three/drei** (v9.105.6) - Useful helpers for React Three Fiber

## Exported Components and Functions

```javascript
// React Three Fiber
import { Canvas, useFrame, useThree } from 'bundle-url';

// React Three Drei
import { useAspect, useTexture } from 'bundle-url';

// Three.js Classes
import { Mesh, ShaderMaterial, SRGBColorSpace, Vector2, Vector3 } from 'bundle-url';
```

## Usage in Framer

1. Host this bundle on a public GitHub repository
2. Import the bundle in Framer using the raw GitHub URL:

```javascript
import { 
  Canvas, 
  useFrame, 
  useThree, 
  useAspect, 
  useTexture,
  Mesh,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3
} from 'https://raw.githubusercontent.com/your-username/your-repo/main/bundle/dist/bundle.js';
```

## Build

To rebuild the bundle:

```bash
npm install
npm run build
```

This will create `dist/bundle.js` which contains all the necessary Three.js libraries bundled together.

## Notes

- React and React DOM are excluded from the bundle (they're provided by Framer)
- Framer Motion is excluded (it's provided by Framer)
- The bundle is minified and optimized for production use 