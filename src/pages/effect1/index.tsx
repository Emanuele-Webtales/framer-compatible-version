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

// Mobile/touch detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Check for touch capability and screen size
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 810;
      setIsMobile(hasTouch || isSmallScreen);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

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
  // Loop and hover controls
  loopEnabled: boolean;
  setLoopEnabled: (value: boolean) => void;
  loopType: 'oneShot' | 'repeat' | 'mirror';
  setLoopType: (value: 'oneShot' | 'repeat' | 'mirror') => void;
  loopDuration: number;
  setLoopDuration: (value: number) => void;
  loopEasing: string;
  setLoopEasing: (value: string) => void;
  hoverEnabled: boolean;
  setHoverEnabled: (value: boolean) => void;
  progressDirection: 'topToBottom' | 'bottomToTop' | 'leftToRight' | 'rightToLeft' | 'centerOutward' | 'outwardToCenter';
  setProgressDirection: (value: 'topToBottom' | 'bottomToTop' | 'leftToRight' | 'rightToLeft' | 'centerOutward' | 'outwardToCenter') => void;
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
  setGradientIntensity,
  loopEnabled,
  setLoopEnabled,
  loopType,
  setLoopType,
  loopDuration,
  setLoopDuration,
  loopEasing,
  setLoopEasing,
  hoverEnabled,
  setHoverEnabled,
  progressDirection,
  setProgressDirection
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

      

      {/* Loop Options */}
      <div style={{ marginBottom: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Loop Options</h4>
        
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="checkbox"
            checked={loopEnabled}
            onChange={(e) => setLoopEnabled(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Loop
        </label>
        
        {loopEnabled && (
          <>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Loop Type</label>
              <select
                value={loopType}
                onChange={(e) => setLoopType(e.target.value as 'oneShot' | 'repeat' | 'mirror')}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '12px'
                }}
              >
                <option value="repeat">Repeat</option>
                <option value="mirror">Mirror</option>
                <option value="oneShot">One Shot</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Duration: {loopDuration}s</label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.1"
                value={loopDuration}
                onChange={(e) => setLoopDuration(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Easing</label>
              <input
                type="text"
                value={loopEasing}
                onChange={(e) => setLoopEasing(e.target.value)}
                placeholder="e.g. easeInOut"
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '12px'
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Hover Options */}
      <div style={{ marginBottom: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Hover Options</h4>
        
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="checkbox"
            checked={hoverEnabled}
            onChange={(e) => setHoverEnabled(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Enable Hover
        </label>
        
        {hoverEnabled && (
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Progress Direction</label>
            <select
              value={progressDirection}
              onChange={(e) => setProgressDirection(e.target.value as any)}
              style={{
                width: '100%',
                padding: '6px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '12px'
              }}
            >
              <option value="topToBottom">Top to Bottom</option>
              <option value="bottomToTop">Bottom to Top</option>
              <option value="leftToRight">Left to Right</option>
              <option value="rightToLeft">Right to Left</option>
              <option value="centerOutward">Center Outward</option>
              <option value="outwardToCenter">Outward to Center</option>
            </select>
          </div>
        )}
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
      
                  // Noise functions removed for clean gradient lines
      
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
                
                // Create dots (without noise for clean appearance)
                float dist = length(tiledUv);
                float dot = smoothstep(0.5, 0.49, dist);
                
                // Combine dots with flow
                float final = dot * flow;
                gl_FragColor = vec4(uColor * final, final);
                                           } else {
                // For gradient line effect - high quality like reference-code-old.tsx with manual bloom
                float exactProgress = abs(depth - uProgress);
                
                // Scale the gradient width to be less sensitive (like reference code)
                float scaledGradientWidth = uGradientWidth * 0.1;
                
                // Check if we're at the current progress band (very precise)
                bool isCurrentBand = exactProgress <= 0.001;
                
                // Check if we're within the gradient width range
                bool isWithinGradientRange = exactProgress <= scaledGradientWidth;
                
                // Calculate linear interpolation for bands within range
                float normalizedDistance = exactProgress / scaledGradientWidth;
                float interpolatedOpacity = (1.0 - normalizedDistance) * 0.95 + 0.05;
                
                // Set opacity: 1.0 for current band, interpolated for bands within range, 0.0 for others
                float opacity = isCurrentBand ? 1.0 : (isWithinGradientRange ? interpolatedOpacity : 0.0);
                
                // Manual bloom effect - sample neighboring pixels
                float bloomStrength = 0.3; // Adjust this for bloom intensity
                float bloomRadius = 0.002; // Adjust this for bloom size
                
                // Sample 8 neighboring pixels for bloom
                float bloom = 0.0;
                bloom += texture2D(uDepthMap, uv + vec2(bloomRadius, 0.0)).r;
                bloom += texture2D(uDepthMap, uv + vec2(-bloomRadius, 0.0)).r;
                bloom += texture2D(uDepthMap, uv + vec2(0.0, bloomRadius)).r;
                bloom += texture2D(uDepthMap, uv + vec2(0.0, -bloomRadius)).r;
                bloom += texture2D(uDepthMap, uv + vec2(bloomRadius, bloomRadius)).r;
                bloom += texture2D(uDepthMap, uv + vec2(-bloomRadius, bloomRadius)).r;
                bloom += texture2D(uDepthMap, uv + vec2(bloomRadius, -bloomRadius)).r;
                bloom += texture2D(uDepthMap, uv + vec2(-bloomRadius, -bloomRadius)).r;
                bloom /= 8.0; // Average the samples
                
                // Calculate bloom opacity
                float bloomProgress = abs(bloom - uProgress);
                float bloomOpacity = 0.0;
                if (bloomProgress <= 0.002) { // Slightly wider than main line
                    bloomOpacity = (1.0 - bloomProgress / 0.002) * bloomStrength;
                }
                
                // Combine main line with bloom
                float finalOpacity = max(opacity, bloomOpacity);
                
                // Apply color and intensity
                gl_FragColor = vec4(uColor * finalOpacity * uGradientIntensity, finalOpacity);
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
  const isMobile = useIsMobile();
  
  const [dotSize, setDotSize] = useState(0.1);
  const [dotColor, setDotColor] = useState('#00ff00');
  const [tilingScale, setTilingScale] = useState(1.0);
  const [isVisible, setIsVisible] = useState(true);
  const [effectType, setEffectType] = useState<'dots' | 'gradient'>('dots');
  const [gradientWidth, setGradientWidth] = useState(0.0);
  const [gradientIntensity, setGradientIntensity] = useState(0.4);
  
  // Loop and hover state
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopType, setLoopType] = useState<'oneShot' | 'repeat' | 'mirror'>('repeat');
  const [loopDuration, setLoopDuration] = useState(3);
  const [loopEasing, setLoopEasing] = useState('easeInOut');
  const [hoverEnabled, setHoverEnabled] = useState(!isMobile);
  const [progressDirection, setProgressDirection] = useState<'topToBottom' | 'bottomToTop' | 'leftToRight' | 'rightToLeft' | 'centerOutward' | 'outwardToCenter'>('topToBottom');
  
  // Mouse and progress state
  const [progress, setProgress] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [loopProgress, setLoopProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStartProgress, setTransitionStartProgress] = useState(0);
  const [transitionStartTime, setTransitionStartTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const loopAnimation = useAnimation();
  const loopProgressMotion = useMotionValue(0);

  // Convert GSAP easing to Framer Motion easing
  const getEasing = (easing: string) => {
    switch (easing) {
      case 'power2.inOut': return 'easeInOut';
      case 'power2.in': return 'easeIn';
      case 'power2.out': return 'easeOut';
      case 'power1.inOut': return 'easeInOut';
      case 'power1.in': return 'easeIn';
      case 'power1.out': return 'easeOut';
      default: return 'easeInOut';
    }
  };

  // Loop animation with Framer Motion
  useEffect(() => {
    if (!loopEnabled) {
      loopAnimation.stop();
      return;
    }

    // Stop any existing animation
    loopAnimation.stop();

    const animateLoop = async () => {
      const repeatCount = loopType === 'repeat' ? Infinity : 
                         loopType === 'oneShot' ? 0 : Infinity;
      
      await loopAnimation.start({
        x: [0, 1],
        transition: {
          duration: loopDuration,
          ease: getEasing(loopEasing),
          repeat: repeatCount,
          repeatType: loopType === 'mirror' ? 'reverse' : 'loop',
        }
      });
    };

    animateLoop();

    return () => {
      loopAnimation.stop();
    };
  }, [loopEnabled, loopDuration, loopType, loopEasing, loopAnimation]);

  // Update progress based on loop animation
  useEffect(() => {
    const unsubscribe = loopProgressMotion.on('change', (latest) => {
      setLoopProgress(latest);
      // Only set the main progress if not hovering and not transitioning
      if (!isHovering && !isTransitioning) {
        setProgress(latest);
      }
    });

    return unsubscribe;
  }, [loopProgressMotion, isHovering, isTransitioning]);

  // Handle hover state changes for loop animation control
  useEffect(() => {
    if (!loopEnabled) return;
    
    if (isHovering && hoverEnabled && !isMobile) {
      loopAnimation.stop();
    }
  }, [isHovering, hoverEnabled, loopEnabled, isMobile, loopAnimation]);

  // Handle mouse movement to control the scanning effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !hoverEnabled || isMobile) return;
    
    // Get the bounding rectangle of the container
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate progress based on direction
    let relativeProgress: number;
    
    switch (progressDirection) {
      case 'topToBottom':
        relativeProgress = (e.clientY - rect.top) / rect.height;
        break;
      case 'bottomToTop':
        relativeProgress = 1 - (e.clientY - rect.top) / rect.height;
        break;
      case 'leftToRight':
        relativeProgress = (e.clientX - rect.left) / rect.width;
        break;
      case 'rightToLeft':
        relativeProgress = 1 - (e.clientX - rect.left) / rect.width;
        break;
      case 'centerOutward':
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
        const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
        relativeProgress = Math.min(distance / maxDistance, 1);
        break;
      case 'outwardToCenter':
        const centerX2 = rect.width / 2;
        const centerY2 = rect.height / 2;
        const mouseX2 = e.clientX - rect.left;
        const mouseY2 = e.clientY - rect.top;
        const distance2 = Math.sqrt(Math.pow(mouseX2 - centerX2, 2) + Math.pow(mouseY2 - centerY2, 2));
        const maxDistance2 = Math.sqrt(Math.pow(centerX2, 2) + Math.pow(centerY2, 2));
        relativeProgress = 1 - Math.min(distance2 / maxDistance2, 1);
        break;
      default:
        relativeProgress = (e.clientY - rect.top) / rect.height;
    }
    
    // Clamp the value between 0 and 1
    const clampedProgress = Math.max(0, Math.min(1, relativeProgress));
    
    // Handle smooth transition during hover
    if (isHovering) {
      if (isTransitioning) {
        // During transition from loop to hover, smoothly interpolate
        const elapsed = (Date.now() - transitionStartTime) / 1000;
        const transitionProgress = Math.min(elapsed / 0.3, 1);
  
        // Apply ease-in-out easing
        const easedProgress = transitionProgress < 0.5
          ? 2 * transitionProgress * transitionProgress 
          : 1 - Math.pow(-2 * transitionProgress + 2, 2) / 2;
        
        // Smooth interpolation from start to current target
        const interpolatedProgress = transitionStartProgress + (clampedProgress - transitionStartProgress) * easedProgress;
        setProgress(interpolatedProgress);
        
        // Check if transition is complete
        if (transitionProgress >= 1) {
          setIsTransitioning(false);
        }
      } else {
        // After transition or no loop - follow cursor directly
        setProgress(clampedProgress);
      }
    }
  };

  // Handle mouse entering the container
  const handleMouseEnter = () => {
    if (!hoverEnabled || isMobile) return;
    setIsHovering(true);
    
    // If loop is active, start transition from current progress to hover
    if (loopEnabled) {
      setIsTransitioning(true);
      setTransitionStartProgress(progress);
      setTransitionStartTime(Date.now());
      // Pause the loop animation
      loopAnimation.stop();
    }
  };

  // Handle mouse leaving the container
  const handleMouseLeave = async () => {
    if (!hoverEnabled || isMobile) return;
    setIsHovering(false);
    setIsTransitioning(false);
    
    if (loopEnabled) {
      // First, complete the current cycle from hover-out position to 1
      const remainingDuration = loopDuration * (1 - progress);
      
      // Set the current position and animate to complete the cycle
      loopAnimation.set({ x: progress });
      
      if (loopType === 'oneShot') {
        // For one shot, just complete to 1 and stop
        loopAnimation.start({
          x: 1,
          transition: {
            duration: remainingDuration,
            ease: getEasing(loopEasing),
          }
        });
      } else {
        // For repeat and mirror, complete current cycle then restart natural cycle
        await loopAnimation.start({
          x: 1,
          transition: {
            duration: remainingDuration,
            ease: getEasing(loopEasing),
          }
        });
        
        // Then start the natural loop cycle from 0
        loopAnimation.start({
          x: [0, 1],
          transition: {
            duration: loopDuration,
            ease: getEasing(loopEasing),
            repeat: Infinity,
            repeatType: loopType === 'mirror' ? 'reverse' : 'loop',
          }
        });
      }
    }
  };

  // Debug loading state
  useEffect(() => {
    console.log('Loading state changed:', isLoading);
  }, [isLoading]);

  return (
    <div style={{height: '100vh', width:"100vw", padding:"20vh 20vw"}}>
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
              <div 
          style={{ height: '100%' }}
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
        <div
          style={{
            height: '100%',
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

        {/* Debug Panel */}
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 1000,
          minWidth: '200px',
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Debug Panel</h4>
          <div style={{ marginBottom: '5px' }}>Current Progress: {(progress * 100).toFixed(1)}%</div>
          <div style={{ marginBottom: '5px' }}>Loop Progress: {(loopProgress * 100).toFixed(1)}%</div>
          <div style={{ marginBottom: '5px' }}>Loop Enabled: {loopEnabled ? 'YES' : 'NO'}</div>
          <div style={{ marginBottom: '5px' }}>Hover Enabled: {hoverEnabled ? 'YES' : 'NO'}</div>
          <div style={{ marginBottom: '5px' }}>Is Hovering: {isHovering ? 'YES' : 'NO'}</div>
          <div style={{ marginBottom: '5px' }}>Is Transitioning: {isTransitioning ? 'YES' : 'NO'}</div>
          <div style={{ marginBottom: '5px' }}>Loop Type: {loopType}</div>
        </div>

        {/* Toggle button for controls */}
        {!isVisible && (
          <button
            onClick={() => setIsVisible(true)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '250px',
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
          loopEnabled={loopEnabled}
          setLoopEnabled={setLoopEnabled}
          loopType={loopType}
          setLoopType={setLoopType}
          loopDuration={loopDuration}
          setLoopDuration={setLoopDuration}
          loopEasing={loopEasing}
          setLoopEasing={setLoopEasing}
          hoverEnabled={hoverEnabled}
          setHoverEnabled={setHoverEnabled}
          progressDirection={progressDirection}
          setProgressDirection={setProgressDirection}
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
