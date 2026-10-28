import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float, Text, Sphere, Box, Cone, Octahedron } from '@react-three/drei';
import * as THREE from 'three';
import { GoogleGenAI } from "@google/genai";
import { 
  Fingerprint, 
  Activity, 
  Send, 
  Loader2, 
  Sparkles, 
  RefreshCcw,
  Shapes
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- API Helper ---
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// --- Types ---
type BodyType = 'block' | 'round' | 'sharp';

type AvatarState = {
  color: string;
  animation: 'idle' | 'energetic' | 'resilient' | 'floating' | 'shaking';
  materialType: 'matte' | 'metal' | 'wireframe' | 'glossy';
  bodyType: BodyType;
  message: string;
  emoji: string;
};

// --- 3D Components ---

// Helper to render distinct geometry based on body type
const BodyPart = ({ 
  type, 
  args, 
  material, 
  position, 
  rotation, 
  scale 
}: { 
  type: BodyType; 
  args: any[]; // Geometry args
  material: THREE.Material;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}) => {
  // Normalize visuals: Sharp needs to look spikier, Round needs to look softer
  if (type === 'round') {
    // Approximate box dimensions to sphere/cylinder
    // args[0] is roughly width
    return <Sphere args={[args[0] * 0.6, 32, 32]} material={material} position={position} rotation={rotation} scale={scale} castShadow />;
  }
  if (type === 'sharp') {
    // Use Octahedrons for a crystalline/sharp look
    return <Octahedron args={[args[0] * 0.7, 0]} material={material} position={position} rotation={rotation} scale={scale} castShadow />;
  }
  // Default Block
  return <Box args={[args[0], args[1], args[2]]} material={material} position={position} rotation={rotation} scale={scale} castShadow />;
};

// A procedurally rigged "Construct" (Mannequin)
const TheConstruct = ({ state }: { state: AvatarState }) => {
  const group = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Group>(null);
  const legRRef = useRef<THREE.Group>(null);

  // Material Logic
  const material = useMemo(() => {
    const color = new THREE.Color(state.color);
    if (state.materialType === 'wireframe') {
      return new THREE.MeshBasicMaterial({ color, wireframe: true });
    } else if (state.materialType === 'metal') {
      return new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.8, emissive: color, emissiveIntensity: 0.1 });
    } else if (state.materialType === 'glossy') {
       return new THREE.MeshPhysicalMaterial({ color, roughness: 0.1, metalness: 0.1, transmission: 0.5, thickness: 1 });
    }
    // Matte
    return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.1 });
  }, [state.color, state.materialType]);

  // Animation Logic (The Rigging)
  useFrame((state3d) => {
    const t = state3d.clock.getElapsedTime();
    const anim = state.animation;

    if (group.current && headRef.current && armLRef.current && armRRef.current && legLRef.current && legRRef.current && bodyRef.current) {
      
      // Reset defaults
      group.current.position.y = 0;
      group.current.rotation.y = 0;
      
      if (anim === 'idle') {
        // Breathing
        const breath = Math.sin(t * 1) * 0.05;
        bodyRef.current.scale.y = 1 + breath * 0.2;
        group.current.position.y = breath * 0.5;
        
        // Slight sway
        armLRef.current.rotation.z = 0.2 + Math.sin(t * 1.5) * 0.1;
        armRRef.current.rotation.z = -0.2 - Math.sin(t * 1.5) * 0.1;
        
        headRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
      }
      
      else if (anim === 'energetic') {
        // Jumping/Bouncing
        const jump = Math.abs(Math.sin(t * 5)) * 0.5;
        group.current.position.y = jump;
        
        // Arms waving
        armLRef.current.rotation.z = 2.5 + Math.sin(t * 8) * 0.5;
        armRRef.current.rotation.z = -2.5 - Math.sin(t * 8) * 0.5;
        
        // Head banging
        headRef.current.rotation.x = Math.sin(t * 10) * 0.2;
      }
      
      else if (anim === 'resilient') {
        // Strong stance, minimal movement, grounded
        group.current.position.y = 0;
        legLRef.current.position.x = -0.4;
        legRRef.current.position.x = 0.4;
        legLRef.current.rotation.z = 0.1;
        legRRef.current.rotation.z = -0.1;
        
        // "Bring it on" arms
        armLRef.current.rotation.z = 0.5;
        armRRef.current.rotation.z = -0.5;
        
        // Slow confident breathing
        const breath = Math.sin(t * 0.5) * 0.02;
        bodyRef.current.scale.set(1.1, 1 + breath, 1.1);
      }

      else if (anim === 'floating') {
        // Zero gravity
        group.current.position.y = 1 + Math.sin(t * 0.5) * 0.5;
        group.current.rotation.y = Math.sin(t * 0.2) * 0.5;
        group.current.rotation.z = Math.sin(t * 0.3) * 0.1;

        armLRef.current.rotation.z = 1 + Math.sin(t) * 0.2;
        armRRef.current.rotation.z = -1 - Math.sin(t) * 0.2;
        
        legLRef.current.rotation.x = 0.5 + Math.sin(t * 0.5) * 0.2;
        legRRef.current.rotation.x = 0.5 - Math.sin(t * 0.5) * 0.2;
      }

      else if (anim === 'shaking') {
        // Nervous/Glitchy
        group.current.position.x = (Math.random() - 0.5) * 0.1;
        headRef.current.rotation.y = (Math.random() - 0.5) * 0.5;
        armLRef.current.rotation.z = (Math.random()) * 0.5;
        bodyRef.current.rotation.z = (Math.random() - 0.5) * 0.1;
      }
    }
  });

  return (
    <group ref={group} dispose={null}>
      {/* Floating Emoji Mood */}
      <Text 
        position={[0, 2.8, 0]} 
        fontSize={0.8} 
        outlineWidth={0.02} 
        outlineColor="white"
      >
        {state.emoji}
      </Text>

      {/* Head Group */}
      <group ref={headRef} position={[0, 1.75, 0]}>
         <BodyPart type={state.bodyType} args={[0.5, 0.5, 0.5]} material={material} />
      </group>
      
      {/* Body Group */}
      <group ref={bodyRef} position={[0, 1, 0]}>
         <BodyPart type={state.bodyType} args={[0.8, 1, 0.5]} material={material} />
      </group>
      
      {/* Left Arm Group (Pivots at shoulder) */}
      <group ref={armLRef} position={[-0.5, 1.4, 0]}>
         <BodyPart type={state.bodyType} args={[0.25, 0.9, 0.25]} material={material} position={[0, -0.4, 0]} />
      </group>

      {/* Right Arm Group */}
      <group ref={armRRef} position={[0.5, 1.4, 0]}>
         <BodyPart type={state.bodyType} args={[0.25, 0.9, 0.25]} material={material} position={[0, -0.4, 0]} />
      </group>

      {/* Left Leg Group */}
      <group ref={legLRef} position={[-0.25, 0.5, 0]}>
         <BodyPart type={state.bodyType} args={[0.3, 0.9, 0.3]} material={material} position={[0, -0.45, 0]} />
      </group>

      {/* Right Leg Group */}
      <group ref={legRRef} position={[0.25, 0.5, 0]}>
         <BodyPart type={state.bodyType} args={[0.3, 0.9, 0.3]} material={material} position={[0, -0.45, 0]} />
      </group>
    </group>
  );
};

