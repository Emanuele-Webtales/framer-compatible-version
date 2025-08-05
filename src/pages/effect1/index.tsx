'use client';

//--------------------------------
// LIBRARIES WE NEED TO BUNDLE
//--------------------------------

import { useAspect, useTexture } from '@react-three/drei';
import { useFrame, Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Mesh, ShaderMaterial, MeshBasicMaterial, SRGBColorSpace, Vector2, Vector3 } from 'three';

// Import basic TSL functions (only the ones we need)
import {
  abs,
  float,
  max,
  mod,
  oneMinus,
  select,
  smoothstep,
  sub,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';

//--------------------------------
//--------------------------------


import { useContext, useMemo, useRef, useState, useEffect, createContext, ReactNode } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import TEXTUREMAP from '../assets/raw-1.png';
import DEPTHMAP from '../assets/depth-1.png';

const WIDTH = 1600;
const HEIGHT = 900;

// Global Context
interface GlobalContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const GlobalContext = createContext<GlobalContextType>({
  isLoading: true,
  setIsLoading: () => {},
});

interface ContextProviderProps {
  children: ReactNode;
}

export const ContextProvider: React.FC<ContextProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <GlobalContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </GlobalContext.Provider>
  );
};

// WebGPUCanvas Component
export const WebGPUCanvas = (props:any) => {
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

// PostProcessing Component
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

// UI Controls Component
interface UIControlsProps {
  dotSize: number;
  setDotSize: (value: number) => void;
  dotColor: string;
  setDotColor: (value: string) => void;
  tilingScale: number;
  setTilingScale: (value: number) => void;
  isVisible: boolean;
  setIsVisible: (value: boolean) => void;
  effectType: 'dots' | 'gradient';
  setEffectType: (value: 'dots' | 'gradient') => void;
  gradientWidth: number;
  setGradientWidth: (value: number) => void;
  gradientIntensity: number;
  setGradientIntensity: (value: number) => void;
}

const UIControls = ({ 
  dotSize, 
  setDotSize, 
  dotColor, 
  setDotColor, 
  tilingScale,
  setTilingScale,
  isVisible,
  setIsVisible,
  effectType,
  setEffectType,
  gradientWidth,
  setGradientWidth,
  gradientIntensity,
  setGradientIntensity
}: UIControlsProps) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      background: 'rgba(0, 0, 0, 0.6)',
      padding: '20px',
      borderRadius: '24px',
      color: 'white',
      fontFamily: 'monospace',
      textTransform: 'uppercase',
      fontSize: '13px',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      minWidth: '250px',
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Shader Controls</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Effect Type:</label>
        <select
          value={effectType}
          onChange={(e) => setEffectType(e.target.value as 'dots' | 'gradient')}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '14px'
          }}
        >
          <option value="dots">Dots</option>
          <option value="gradient">Gradient Line</option>
        </select>
      </div>

      {effectType === 'dots' && (
        <>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Dot Size: {dotSize.toFixed(2)}</label>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={dotSize}
              onChange={(e) => setDotSize(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Tiling Scale: {tilingScale.toFixed(0)}</label>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={tilingScale}
              onChange={(e) => setTilingScale(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </>
      )}

      {effectType === 'gradient' && (
        <>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Gradient Width: {gradientWidth.toFixed(2)}</label>
            <input
              type="range"
              min="0.0"
              max="5.0"
              step="0.1"
              value={gradientWidth}
              onChange={(e) => setGradientWidth(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Gradient Intensity: {gradientIntensity.toFixed(2)}</label>
            <input
              type="range"
              min="0.0"
              max="5.0"
              step="0.1"
              value={gradientIntensity}
              onChange={(e) => setGradientIntensity(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </>
      )}

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Dot Color:</label>
        <input
          type="color"
          value={dotColor}
          onChange={(e) => setDotColor(e.target.value)}
          style={{ width: '100%', height: '30px' }}
        />
      </div>

      <button
        onClick={() => setIsVisible(false)}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        Hide Controls
      </button>
    </div>
  );
};

interface SceneProps {
  dotSize: number;
  dotColor: string;
  tilingScale: number;
  effectType: 'dots' | 'gradient';
  gradientWidth: number;
  gradientIntensity: number;
  progress: number;
}

const Scene = ({ 
  dotSize, 
  dotColor, 
  tilingScale,
  effectType,
  gradientWidth,
  gradientIntensity,
  progress
}: SceneProps) => {
  const { setIsLoading } = useContext(GlobalContext);
  const materialRef = useRef<Mesh>(null);
  
  // Create uniform refs that persist between renders
  const uniformsRef = useRef({
    uProgress: { value: 0 },
    uDepthMap: { value: null as any },
    uColor: { value: new Vector3(0, 1, 0) },
    uEffectType: { value: 0.0 },
    uDotSize: { value: dotSize },
    uTilingScale: { value: tilingScale },
    uGradientWidth: { value: gradientWidth },
    uGradientIntensity: { value: gradientIntensity }
  });

  // Load the textures
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src], () => {
    setIsLoading(false);
    if (rawMap) {
      rawMap.colorSpace = SRGBColorSpace;
    }
  });

  // Convert hex color to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 1, g: 0, b: 0 };
  };

  // Use MeshBasicMaterial for bright base image
  const material = useMemo(() => {
    return new MeshBasicMaterial({
      map: rawMap,
      transparent: false,
    });
  }, [rawMap]);

  const [w, h] = useAspect(WIDTH, HEIGHT);

  // Update uniforms for the effects shader
  useFrame(() => {
    const rgbColor = hexToRgb(dotColor);
    
    // Update persistent uniform refs
    uniformsRef.current.uProgress.value = progress;
    uniformsRef.current.uColor.value.set(rgbColor.r, rgbColor.g, rgbColor.b);
    uniformsRef.current.uEffectType.value = effectType === 'dots' ? 0.0 : 1.0;
    uniformsRef.current.uDotSize.value = dotSize;
    uniformsRef.current.uTilingScale.value = tilingScale;
    uniformsRef.current.uGradientWidth.value = gradientWidth;
    uniformsRef.current.uGradientIntensity.value = gradientIntensity;
    
    // Update depth map when loaded
    if (depthMap && uniformsRef.current.uDepthMap.value !== depthMap) {
      uniformsRef.current.uDepthMap.value = depthMap;
    }
    
    // Debug: Log progress to make sure it's updating
    console.log('Updating progress:', progress);
  });

  return (
    <>
      {/* Base image mesh - bright and untouched */}
      <mesh scale={[w, h, 1]} material={material}>
        <planeGeometry />
      </mesh>
      
      {/* Effects overlay mesh */}
      <mesh scale={[w, h, 1]} position={[0, 0, 0.01]} ref={materialRef}>
        <planeGeometry />
        <shaderMaterial
          transparent={true}
          blending={THREE.AdditiveBlending}
          vertexShader={`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
          `}
          fragmentShader={`
      uniform float uProgress;
      uniform sampler2D uDepthMap;
            uniform vec3 uColor;
            uniform float uEffectType;
      uniform float uDotSize;
      uniform float uTilingScale;
      uniform float uGradientWidth;
      uniform float uGradientIntensity;
      varying vec2 vUv;
      
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
            // Simulate cell noise (from framer-version)
      float cellNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float n = noise(i);
        return n;
      }
      
                  void main() {
              vec2 uv = vUv;
              float depth = texture2D(uDepthMap, uv).r;
              
              // Use the exact working formula from reference-code.tsx
              float flow = 1.0 - smoothstep(0.0, 0.02, abs(depth - uProgress));
              
              // For dots effect
              if (uEffectType < 0.5) {
                // Create tiled UV for dots
                vec2 aspect = vec2(1600.0 / 900.0, 1.0);
                vec2 tUv = vec2(uv.x * aspect.x, uv.y);
                vec2 tiling = vec2(uTilingScale);
                vec2 tiledUv = mod(tUv * tiling, 2.0) - 1.0;
                
                // Create noise for dot brightness
                float noise = fract(sin(dot(tUv * tiling / 2.0, vec2(12.9898, 78.233))) * 43758.5453);
                
                // Create dots
                float dist = length(tiledUv);
                float dot = smoothstep(0.5, 0.49, dist) * noise;
                
                // Combine dots with flow
                float final = dot * flow;
                gl_FragColor = vec4(uColor * final, final);
              } else {
                // For gradient line effect
                float gradient = smoothstep(uProgress - uGradientWidth, uProgress, depth) * 
                               smoothstep(uProgress + uGradientWidth, uProgress, depth);
                gl_FragColor = vec4(uColor * gradient * uGradientIntensity, gradient);
              }
            }
          `}
          uniforms={uniformsRef.current}
        />
    </mesh>
    </>
  );
};

const Html = () => {
  const { isLoading } = useContext(GlobalContext);
  const [dotSize, setDotSize] = useState(0.1);
  const [dotColor, setDotColor] = useState('#00ff00');
  const [tilingScale, setTilingScale] = useState(1.0);
  const [isVisible, setIsVisible] = useState(true);
  const [effectType, setEffectType] = useState<'dots' | 'gradient'>('dots');
  const [gradientWidth, setGradientWidth] = useState(0.0);
  const [gradientIntensity, setGradientIntensity] = useState(0.4);
  
  // Framer Motion animation state
  const [progress, setProgress] = useState(0);
  const loopAnimation = useAnimation();
  const loopProgressMotion = useMotionValue(0);

  // Loop animation with Framer Motion
  useEffect(() => {
    const animateLoop = async () => {
      try {
        await loopAnimation.start({
          x: [0, 1],
          transition: {
            duration: 3,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'loop',
          }
        });
      } catch (error) {
        console.error('Animation error:', error);
      }
    };

    animateLoop();

    return () => {
      loopAnimation.stop();
    };
  }, [loopAnimation]);

  // Update progress based on loop animation
  useEffect(() => {
    const unsubscribe = loopProgressMotion.on('change', (latest) => {
      setProgress(latest);
    });

    return unsubscribe;
  }, [loopProgressMotion]);

  // Debug loading state
  useEffect(() => {
    console.log('Loading state changed:', isLoading);
  }, [isLoading]);

  return (
    <div>
      {/* Hidden motion div to track loop animation progress */}
      <motion.div
        style={{ display: 'none' }}
        animate={loopAnimation}
        onUpdate={(latest: any) => {
          if (typeof latest.x === 'number') {
            loopProgressMotion.set(latest.x);
          }
        }}
      />
      
      {isLoading && (
        <div
          style={{
            height: '100vh',
            position: 'fixed',
            zIndex: 90,
            backgroundColor: '#92400e',
            pointerEvents: 'none',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isLoading ? 1 : 0,
            transition: 'opacity 0.5s ease-out',
          }}
          data-loader
        >
          <div
            style={{
              width: '1.5rem',
              height: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '50%',
              animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          ></div>
        </div>
      )}
      <div style={{ height: '100vh' }}>
        <div
          style={{
            height: '100vh',
            textTransform: 'uppercase',
            alignItems: 'center',
            width: '100%',
            position: 'absolute',
            zIndex: 60,
            pointerEvents: 'none',
            padding: '0 2.5rem',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: '2.25rem',
              lineHeight: '2.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                overflow: 'hidden',
              }}
            >
              {'Crown of Fire'.split(' ').map((word, index) => {
                return (
                  <div data-title key={index}>
                    {word}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              fontSize: '0.75rem',
              lineHeight: '1rem',
              marginTop: '0.5rem',
              overflow: 'hidden',
            }}
          >
            <div data-desc>The Majesty and Glory of the Young King</div>
          </div>
        </div>

        <WebGPUCanvas>
          <PostProcessing></PostProcessing>
          <Scene 
            dotSize={dotSize}
            dotColor={dotColor}
            tilingScale={tilingScale}
            effectType={effectType}
            gradientWidth={gradientWidth/10}
            gradientIntensity={gradientIntensity}
            progress={progress}
          />
        </WebGPUCanvas>

        {/* Toggle button for controls */}
        {!isVisible && (
          <button
            onClick={() => setIsVisible(true)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '8px 12px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              zIndex: 1000,
            }}
          >
            Show Controls
          </button>
        )}

        {/* UI Controls */}
        <UIControls
          dotSize={dotSize}
          setDotSize={setDotSize}
          dotColor={dotColor}
          setDotColor={setDotColor}
          tilingScale={tilingScale}
          setTilingScale={setTilingScale}
          isVisible={isVisible}
          setIsVisible={setIsVisible}
          effectType={effectType}
          setEffectType={setEffectType}
          gradientWidth={gradientWidth}
          setGradientWidth={setGradientWidth}
          gradientIntensity={gradientIntensity}
          setGradientIntensity={setGradientIntensity}
        />
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <ContextProvider>
      <Html></Html>
    </ContextProvider>
  );
}
