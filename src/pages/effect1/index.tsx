'use client';

import { WebGPUCanvas } from '@/components/canvas';
import { useAspect, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useContext, useMemo, useRef, useState } from 'react';
import { Tomorrow } from 'next/font/google';
import gsap from 'gsap';

import * as THREE from 'three';
import { useGSAP } from '@gsap/react';
import { GlobalContext, ContextProvider } from '@/context';
import { PostProcessing } from '@/components/post-processing';
import TEXTUREMAP from '../assets/raw-1.png';
import DEPTHMAP from '../assets/depth-1.png';

const tomorrow = Tomorrow({
  weight: '600',
  subsets: ['latin'],
});

const WIDTH = 1600;
const HEIGHT = 900;

// UI Controls Component
interface UIControlsProps {
  dotSize: number;
  setDotSize: (value: number) => void;
  dotColor: string;
  setDotColor: (value: string) => void;
  bloomIntensity: number;
  setBloomIntensity: (value: number) => void;
  tilingScale: number;
  setTilingScale: (value: number) => void;
  isVisible: boolean;
  setIsVisible: (value: boolean) => void;
}

const UIControls = ({ 
  dotSize, 
  setDotSize, 
  dotColor, 
  setDotColor, 
  bloomIntensity, 
  setBloomIntensity,
  tilingScale,
  setTilingScale,
  isVisible,
  setIsVisible 
}: UIControlsProps) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '20px',
      borderRadius: '10px',
      color: 'white',
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: 1000,
      minWidth: '250px',
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Shader Controls</h3>
      
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
        <label style={{ display: 'block', marginBottom: '5px' }}>Dot Color:</label>
        <input
          type="color"
          value={dotColor}
          onChange={(e) => setDotColor(e.target.value)}
          style={{ width: '100%', height: '30px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Bloom Intensity: {bloomIntensity.toFixed(2)}</label>
        <input
          type="range"
          min="0.0"
          max="2.0"
          step="0.1"
          value={bloomIntensity}
          onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
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
  bloomIntensity: number;
  tilingScale: number;
}

const Scene = ({ 
  dotSize, 
  dotColor, 
  bloomIntensity, 
  tilingScale 
}: SceneProps) => {
  const { setIsLoading } = useContext(GlobalContext);
  const materialRef = useRef<THREE.Mesh>(null);

  // Load the textures
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src], () => {
    setIsLoading(false);
    if (rawMap) {
      rawMap.colorSpace = THREE.SRGBColorSpace;
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

  // Create a custom shader material that uses the textures
  const material = useMemo(() => {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uProgress;
      uniform vec2 uPointer;
      uniform float uTime;
      uniform sampler2D uTextureMap;
      uniform sampler2D uDepthMap;
      uniform float uDotSize;
      uniform vec3 uDotColor;
      uniform float uBloomIntensity;
      uniform float uTilingScale;
      varying vec2 vUv;
      
      // Simulate noise function
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      // Simulate cell noise
      float cellNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float n = noise(i);
        return n;
      }
      
      // Simple gaussian blur
      vec3 blur(sampler2D tex, vec2 uv, vec2 direction, float strength) {
        vec3 color = vec3(0.0);
        float total = 0.0;
        
        for(float i = -4.0; i <= 4.0; i++) {
          float weight = exp(-0.5 * (i * i) / (strength * strength));
          vec2 offset = direction * i * 0.01;
          color += texture2D(tex, uv + offset).rgb * weight;
          total += weight;
        }
        
        return color / total;
      }
      
      void main() {
        vec2 uv = vUv;
        
        // Sample the depth map
        float depth = texture2D(uDepthMap, uv).r;
        
        // Sample the texture (no displacement)
        vec3 textureColor = texture2D(uTextureMap, uv).rgb;
        
        // Create tiling effect with adjustable scale
        vec2 tiledUv = mod(uv * uTilingScale, 2.0) - 1.0;
        float dist = length(tiledUv);
        
        // Create dot pattern with adjustable size
        float brightness = cellNoise(uv * 60.0);
        float dot = smoothstep(uDotSize, uDotSize - 0.01, dist) * brightness;
        
        // Create flow effect based on progress and depth (SCANNING EFFECT)
        float flow = 1.0 - smoothstep(0.0, 0.02, abs(depth - uProgress));
        
        // Create mask with custom color
        vec3 mask = dot * flow * uDotColor * 10.0;
        
        // Blend texture with effects
        vec3 finalColor = textureColor + mask;
        
        // BLOOM EFFECT with adjustable intensity
        // Create bright pass (extract bright areas)
        float brightness_threshold = 0.6;
        vec3 brightPass = max(finalColor - brightness_threshold, 0.0);
        
        // Blur the bright pass for bloom
        vec3 bloom = blur(uTextureMap, uv, vec2(1.0, 0.0), 2.0) * 0.5 +
                     blur(uTextureMap, uv, vec2(0.0, 1.0), 2.0) * 0.5;
        
        // Add bloom to final color with adjustable intensity
        finalColor += bloom * uBloomIntensity;
        
        // Add extra bloom for bright areas
        finalColor += brightPass * 0.3;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const rgbColor = hexToRgb(dotColor);

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uProgress: { value: 0.0 },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uTime: { value: 0.0 },
        uTextureMap: { value: rawMap },
        uDepthMap: { value: depthMap },
        uDotSize: { value: dotSize },
        uDotColor: { value: new THREE.Vector3(rgbColor.r, rgbColor.g, rgbColor.b) },
        uBloomIntensity: { value: bloomIntensity },
        uTilingScale: { value: tilingScale },
      },
    });
  }, [rawMap, depthMap, setIsLoading]); // Remove props from dependencies

  const [w, h] = useAspect(WIDTH, HEIGHT);

  // Animate the progress uniform
  useGSAP(() => {
    if (materialRef.current?.material instanceof THREE.ShaderMaterial) {
      gsap.to(materialRef.current.material.uniforms.uProgress, {
        value: 1,
        repeat: -1,
        duration: 3,
        ease: 'power1.out',
      });
    }
  }, []);

  // Update time and pointer
  useFrame(({ pointer, clock }) => {
    if (materialRef.current?.material instanceof THREE.ShaderMaterial) {
      materialRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.material.uniforms.uPointer.value = pointer;
    }
  });

  // Update uniforms when props change (without recreating material)
  useFrame(() => {
    if (materialRef.current?.material instanceof THREE.ShaderMaterial) {
      const material = materialRef.current.material as THREE.ShaderMaterial;
      const rgbColor = hexToRgb(dotColor);
      
      material.uniforms.uDotSize.value = dotSize;
      material.uniforms.uDotColor.value = new THREE.Vector3(rgbColor.r, rgbColor.g, rgbColor.b);
      material.uniforms.uBloomIntensity.value = bloomIntensity;
      material.uniforms.uTilingScale.value = tilingScale;
    }
  });

  return (
    <mesh scale={[w, h, 1]} material={material} ref={materialRef}>
      <planeGeometry />
    </mesh>
  );
};

const Html = () => {
  const { isLoading } = useContext(GlobalContext);
  const [dotSize, setDotSize] = useState(0.5);
  const [dotColor, setDotColor] = useState('#ff0000');
  const [bloomIntensity, setBloomIntensity] = useState(0.8);
  const [tilingScale, setTilingScale] = useState(120);
  const [isVisible, setIsVisible] = useState(true);

  useGSAP(() => {
    if (!isLoading) {
      gsap
        .timeline()
        .to('[data-loader]', {
          opacity: 0,
        })
        .from('[data-title]', {
          yPercent: -100,
          stagger: {
            each: 0.15,
          },
          ease: 'power1.out',
        })
        .from('[data-desc]', {
          opacity: 0,
          yPercent: 100,
        });
    }
  }, [isLoading]);

  return (
    <div>
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
              ...tomorrow.style,
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
            bloomIntensity={bloomIntensity}
            tilingScale={tilingScale}
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
          bloomIntensity={bloomIntensity}
          setBloomIntensity={setBloomIntensity}
          tilingScale={tilingScale}
          setTilingScale={setTilingScale}
          isVisible={isVisible}
          setIsVisible={setIsVisible}
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
