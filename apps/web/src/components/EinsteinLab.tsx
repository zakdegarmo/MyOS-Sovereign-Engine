import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture, Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';

// The main character component
const EinsteinCharacter = ({ message }: { message: string }) => {
  const bodyRef = useRef<THREE.Group>(null);
  const baseTexture = useTexture('/assets/einstein/einstein_base.png');
  const [isTalking, setIsTalking] = useState(false);

  useEffect(() => {
    if (message) {
      setIsTalking(true);
      const timeout = setTimeout(() => setIsTalking(false), 3000); // Talk for 3s
      return () => clearTimeout(timeout);
    }
  }, [message]);

  // Give him a slight bob/wobble when talking since we skipped the jaw
  useFrame(({ clock }) => {
    if (bodyRef.current) {
      if (isTalking) {
        bodyRef.current.position.y = 1 + Math.sin(clock.elapsedTime * 15) * 0.05;
        bodyRef.current.rotation.z = Math.sin(clock.elapsedTime * 10) * 0.02;
      } else {
        bodyRef.current.position.y = 1; 
        bodyRef.current.rotation.z = 0;
      }
    }
  });

  return (
    <group ref={bodyRef} position={[0, 1, 0]}>
      {/* Full Body */}
      <Billboard>
        <mesh>
          <planeGeometry args={[3, 4]} />
          <meshBasicMaterial map={baseTexture} transparent alphaTest={0.5} />
        </mesh>
      </Billboard>

      {/* Thought/Speech Bubble */}
      {message && (
        <Html position={[1.5, 1.5, 0]} center>
          <div style={{
            background: 'white',
            border: '2px solid black',
            borderRadius: '20px',
            padding: '15px',
            maxWidth: '250px',
            fontFamily: 'comic sans ms, sans-serif',
            color: 'black',
            position: 'relative',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.2)'
          }}>
            {message}
            <div style={{
              position: 'absolute',
              bottom: '-10px',
              left: '20px',
              width: '0',
              height: '0',
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '10px solid black'
            }} />
          </div>
        </Html>
      )}
    </group>
  );
};

// A random alchemy prop scattered in the lab
const AlchemyProp = ({ url, position }: { url: string, position: [number, number, number] }) => {
  const texture = useTexture(url);
  return (
    <Billboard position={position}>
      <mesh>
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.5} />
      </mesh>
    </Billboard>
  );
};

export const EinsteinLab = () => {
  const [experiment, setExperiment] = useState("What if you rode a beam of light, my friend?");
  
  return (
    <div style={{ width: '100%', height: '100vh', background: '#2c3e50', position: 'relative' }}>
      <Canvas camera={{ position: [0, 1.5, 5], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {/* The Desk */}
        <mesh position={[0, -0.5, 1]}>
          <boxGeometry args={[6, 1, 1.5]} />
          <meshStandardMaterial color="#4a3b2c" />
        </mesh>

        <EinsteinCharacter message={experiment} />

        {/* Scattered Alchemy Props from our auto-slicer! */}
        <AlchemyProp url="/assets/billboards/alchemy/alchemy_part_0.png" position={[-1.5, 0.3, 1]} />
        <AlchemyProp url="/assets/billboards/alchemy/alchemy_part_1.png" position={[-0.8, 0.3, 1.2]} />
        <AlchemyProp url="/assets/billboards/alchemy/alchemy_part_2.png" position={[1.2, 0.3, 1.1]} />
        <AlchemyProp url="/assets/billboards/alchemy/alchemy_part_3.png" position={[1.8, 0.3, 1]} />
      </Canvas>

      {/* Lab UI Overlay */}
      <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Pose a thought experiment..." 
          style={{ width: '500px', padding: '15px', borderRadius: '8px', border: 'none', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
              setExperiment("Ah! " + e.currentTarget.value + "... fascinating!");
              e.currentTarget.value = '';
            }
          }}
        />
      </div>
    </div>
  );
};
