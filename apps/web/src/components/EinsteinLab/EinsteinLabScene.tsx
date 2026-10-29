import React, { useState } from 'react';
import { Billboard, useTexture, Html } from '@react-three/drei';
import { AutonomousEinstein } from './AutonomousEinstein';

// A random alchemy prop scattered in the lab
const AlchemyProp = ({ url, position }: { url: string, position: [number, number, number] }) => {
  const texture = useTexture(url);
  return (
    <Billboard position={position}>
      <mesh>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.5} />
      </mesh>
    </Billboard>
  );
};

export const EinsteinLabScene = () => {
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
      if (inputText.trim() !== '') {
          (window as any).sendToEinstein?.(inputText);
          setInputText("");
      }
  };

  return (
    <group>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {/* The Desk */}
        <mesh position={[0, -0.5, 2]}>
          <boxGeometry args={[8, 1, 2]} />
          <meshStandardMaterial color="#4a3b2c" />
        </mesh>

        <AutonomousEinstein position={[0, 1, -1]} />

        {/* Scattered Alchemy Props from our auto-slicer! */}
        <AlchemyProp url="/assets/billboards/alchemy/alchemy_part_0.png" position={[-2.5, 0.5, 2]} />
        <AlchemyProp url="/assets/billboards/alchemy/alchemy_part_1.png" position={[-1.0, 0.5, 2.2]} />
        <AlchemyProp url="/assets/billboards/alchemy/alchemy_part_2.png" position={[1.5, 0.5, 2.1]} />
        <AlchemyProp url="/assets/billboards/alchemy/alchemy_part_3.png" position={[2.8, 0.5, 2]} />

        {/* UI Overlay for talking to Einstein */}
        <Html fullscreen zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', display: 'flex', gap: '10px' }}>
                <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Pose a thought experiment to Albert..." 
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSend();
                    }}
                    style={{ 
                        width: '500px', 
                        padding: '15px 20px', 
                        borderRadius: '30px', 
                        border: '2px solid rgba(6, 182, 212, 0.5)', 
                        background: 'rgba(0, 0, 0, 0.8)', 
                        color: '#22d3ee',
                        outline: 'none',
                        fontFamily: 'monospace',
                        boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)'
                    }}
                />
            </div>
        </Html>
    </group>
  );
};
