'use client';

import { WebGPUCanvas } from '@/components/canvas';
import { useAspect, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useContext, useMemo, useRef } from 'react';

import gsap from 'gsap';

import * as THREE from 'three';
import { useGSAP } from '@gsap/react';
import { GlobalContext, ContextProvider } from '@/context';
import { PostProcessing } from '@/components/post-processing';
import TEXTUREMAP from "../assets/raw-1.png";
import DEPTHMAP from "../assets/depth-1.png"


const WIDTH = 1600;
const HEIGHT = 900;

const Scene = () => {
  const { setIsLoading } = useContext(GlobalContext);
  const materialRef = useRef<THREE.Mesh>(null);

  // Load the textures
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src], () => {
    setIsLoading(false);
    if (rawMap) {
      rawMap.colorSpace = THREE.SRGBColorSpace;
    }
  });

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
        
        // Create tiling effect
        vec2 tiledUv = mod(uv * 120.0, 2.0) - 1.0;
        float dist = length(tiledUv);
        
        // Create dot pattern
        float brightness = cellNoise(uv * 60.0);
        float dot = smoothstep(0.5, 0.49, dist) * brightness;
        
        // Create flow effect based on progress and depth (SCANNING EFFECT)
        float flow = 1.0 - smoothstep(0.0, 0.02, abs(depth - uProgress));
        
        // Create mask
        vec3 mask = dot * flow * vec3(10.0, 0.0, 0.0);
        
        // Blend texture with effects
        vec3 finalColor = textureColor + mask;
        
        // BLOOM EFFECT
        // Create bright pass (extract bright areas)
        float brightness_threshold = 0.6;
        vec3 brightPass = max(finalColor - brightness_threshold, 0.0);
        
        // Blur the bright pass for bloom
        vec3 bloom = blur(uTextureMap, uv, vec2(1.0, 0.0), 2.0) * 0.5 +
                     blur(uTextureMap, uv, vec2(0.0, 1.0), 2.0) * 0.5;
        
        // Add bloom to final color
        finalColor += bloom * 0.8;
        
        // Add extra bloom for bright areas
        finalColor += brightPass * 0.3;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uProgress: { value: 0.0 },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uTime: { value: 0.0 },
        uTextureMap: { value: rawMap },
        uDepthMap: { value: depthMap },
      },
    });
  }, [rawMap, depthMap, setIsLoading]);

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

  return (
    <mesh scale={[w, h, 1]} material={material} ref={materialRef}>
      <planeGeometry />
    </mesh>
  );
};

const Html = () => {
  const { isLoading } = useContext(GlobalContext);

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
          <Scene></Scene>
        </WebGPUCanvas>
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