// --- Main Application ---

const TheExistentialMirror = () => {
  const [affirmation, setAffirmation] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>({
    color: "#6366f1",
    animation: "idle",
    materialType: "matte",
    bodyType: "block",
    message: "I am ready to be.",
    emoji: "⚡"
  });

  const generateAvatar = async () => {
    if (!affirmation.trim()) return;
    setIsGenerating(true);

    try {
      const ai = getAI();
      const prompt = `
        You are an ontological engine. Your job is to translate a user's "affirmation of existence" into a 3D avatar.
        
        User Affirmation: "${affirmation}"

        Analyze the sentiment, energy, and stability of this affirmation.
        Return a valid JSON object ONLY, no markdown, with these keys:
        - color: a hex string representing the emotion (e.g. #ff0000 passion, #00ff00 growth, #60a5fa calm, #facc15 joy).
        - animation: one of ["idle", "energetic", "resilient", "floating", "shaking"].
        - materialType: one of ["matte", "metal", "wireframe", "glossy"]. (Use glossy for happy/slick, metal for strong/rigid, matte for grounded).
        - bodyType: one of ["block", "round", "sharp"]. 
          - "block" for stable, grounded, human, neutral.
          - "round" for soft, fluid, kind, happy, flowing.
          - "sharp" for intense, angry, precise, dangerous, energetic.
        - emoji: A single emoji char that best fits the mood.
        - message: A short (5 words max) poetic echo of their affirmation.
      `;

      // Use a text-optimized model that supports JSON mode for structured data extraction
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: 'application/json' }
      });

      const data = JSON.parse(response.text || '{}');
      
      setAvatarState({
        color: data.color || "#6366f1",
        animation: data.animation || "idle",
        materialType: data.materialType || "matte",
        bodyType: data.bodyType || "block",
        message: data.message || "I exist.",
        emoji: data.emoji || "✨"
      });

    } catch (e) {
      console.error(e);
      // Fallback
      setAvatarState(prev => ({ ...prev, animation: 'shaking', message: "Connection disrupted.", emoji: "🔌" }));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col md:flex-row font-sans text-white overflow-hidden">
      
      {/* LEFT: THE MIRROR (3D Viewport) */}
      <div className="flex-1 relative h-[50vh] md:h-full bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-slate-400 text-xs uppercase tracking-widest">
          <Activity size={14} />
          <span>Ontological Projection</span>
        </div>
        
        <Canvas shadows camera={{ position: [0, 2, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[5, 10, 5]} angle={0.5} penumbra={1} intensity={100} castShadow shadow-bias={-0.0001} />
          
          {/* Procedural Environment to replace failing HDR fetch */}
          <Environment resolution={256}>
             <group rotation={[-Math.PI / 2, 0, 0]}>
               <mesh scale={100}>
                 <sphereGeometry args={[1, 64, 64]} />
                 <meshBasicMaterial color="#222" side={THREE.BackSide} />
               </mesh>
             </group>
          </Environment>

          <Float speed={avatarState.animation === 'floating' ? 2 : 0} rotationIntensity={0} floatIntensity={0}>
             <TheConstruct state={avatarState} />
          </Float>

          <ContactShadows resolution={1024} scale={10} blur={2} opacity={0.5} far={10} color="#000000" />
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} />
        </Canvas>

        {/* Dynamic Label in 3D Space Overlay */}
        <div className="absolute bottom-8 w-full text-center pointer-events-none">
          <motion.div
            key={avatarState.message}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-2 bg-black/30 backdrop-blur-md rounded-full text-sm font-medium border border-white/10"
          >
            {avatarState.message}
          </motion.div>
        </div>
      </div>

      {/* RIGHT: THE WILL (Input Interface) */}
      <div className="w-full md:w-[400px] bg-slate-950 border-l border-slate-800 p-8 flex flex-col z-20 shadow-2xl">
        
        <div className="mb-8">
          <h1 className="text-xl font-bold flex items-center gap-3 text-indigo-400">
            <Fingerprint size={24} />
            The Existential Mirror
          </h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            "Self Affirms Existence." <br/>
            This engine translates your internal will into external form. Speak your state of being, and the construct will embody it.
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-6">
          
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Current Affirmation
            </label>
            <textarea 
              value={affirmation}
              onChange={(e) => setAffirmation(e.target.value)}
              placeholder="e.g., I am flowing like water..."
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-700"
            />
          </div>

          <button
            onClick={generateAvatar}
            disabled={isGenerating || !affirmation.trim()}
            className={`
              w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
              ${isGenerating 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/20 active:scale-95'}
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Materializing...
              </>
            ) : (
              <>
                <Send size={18} />
                Manifest
              </>
            )}
          </button>

          {/* Current DNA Readout */}
          <div className="pt-6 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
                 <Shapes size={16} className="text-slate-500" />
                 <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Form</span>
                    <span className="text-sm capitalize text-indigo-200">{avatarState.bodyType}</span>
                 </div>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
                 <div className="text-xl">{avatarState.emoji}</div>
                 <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Mood</span>
                    <span className="text-sm capitalize text-indigo-200">{avatarState.animation}</span>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Material</span>
                <span className="text-sm capitalize text-indigo-200">{avatarState.materialType}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col justify-center">
                 <span className="text-[10px] text-slate-500 uppercase block mb-1">Spectral Sig</span>
                 <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: avatarState.color }} />
                    <span className="text-xs font-mono text-slate-400">{avatarState.color}</span>
                 </div>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-auto pt-6 text-center">
          <button 
            onClick={() => setAvatarState({ color: '#ffffff', animation: 'idle', materialType: 'wireframe', bodyType: 'block', message: "Reset.", emoji: "🔄" })}
            className="text-slate-600 hover:text-slate-400 text-xs flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <RefreshCcw size={10} />
            Reset Construct
          </button>
        </div>

      </div>

    </div>
  );
};

const App = () => {
  return <TheExistentialMirror />;
};

export default App;
