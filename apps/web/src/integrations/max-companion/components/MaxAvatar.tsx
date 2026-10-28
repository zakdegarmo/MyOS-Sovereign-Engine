import React, { useEffect, useState } from 'react';
import { MaxState } from '../types';

interface MaxAvatarProps {
  state: MaxState;
}

// Using a placeholder that we will heavily stylize to look like 80s CGI
const BASE_IMAGE = "https://picsum.photos/400/400?grayscale"; 

export const MaxAvatar: React.FC<MaxAvatarProps> = ({ state }) => {
  const [glitchIntensity, setGlitchIntensity] = useState(0);

  // Random glitch logic
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly glitch heavily
      if (Math.random() > 0.9) {
        setGlitchIntensity(2); // Major glitch
        setTimeout(() => setGlitchIntensity(0), 200);
      } else if (Math.random() > 0.7) {
        setGlitchIntensity(1); // Minor glitch
        setTimeout(() => setGlitchIntensity(0), 100);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync glitch with speaking state
  useEffect(() => {
    if (state === MaxState.SPEAKING) {
       const talkInterval = setInterval(() => {
         setGlitchIntensity(prev => (prev === 0 ? 1 : 0));
       }, 150);
       return () => clearInterval(talkInterval);
    }
  }, [state]);

  const getClipPath = () => {
    if (glitchIntensity === 2) {
      return 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)'; 
      // In a real implementation we would dynamically generate complex polygons
    }
    return 'none';
  };

  return (
    <div className="relative w-full h-full bg-max-yellow overflow-hidden border-4 border-black shadow-[0_0_20px_rgba(244,229,0,0.5)]">
      {/* 80s Geometric Background */}
      <div className={`absolute inset-0 bg-max-yellow transition-transform duration-100 ${glitchIntensity > 0 ? 'translate-x-2' : ''}`}>
         <div className="absolute inset-0 opacity-20" 
              style={{ 
                backgroundImage: 'linear-gradient(0deg, transparent 24%, #000 25%, #000 26%, transparent 27%, transparent 74%, #000 75%, #000 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #000 25%, #000 26%, transparent 27%, transparent 74%, #000 75%, #000 76%, transparent 77%, transparent)',
                backgroundSize: '50px 50px' 
              }} 
         />
      </div>

      {/* The "Head" - heavily filtered image to approximate the look */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`relative w-48 h-48 transition-all duration-75 
          ${glitchIntensity === 1 ? 'scale-105 skew-x-6 hue-rotate-90' : ''}
          ${glitchIntensity === 2 ? 'scale-90 -skew-y-12 invert' : ''}
        `}>
          {/* Main Face Layer */}
          <img 
            src={BASE_IMAGE} 
            alt="Max" 
            className="w-full h-full object-cover mix-blend-multiply contrast-200 brightness-110 grayscale"
            style={{ clipPath: getClipPath() }}
          />
          
          {/* Sunglasses (CSS Shapes) */}
          <div className="absolute top-[40%] left-[15%] w-[70%] h-[20%] bg-black rotate-[-2deg] z-10 shadow-lg">
             <div className="absolute top-0 left-0 w-full h-full bg-black skew-x-[-10deg]"></div>
          </div>
          
          {/* Glitch Layer Red */}
          {glitchIntensity > 0 && (
            <img 
              src={BASE_IMAGE} 
              className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-70 translate-x-1"
              style={{ filter: 'drop-shadow(2px 0 red)' }}
            />
          )}
           {/* Glitch Layer Blue */}
           {glitchIntensity > 1 && (
            <img 
              src={BASE_IMAGE} 
              className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-70 -translate-x-1"
              style={{ filter: 'drop-shadow(-2px 0 blue)' }}
            />
          )}
        </div>
      </div>

      {/* Text Overlay (simulating closed captions or broadcast text) */}
      <div className="absolute bottom-2 left-2 right-2 font-mono text-xs text-black bg-max-yellow px-1 opacity-80">
        NET 23 :: SIGNAL_STRENGTH: {glitchIntensity > 0 ? 'LOW' : 'OPTIMAL'}
      </div>
    </div>
  );
};
