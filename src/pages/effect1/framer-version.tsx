//@ts-ignore
import {
  useAspect,
  useTexture,
  useFrame,
  Canvas,
  useThree,
  Mesh,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
} //@ts-ignore the errors are to be expected
from "https://cdn.jsdelivr.net/gh/framer-university/components/npm-bundles/scan-test-bundle.js"

//--------------------------------
//--------------------------------

import {
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
  createContext,
  ReactNode,
} from "react"
import { motion, useAnimation, useMotionValue } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

const WIDTH = 1600;
const HEIGHT = 900;

// Property Controls for Framer
addPropertyControls(Home, {
  textureMap: {
      type: ControlType.ResponsiveImage,
      title: "Texture Map",
      description: "The main texture image for the 3D scan effect",
  },
  depthMap: {
      type: ControlType.ResponsiveImage,
      title: "Depth Map",
      description:
          "The depth map image that controls the 3D displacement effect",
  },
})


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
  progress,
  textureMap,
  depthMap
}: SceneProps & { textureMap?: any; depthMap?: any }) => {
  const { setIsLoading } = useContext(GlobalContext);
  const materialRef = useRef<Mesh>(null);

  // Convert Framer image objects to URLs
  const textureMapUrl = textureMap?.src || textureMap || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlPC90ZXh0Pjwvc3ZnPg==";
  const depthMapUrl = depthMap?.src || depthMap || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzY2NjY2NiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRlcHRoPC90ZXh0Pjwvc3ZnPg==";

  // Load the textures
  const [rawMap, depthMapTexture] = useTexture([textureMapUrl, depthMapUrl], () => {
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
      uniform float uTilingScale;
      uniform float uEffectType;
      uniform float uGradientWidth;
      uniform float uGradientIntensity;
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
        
        // Create flow effect based on progress and depth (SCANNING EFFECT)
        float flow = 1.0 - smoothstep(0.0, 0.02, abs(depth - uProgress));
        
        vec3 mask = vec3(0.0);
        
        if (uEffectType == 0.0) { // Dots effect
          // Create tiling effect with adjustable scale
          vec2 tiledUv = mod(uv * uTilingScale, 2.0) - 1.0;
          float dist = length(tiledUv);
          
          // Create dot pattern with adjustable size
          float brightness = cellNoise(uv * 60.0);
          float dot = smoothstep(uDotSize, uDotSize - 0.01, dist) * brightness;
          
          // Create mask with custom color
          mask = dot * flow * uDotColor * 10.0;
        } else { // Gradient effect
          // Gradient line mode - central band at full opacity, linear falloff
          float exactProgress = abs(depth - uProgress);
          
          // Scale the gradient width to be less sensitive
          float scaledGradientWidth = uGradientWidth * 0.1;
          
          // Check if we're at the current progress band
          bool isCurrentBand = exactProgress <= 0.001;
          
          // Check if we're within the gradient width range
          bool isWithinGradientRange = exactProgress <= scaledGradientWidth;
          
          // Calculate linear interpolation for bands within range
          float normalizedDistance = exactProgress / scaledGradientWidth;
          float interpolatedOpacity = (1.0 - normalizedDistance) * 0.95 + 0.05;
          
          // Set opacity: 1.0 for current band, interpolated for bands within range, 0.0 for others
          float opacity = isCurrentBand ? 1.0 : (isWithinGradientRange ? interpolatedOpacity : 0.0);
          
          // Apply color and intensity
          mask = opacity * uDotColor * uGradientIntensity;
        }
        
        // PURE ADDITIVE BLENDING - Only add the effect, don't affect base image
        // This ensures the base image stays exactly as bright as it should be
        vec3 finalColor = textureColor + mask;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const rgbColor = hexToRgb(dotColor);

    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uProgress: { value: progress },
        uPointer: { value: new Vector2(0.5, 0.5) },
        uTime: { value: 0.0 },
        uTextureMap: { value: rawMap },
        uDepthMap: { value: depthMapTexture },
        uDotSize: { value: dotSize },
        uDotColor: { value: new Vector3(rgbColor.r, rgbColor.g, rgbColor.b) },
        uTilingScale: { value: tilingScale },
        uEffectType: { value: effectType === 'dots' ? 0.0 : 1.0 },
        uGradientWidth: { value: gradientWidth },
        uGradientIntensity: { value: gradientIntensity }
      },
    });
  }, [rawMap, depthMapTexture, setIsLoading, dotSize, dotColor, tilingScale, effectType, gradientWidth, gradientIntensity, progress]); // Add progress to dependencies

  const [w, h] = useAspect(WIDTH, HEIGHT);

  // Animate the progress uniform
  useFrame(({ pointer, clock }) => {
    if (materialRef.current?.material instanceof ShaderMaterial) {
      materialRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.material.uniforms.uPointer.value = pointer;
    }
  });

  // Update uniforms when props change (without recreating material)
  useFrame(() => {
    if (materialRef.current?.material instanceof ShaderMaterial) {
      const material = materialRef.current.material as ShaderMaterial;
      const rgbColor = hexToRgb(dotColor);
      
      material.uniforms.uDotSize.value = dotSize;
      material.uniforms.uDotColor.value = new Vector3(rgbColor.r, rgbColor.g, rgbColor.b);
      material.uniforms.uTilingScale.value = tilingScale;
      material.uniforms.uEffectType.value = effectType === 'dots' ? 0.0 : 1.0;
      material.uniforms.uGradientWidth.value = gradientWidth;
      material.uniforms.uGradientIntensity.value = gradientIntensity;
      material.uniforms.uProgress.value = progress; // Update progress uniform
      
      // Update textures when they're loaded
      if (rawMap && material.uniforms.uTextureMap.value !== rawMap) {
        material.uniforms.uTextureMap.value = rawMap;
      }
      if (depthMapTexture && material.uniforms.uDepthMap.value !== depthMapTexture) {
        material.uniforms.uDepthMap.value = depthMapTexture;
      }
    }
  });

  return (
    <mesh scale={[w, h, 1]} material={material} ref={materialRef}>
      <planeGeometry />
    </mesh>
  );
};

const Html = ({ textureMap, depthMap }: { textureMap?: any; depthMap?: any }) => {
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
            gradientWidth={gradientWidth}
            gradientIntensity={gradientIntensity}
            progress={progress}
            textureMap={textureMap}
            depthMap={depthMap}
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

export default function Home(props: { textureMap?: any; depthMap?: any }) {
  return (
    <ContextProvider>
      <Html textureMap={props.textureMap} depthMap={props.depthMap}></Html>
    </ContextProvider>
  );
}
