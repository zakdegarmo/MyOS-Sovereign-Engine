import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import * as Tone from 'tone';
import { GoogleGenAI } from "@google/genai";
import { 
  Play, 
  Square, 
  Wand2, 
  Activity,
  Trash2,
  Send,
  Music,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
  Repeat,
  Eraser,
  Dices,
  Globe,
  Sliders
} from 'lucide-react';

// --- CONFIGURATION ---

const BARS = 8;
const STEPS_PER_BAR = 16;
const STEPS = BARS * STEPS_PER_BAR; // 128 Steps

// Musical Constants
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES: { [key: string]: number[] } = {
    'Chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    'Major': [0, 2, 4, 5, 7, 9, 11],
    'Minor': [0, 2, 3, 5, 7, 8, 10],
    'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
    'Pentatonic Major': [0, 2, 4, 7, 9],
    'Pentatonic Minor': [0, 3, 5, 7, 10],
    'Dorian': [0, 2, 3, 5, 7, 9, 10],
    'Phrygian': [0, 1, 3, 5, 7, 8, 10],
    'Lydian': [0, 2, 4, 6, 7, 9, 11],
    'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
    'Locrian': [0, 1, 3, 5, 6, 8, 10],
};

// Helper to generate chromatic notes for a range
const getNotes = (startOctave: number, endOctave: number) => {
    const notes = [];
    const names = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
    for (let i = endOctave; i >= startOctave; i--) {
        for (const name of names) {
            notes.push(`${name}${i}`);
        }
    }
    return notes;
};

// Expanded Ranges (3 Octaves each)
const VIOLIN_NOTES = getNotes(4, 6); // C4 to B6
const FLUTE_NOTES = getNotes(4, 6);  // C4 to B6
const BRASS_NOTES = getNotes(2, 4);  // C2 to B4
const CELLO_NOTES = getNotes(1, 3);  // C1 to B3
const DRUMS = ['Timpani', 'Crash', 'Ride', 'Open Hat', 'Closed Hat', 'Snare', 'Kick'];

const SYSTEM_PROMPT = `
You are a Maestro AI capable of conducting a digital orchestra. You specialize in "Genre Fusion" — taking two disparate musical styles and mixing them orchestrally.
You have access to Google Search. Use it to look up the Key, BPM, and Note Patterns of specific songs requested by the user.

The sequencer is MASSIVE: 128 STEPS (8 Bars).
It has 5 tracks with expanded ranges (3 Octaves):
1. VIOLINS: 36 rows (3 Octaves).
2. FLUTES: 36 rows (3 Octaves).
3. BRASS: 36 rows (3 Octaves).
4. CELLOS: 36 rows (3 Octaves).
5. PERCUSSION: 7 rows.

STRATEGY:
- STRICTLY ADHERE to the user's requested Key/Scale if provided.
- Utilize the full 128 steps.
- Use the 3-octave range for cinematic voicing.
- Structure: Bars 1-4 Intro/Build, Bars 5-8 Drop/Theme.

VALID SCALES: "Major", "Minor", "Harmonic Minor", "Pentatonic Major", "Pentatonic Minor", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Locrian", "Chromatic".

Response Schema:
{
  "violins": [[0/1...], ...], 
  "flutes": [[0/1...], ...], 
  "brass": [[0/1...], ...], 
  "cellos": [[0/1...], ...], 
  "percussion": [[0/1...], ...], 
  "bpm": number,
  "key": "C",
  "scale": "Minor",
  "message": "Maestro's comment",
  "shape": "TORUS" | "DODECAHEDRON" | "SPHERE" | "CHAOS"
}
`;

// --- TYPES ---

type Grid = boolean[][];

interface SequencerState {
  violins: Grid;
  flutes: Grid;
  brass: Grid;
  cellos: Grid;
  percussion: Grid;
}

interface MixerState {
    violins: { vol: number; mute: boolean; solo: boolean };
    flutes: { vol: number; mute: boolean; solo: boolean };
    brass: { vol: number; mute: boolean; solo: boolean };
    cellos: { vol: number; mute: boolean; solo: boolean };
    percussion: { vol: number; mute: boolean; solo: boolean };
}

interface ChatMessage {
    role: 'user' | 'ai';
    text: string;
    sources?: { title: string; uri: string }[];
}

type LoopRegion = 'ALL' | number | '1-4' | '5-8';

// --- AUDIO ENGINE ---

class AudioEngine {
  violins: Tone.PolySynth;
  flutes: Tone.PolySynth;
  brass: Tone.PolySynth;
  cellos: Tone.PolySynth;
  percussion: { [key: string]: Tone.MembraneSynth | Tone.MetalSynth | Tone.NoiseSynth | Tone.PluckSynth };
  analyser: Tone.Analyser;
  sequence: Tone.Sequence | null = null;
  isPlaying: boolean = false;
  
  channels: { [key: string]: Tone.Channel } = {};

  constructor() {
    const masterLimiter = new Tone.Limiter(-1).toDestination();

    // Create Channels
    this.channels.violins = new Tone.Channel({ volume: -12 }).connect(masterLimiter);
    this.channels.flutes = new Tone.Channel({ volume: -10 }).connect(masterLimiter);
    this.channels.brass = new Tone.Channel({ volume: -12 }).connect(masterLimiter);
    this.channels.cellos = new Tone.Channel({ volume: -10 }).connect(masterLimiter);
    this.channels.percussion = new Tone.Channel({ volume: -6 }).connect(masterLimiter);

    // VIOLINS
    this.violins = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatsawtooth" },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 1.5 },
      maxPolyphony: 32
    }).connect(this.channels.violins);
    const violinReverb = new Tone.Reverb(3).connect(this.channels.violins);
    this.violins.connect(violinReverb);

    // FLUTES
    this.flutes = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.5 },
      maxPolyphony: 32
    }).connect(this.channels.flutes);
    const fluteDelay = new Tone.FeedbackDelay("8n", 0.4).connect(this.channels.flutes);
    this.flutes.connect(fluteDelay);

    // BRASS
    this.brass = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1,
      modulationIndex: 10,
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.5 },
      modulation: { type: "sine" },
      modulationEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.5 },
      maxPolyphony: 32
    }).connect(this.channels.brass);

    // CELLOS
    this.cellos = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.2, decay: 0.3, sustain: 0.6, release: 1.2 },
      maxPolyphony: 32
    }).connect(this.channels.cellos);
    const lowPass = new Tone.Filter(800, "lowpass").connect(this.channels.cellos);
    this.cellos.connect(lowPass);

    // PERCUSSION
    this.percussion = {
      Timpani: new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4, envelope: { attack: 0.001, decay: 0.4, sustain: 0 } }).connect(this.channels.percussion),
      Snare: new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 2, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).connect(this.channels.percussion),
      ClosedHat: new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(this.channels.percussion),
      OpenHat: new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.5, release: 0.1 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(this.channels.percussion),
      Ride: new Tone.MetalSynth({ frequency: 300, envelope: { attack: 0.001, decay: 1.2, release: 0.2 }, harmonicity: 5.1, modulationIndex: 16, resonance: 3000, octaves: 1 }).connect(this.channels.percussion),
      Crash: new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 1.4, release: 0.2 }, harmonicity: 5.1, modulationIndex: 64, resonance: 4000, octaves: 1.5 }).connect(this.channels.percussion),
      Kick: new Tone.MembraneSynth({ envelope: { sustain: 0, attack: 0.02, decay: 0.8 }, octaves: 10 }).connect(this.channels.percussion)
    };

    this.analyser = new Tone.Analyser("fft", 128); // Lower FFT size for snappier visuals
    Tone.Destination.connect(this.analyser);
    
    // Default Loop
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = "8m"; 
  }

  setLoop(region: LoopRegion) {
      Tone.Transport.stop();
      if (region === 'ALL') {
          Tone.Transport.loopStart = 0;
          Tone.Transport.loopEnd = "8m";
          Tone.Transport.position = 0;
      } else if (region === '1-4') {
          Tone.Transport.loopStart = 0;
          Tone.Transport.loopEnd = "4m";
          Tone.Transport.position = 0;
      } else if (region === '5-8') {
          Tone.Transport.loopStart = "4m";
          Tone.Transport.loopEnd = "8m";
          Tone.Transport.position = "4m";
      } else if (typeof region === 'number') {
          const barIndex = region - 1;
          Tone.Transport.loopStart = `${barIndex}:0:0`;
          Tone.Transport.loopEnd = `${barIndex + 1}:0:0`;
          Tone.Transport.position = `${barIndex}:0:0`;
      }
      if (this.isPlaying) Tone.Transport.start();
  }

  updateMixer(state: MixerState) {
      const keys = Object.keys(state) as Array<keyof MixerState>;
      const anySolo = keys.some(k => state[k].solo);
      keys.forEach(key => {
          const chState = state[key];
          const ch = this.channels[key];
          if (ch) {
            ch.volume.value = chState.vol;
            ch.mute = chState.mute || (anySolo && !chState.solo);
          }
      });
  }

  start() {
    if (Tone.context.state !== 'running') Tone.context.resume();
    Tone.start();
    Tone.Transport.start();
    this.isPlaying = true;
  }

  stop() {
    Tone.Transport.stop();
    this.isPlaying = false;
  }

  updateSequence(state: SequencerState, onStep: (step: number) => void) {
    if (this.sequence) this.sequence.dispose();

    this.sequence = new Tone.Sequence((time, step) => {
      onStep(step);

      const triggerRows = (rows: boolean[][], synth: Tone.PolySynth, noteList: string[]) => {
          rows.forEach((row, rIdx) => {
              if (row[step]) synth.triggerAttackRelease(noteList[rIdx], "16n", time);
          });
      };

      triggerRows(state.violins, this.violins, VIOLIN_NOTES);
      triggerRows(state.flutes, this.flutes, FLUTE_NOTES);
      triggerRows(state.brass, this.brass, BRASS_NOTES);
      triggerRows(state.cellos, this.cellos, CELLO_NOTES);

      if (state.percussion[0][step]) this.percussion.Timpani.triggerAttackRelease("G2", "16n", time);
      if (state.percussion[1][step]) this.percussion.Crash.triggerAttackRelease(200, "32n", time);
      if (state.percussion[2][step]) this.percussion.Ride.triggerAttackRelease(300, "16n", time);
      if (state.percussion[3][step]) this.percussion.OpenHat.triggerAttackRelease(200, "16n", time);
      if (state.percussion[4][step]) this.percussion.ClosedHat.triggerAttackRelease(200, "32n", time);
      if (state.percussion[5][step]) this.percussion.Snare.triggerAttackRelease("C2", "16n", time);
      if (state.percussion[6][step]) this.percussion.Kick.triggerAttackRelease("C1", "16n", time);

    }, Array.from(Array(STEPS).keys()), "16n").start(0);
  }
}

// --- VISUALIZER COMPONENT (THREE.JS) ---

const Visualizer = ({ audioRef, shapeType }: { audioRef: React.MutableRefObject<AudioEngine | null>, shapeType: string }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508); 
    scene.fog = new THREE.FogExp2(0x050508, 0.05);

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const PARTICLE_COUNT = 6000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const randoms = new Float32Array(PARTICLE_COUNT);

    const color1 = new THREE.Color(0xd97706); // Amber
    const color2 = new THREE.Color(0x06b6d4); // Cyan
    const color3 = new THREE.Color(0xf43f5e); // Rose

    for(let i=0; i<PARTICLE_COUNT; i++) {
        const x = (Math.random() - 0.5) * 80;
        const y = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        positions[i*3] = x;
        positions[i*3+1] = y;
        positions[i*3+2] = z;
        originalPositions[i*3] = x;
        originalPositions[i*3+1] = y;
        originalPositions[i*3+2] = z;
        
        randoms[i] = Math.random();

        const c = Math.random() < 0.33 ? color1 : (Math.random() < 0.5 ? color2 : color3);
        colors[i*3] = c.r; 
        colors[i*3+1] = c.g; 
        colors[i*3+2] = c.b; 
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

    const material = new THREE.PointsMaterial({ 
        size: 0.2, 
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const getTargetPos = (type: string, i: number, total: number, time: number) => {
        const t = i / total;
        const rand = randoms[i];
        
        if (type === 'SPHERE') {
            const phi = Math.acos(-1 + (2 * i) / total);
            const theta = Math.sqrt(total * Math.PI) * phi + time * 0.1;
            const r = 15 + Math.sin(time * 2 + i * 0.01) * 2;
            return { x: r * Math.cos(theta) * Math.sin(phi), y: r * Math.sin(theta) * Math.sin(phi), z: r * Math.cos(phi) };
        } else if (type === 'TORUS') {
            const u = t * Math.PI * 2 * 12 + time * 0.2; 
            const v = t * Math.PI * 2 + time * 0.1;
            const R = 12; const r = 4 + Math.sin(time + i * 0.001);
            return { x: (R + r * Math.cos(v)) * Math.cos(u), y: (R + r * Math.cos(v)) * Math.sin(u), z: r * Math.sin(v) };
        } else if (type === 'DODECAHEDRON') {
             const phi = Math.acos(-1 + (2 * i) / total);
             const theta = Math.sqrt(total * Math.PI) * phi;
             const r = 16 + Math.sin(time * 3 + rand * 10) * 1;
             return { 
                 x: r * Math.cos(theta) * Math.sin(phi) * (0.8 + rand*0.4), 
                 y: r * Math.sin(theta) * Math.sin(phi) * (0.8 + rand*0.4), 
                 z: r * Math.cos(phi) * (0.8 + rand*0.4) 
             };
        }
        // Chaos / Cloud
        return { 
            x: originalPositions[i*3] + Math.sin(time + rand*10) * 5, 
            y: originalPositions[i*3+1] + Math.cos(time*0.8 + rand*20) * 5, 
            z: originalPositions[i*3+2] + Math.sin(time*0.5 + rand*15) * 5
        };
    };

    let time = 0;
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.01;

      particles.rotation.y += 0.001;
      particles.rotation.z += 0.0005;

      let freqData: Float32Array | null = null;
      let bassEnergy = 0;

      if (audioRef.current && audioRef.current.isPlaying) {
          try { 
              freqData = audioRef.current.analyser.getValue() as Float32Array; 
              // Simple bass energy estimation (first few bins)
              if (freqData.length > 10) {
                 for(let k=0; k<5; k++) bassEnergy += (freqData[k] + 100);
                 bassEnergy = Math.max(0, bassEnergy / 500); // Normalize roughly 0-1
              }
          } catch(e) {}
      }

      // Pulse camera or object based on bass
      // Boosted pulse factor for more excitement
      const pulse = 1 + bassEnergy * 0.4;
      particles.scale.setScalar(pulse);

      const pos = geometry.attributes.position.array as Float32Array;
      const col = geometry.attributes.color.array as Float32Array;
      
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const target = getTargetPos(shapeType, i, PARTICLE_COUNT, time);
        const lerpFactor = 0.05;
        
        // Move towards target shape
        originalPositions[i*3] += (target.x - originalPositions[i*3]) * lerpFactor;
        originalPositions[i*3+1] += (target.y - originalPositions[i*3+1]) * lerpFactor;
        originalPositions[i*3+2] += (target.z - originalPositions[i*3+2]) * lerpFactor;

        // Audio reactivity displacement
        let displace = 0;
        if (freqData) {
            const idx = Math.floor((i / PARTICLE_COUNT) * freqData.length);
            const db = freqData[idx]; 
            const norm = Math.max(0, (db + 100) / 100);
            displace = norm * norm * 6.0; // Increased displacement factor
            
            // Color shift on loud frequencies
            if (norm > 0.75) {
                col[i*3] = 1; col[i*3+1] = 1; col[i*3+2] = 1; // Flash white
            } else {
                 // Return to base color (simplified, just drifting back to amber/cyan mix)
                 col[i*3] = Math.max(col[i*3] - 0.02, 0.2);
                 col[i*3+1] = Math.max(col[i*3+1] - 0.02, 0.2);
                 col[i*3+2] = Math.max(col[i*3+2] - 0.02, 0.2);
            }
        }

        const x = originalPositions[i*3];
        const y = originalPositions[i*3+1];
        const z = originalPositions[i*3+2];
        
        // Normalize vector for displacement direction
        const len = Math.sqrt(x*x + y*y + z*z) || 1;
        
        pos[i*3] = x + (x/len) * displace;
        pos[i*3+1] = y + (y/len) * displace;
        pos[i*3+2] = z + (z/len) * displace;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();
    const resizeObserver = new ResizeObserver(() => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(frameId);
      if (container && container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [shapeType]);

  return <div ref={mountRef} className="w-full h-full bg-[#050508]" />;
};

// --- SUB-COMPONENTS ---

// Reusable Track Component
const InstrumentTrack = ({ 
    name, 
    notes, 
    grid, 
    onToggle, 
    currentStep, 
    colorClass,
    shadowClass,
    icon,
    trackKey,
    mixerState,
    updateMixer,
    clearTrack,
    randomizeTrack,
    loopRegion,
    selectedKey,
    selectedScale
}: { 
    name: string, 
    notes?: string[], 
    grid: boolean[][], 
    onToggle: (r: number, c: number) => void, 
    currentStep: number,
    colorClass: string,
    shadowClass: string,
    icon: React.ReactNode,
    trackKey: keyof MixerState,
    mixerState: MixerState,
    updateMixer: (k: keyof MixerState, field: string, val: any) => void,
    clearTrack: (k: keyof SequencerState) => void,
    randomizeTrack: (k: keyof SequencerState) => void,
    loopRegion: LoopRegion,
    selectedKey: string,
    selectedScale: string
}) => {
    const { vol, mute, solo } = mixerState[trackKey];

    const isInLoop = (stepIdx: number) => {
        if (loopRegion === 'ALL') return true;
        if (loopRegion === '1-4') return stepIdx < 64;
        if (loopRegion === '5-8') return stepIdx >= 64;
        if (typeof loopRegion === 'number') {
            const start = (loopRegion - 1) * 16;
            return stepIdx >= start && stepIdx < start + 16;
        }
        return false;
    };

    // Helper to check if note is in scale
    const isNoteInScale = (noteName: string) => {
        if (!noteName) return true;
        if (selectedScale === 'Chromatic') return true;
        
        const scaleIntervals = SCALES[selectedScale];
        if (!scaleIntervals) return true; // Safeguard against undefined scale

        // noteName e.g. "C#4" -> pitch "C#"
        const pitch = noteName.slice(0, -1); 
        const pitchIdx = NOTES.indexOf(pitch);
        const rootIdx = NOTES.indexOf(selectedKey);
        if (pitchIdx === -1 || rootIdx === -1) return true;

        // Calculate interval from root
        const interval = (pitchIdx - rootIdx + 12) % 12;
        return scaleIntervals.includes(interval);
    };

    return (
        <div className={`mb-6 p-2 rounded-lg transition-colors duration-300 ${mute ? 'opacity-40 grayscale' : 'opacity-100'} ${solo ? 'bg-white/5' : ''}`}>
            {/* TRACK HEADER & MIXER */}
            <div className={`flex flex-wrap items-center gap-4 mb-2 pb-2 border-b ${colorClass} bg-opacity-20`}>
                <div className={`text-${colorClass.split('-')[1]}-400 flex items-center gap-2 min-w-[120px]`}>
                    {icon}
                    <span className={`text-xs font-bold uppercase text-${colorClass.split('-')[1]}-100`}>{name}</span>
                </div>
                
                {/* MIXER CONTROLS */}
                <div className="flex items-center gap-3 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    {/* Volume */}
                    <div className="flex items-center gap-2 group">
                        {vol === -Infinity ? <VolumeX size={12} className="text-neutral-500"/> : <Volume2 size={12} className="text-white/70"/>}
                        <input 
                            type="range" 
                            min="-40" 
                            max="0" 
                            step="1" 
                            value={vol === -Infinity ? -40 : vol}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                updateMixer(trackKey, 'vol', val <= -39 ? -Infinity : val);
                            }}
                            className="w-20 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white hover:accent-amber-400"
                        />
                    </div>
                    
                    {/* Mute / Solo */}
                    <div className="flex items-center gap-1">
                        <button onClick={() => updateMixer(trackKey, 'mute', !mute)} className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold transition-all ${mute ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`} title="Mute">M</button>
                        <button onClick={() => updateMixer(trackKey, 'solo', !solo)} className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold transition-all ${solo ? 'bg-yellow-500 text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`} title="Solo">S</button>
                    </div>

                    <div className="w-px h-3 bg-white/10 mx-1"></div>

                    {/* Tools */}
                    <div className="flex items-center gap-1">
                         <button onClick={() => randomizeTrack(trackKey as keyof SequencerState)} className="text-white/30 hover:text-amber-400 transition-colors" title="Randomize Notes"><Dices size={12} /></button>
                         <button onClick={() => clearTrack(trackKey as keyof SequencerState)} className="text-white/30 hover:text-red-400 transition-colors" title="Clear Track"><Eraser size={12} /></button>
                    </div>
                </div>
            </div>
            
            <div className="flex">
                {/* STICKY NOTE LABELS */}
                {notes && (
                    <div className="w-8 sm:w-10 flex flex-col gap-[2px] pt-[0px] mr-1 shrink-0 sticky left-0 z-30 bg-neutral-950/90 backdrop-blur-sm border-r border-white/5">
                        {notes.map((note, i) => {
                            const inScale = isNoteInScale(note);
                            return (
                            <div key={i} className={`h-4 sm:h-5 flex items-center justify-end pr-2 border-b border-white/5 ${!inScale ? 'opacity-30' : ''}`}>
                                <span className={`text-[8px] sm:text-[9px] ${note.includes('#') ? 'text-white/30' : 'text-white/60'} font-medium font-mono`}>
                                    {note}
                                </span>
                            </div>
                        )})}
                    </div>
                )}
                
                {/* SCROLLABLE GRID CONTAINER */}
                <div className="flex-1 overflow-x-auto custom-scrollbar pb-2">
                    <div 
                        className="grid gap-[2px]" 
                        style={{ gridTemplateColumns: `repeat(${STEPS}, minmax(18px, 1fr))` }} 
                    >
                        {grid.map((row, rIdx) => {
                             const noteName = notes ? notes[rIdx] : '';
                             const isBlackKey = noteName.includes('#');
                             const inScale = notes ? isNoteInScale(noteName) : true;
                             
                             return row.map((isActive, cIdx) => {
                                const activeInLoop = isInLoop(cIdx);
                                return (
                                <div 
                                    key={`cell-${rIdx}-${cIdx}`}
                                    onMouseDown={(e) => { if(e.buttons === 1) onToggle(rIdx, cIdx) }}
                                    onClick={() => onToggle(rIdx, cIdx)}
                                    className={`
                                        h-4 sm:h-5 rounded-[1px] cursor-pointer transition-all duration-75 border border-transparent shrink-0
                                        ${isActive 
                                            ? `${colorClass.replace('border-', 'bg-').replace('/30', '-500')} ${shadowClass} z-10` 
                                            : isBlackKey 
                                                ? 'bg-neutral-900/80' 
                                                : 'bg-neutral-800 hover:bg-neutral-700'
                                        }
                                        ${!activeInLoop && !isActive ? 'opacity-30' : ''}
                                        ${!inScale && !isActive ? 'opacity-10 pointer-events-none bg-neutral-950' : ''} /* Dim out of scale */
                                        ${currentStep === cIdx ? 'ring-1 ring-white/80 brightness-150 z-20 scale-105' : ''}
                                        ${cIdx % 4 === 0 && !isActive ? 'border-l border-white/5' : ''}
                                        ${cIdx % 16 === 0 ? 'border-l-2 border-l-white/20' : ''}
                                        ${cIdx % 64 === 0 ? 'border-l-4 border-l-amber-500/20' : ''}
                                    `}
                                    title={notes ? `${notes[rIdx]} - Step ${cIdx + 1}` : `Step ${cIdx + 1}`}
                                />
                             )});
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- APP COMPONENT ---

const App = () => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shape, setShape] = useState("CHAOS");
  const [bpm, setBpm] = useState(120);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [loopRegion, setLoopRegion] = useState<LoopRegion>('ALL');
  
  // Key & Scale State
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedScale, setSelectedScale] = useState('Chromatic');

  const [messages, setMessages] = useState<ChatMessage[]>([
      { role: 'ai', text: "Maestro Studio Pro online. Select a Key/Scale or ask me to compose." }
  ]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [gridState, setGridState] = useState<SequencerState>({
    violins: Array(VIOLIN_NOTES.length).fill(null).map(() => Array(STEPS).fill(false)),
    flutes: Array(FLUTE_NOTES.length).fill(null).map(() => Array(STEPS).fill(false)),
    brass: Array(BRASS_NOTES.length).fill(null).map(() => Array(STEPS).fill(false)),
    cellos: Array(CELLO_NOTES.length).fill(null).map(() => Array(STEPS).fill(false)),
    percussion: Array(DRUMS.length).fill(null).map(() => Array(STEPS).fill(false))
  });

  const [mixerState, setMixerState] = useState<MixerState>({
      violins: { vol: -12, mute: false, solo: false },
      flutes: { vol: -10, mute: false, solo: false },
      brass: { vol: -12, mute: false, solo: false },
      cellos: { vol: -10, mute: false, solo: false },
      percussion: { vol: -6, mute: false, solo: false }
  });

  const audioRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    try { audioRef.current = new AudioEngine(); } 
    catch(e) { console.error("Audio Init Failed", e); }
    return () => { if(audioRef.current) audioRef.current.stop(); };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.updateSequence(gridState, (step) => {
            setCurrentStep(step);
        });
        Tone.Transport.bpm.value = bpm;
    }
  }, [gridState, bpm]);

  useEffect(() => {
      if(audioRef.current) {
          audioRef.current.updateMixer(mixerState);
      }
  }, [mixerState]);

  useEffect(() => {
      if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages]);

  const togglePlay = async () => {
    // Ensure context is ready
    if (Tone.context.state !== 'running') await Tone.context.resume();
    await Tone.start();
    
    if (audioRef.current) {
        isPlaying ? audioRef.current.stop() : audioRef.current.start();
        setIsPlaying(!isPlaying);
    }
  };

  const toggleCell = (track: keyof SequencerState, row: number, col: number) => {
    setGridState(prev => {
        const newState = { ...prev };
        newState[track] = prev[track].map((r, i) => (i === row ? [...r] : r));
        newState[track][row][col] = !newState[track][row][col];
        return newState;
    });
    if (shape === 'CHAOS') setShape('SPHERE');
  };

  const updateMixer = (track: keyof MixerState, field: string, val: any) => {
      setMixerState(prev => ({
          ...prev,
          [track]: { ...prev[track], [field]: val }
      }));
  };

  const clearGrid = () => {
      setGridState({
        violins: Array(VIOLIN_NOTES.length).fill(null).map(() => Array(STEPS).fill(false)),
        flutes: Array(FLUTE_NOTES.length).fill(null).map(() => Array(STEPS).fill(false)),
        brass: Array(BRASS_NOTES.length).fill(null).map(() => Array(STEPS).fill(false)),
        cellos: Array(CELLO_NOTES.length).fill(null).map(() => Array(STEPS).fill(false)),
        percussion: Array(DRUMS.length).fill(null).map(() => Array(STEPS).fill(false))
      });
      setShape("CHAOS");
  };

  const clearTrack = (track: keyof SequencerState) => {
      setGridState(prev => ({
          ...prev,
          [track]: prev[track].map(row => row.map(() => false))
      }));
  };

  const randomizeTrack = (track: keyof SequencerState) => {
     // Respect Scale Randomization
     const notes = track === 'violins' ? VIOLIN_NOTES : track === 'flutes' ? FLUTE_NOTES : track === 'brass' ? BRASS_NOTES : track === 'cellos' ? CELLO_NOTES : null;
     
     setGridState(prev => ({
         ...prev,
         [track]: prev[track].map((row, rIdx) => {
             // Only randomize enabled notes in scale
             if (notes) {
                 const noteName = notes[rIdx];
                 const pitch = noteName.slice(0, -1);
                 const pitchIdx = NOTES.indexOf(pitch);
                 const rootIdx = NOTES.indexOf(selectedKey);
                 const interval = (pitchIdx - rootIdx + 12) % 12;
                 if (selectedScale !== 'Chromatic' && SCALES[selectedScale] && !SCALES[selectedScale].includes(interval)) return row.map(() => false);
             }
             return row.map(() => Math.random() > 0.95);
         })
     }));
  };

  const changeLoopRegion = (region: LoopRegion) => {
      setLoopRegion(region);
      audioRef.current?.setLoop(region);
  };

  const triggerPrompt = (text: string) => {
      setChatInput(text);
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!chatInput.trim() || isAiProcessing) return;
      const userMsg = chatInput;
      setChatInput("");
      setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setIsAiProcessing(true);

      try {
          const prompt = `${SYSTEM_PROMPT}\n Current BPM: ${bpm}. Request: "${userMsg}". Return JSON.`;
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                tools: [{googleSearch: {}}]
            }
          });
          const json = JSON.parse(response.text || '{}');
          
          const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((chunk: any) => chunk.web)
            .filter((web: any) => web)
            .map((web: any) => ({ title: web.title, uri: web.uri }));

          if (json.violins) {
             setGridState(prev => ({
                 violins: json.violins ? json.violins.map((r: number[]) => r.map(n => !!n)) : prev.violins,
                 flutes: json.flutes ? json.flutes.map((r: number[]) => r.map(n => !!n)) : prev.flutes,
                 brass: json.brass ? json.brass.map((r: number[]) => r.map(n => !!n)) : prev.brass,
                 cellos: json.cellos ? json.cellos.map((r: number[]) => r.map(n => !!n)) : prev.cellos,
                 percussion: json.percussion ? json.percussion.map((r: number[]) => r.map(n => !!n)) : prev.percussion,
             }));
          }
          if (json.bpm) setBpm(json.bpm);
          if (json.shape) setShape(json.shape);
          if (json.key) setSelectedKey(json.key);
          
          if (json.scale && SCALES[json.scale]) {
            setSelectedScale(json.scale);
          } else if (json.scale) {
             // Try to match case-insensitive or partial
             const match = Object.keys(SCALES).find(k => k.toLowerCase() === json.scale.toLowerCase());
             if (match) setSelectedScale(match);
             else setSelectedScale('Chromatic');
          }
          
          setMessages(prev => [...prev, { 
              role: 'ai', 
              text: json.message || "Composition updated.",
              sources: sources
          }]);
          
          if (!isPlaying) {
             togglePlay();
          }
      } catch (e) {
          console.error("AI Error", e);
          setMessages(prev => [...prev, { role: 'ai', text: "The orchestra stumbled. Try again?" }]);
      } finally {
          setIsAiProcessing(false);
      }
  };

  const QUICK_PROMPTS = [
      "Mix Beethoven with Trap",
      "Build an epic crescendo (8 bars)",
      "Cyberpunk Synthwave",
      "Reggaeton with Strings"
  ];

  return (
    <div className="w-full h-screen bg-black font-mono selection:bg-amber-500/30 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT PANEL: ORCHESTRA CONTROLS (60%) */}
        <div className="w-full md:w-[60%] flex flex-col h-full border-r border-white/10 relative">
            
            {/* HEADER */}
            <div className="p-4 bg-black/95 backdrop-blur-md border-b border-white/10 z-20 flex flex-wrap gap-4 justify-between items-center sticky top-0">
                 <div>
                    <div className="flex items-center gap-2 text-amber-400 text-[10px] tracking-widest uppercase mb-1">
                        <Activity size={10} /> Orchestral Engine
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tighter">MAESTRO PRO</h1>
                </div>
                
                {/* TRANSPORT & CONTROLS */}
                <div className="flex flex-wrap items-center gap-3 bg-neutral-900 p-2 rounded-lg border border-white/5 shadow-xl">
                    <button 
                        onClick={togglePlay}
                        className={`p-3 rounded-full transition-all ${isPlaying ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(217,119,6,0.5)]' : 'bg-neutral-800 text-white/50 hover:bg-neutral-700'}`}
                    >
                        {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                    
                    <div className="h-8 w-px bg-white/10 mx-1"></div>

                    {/* Scale Selector */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-[9px] text-neutral-500 font-bold uppercase">
                            <Sliders size={10}/> Theory
                        </div>
                        <div className="flex gap-1">
                            <select 
                                value={selectedKey} 
                                onChange={(e) => setSelectedKey(e.target.value)}
                                className="bg-neutral-800 text-[10px] text-white border border-white/10 rounded px-1 outline-none focus:border-amber-500"
                            >
                                {NOTES.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                            <select 
                                value={selectedScale} 
                                onChange={(e) => setSelectedScale(e.target.value)}
                                className="bg-neutral-800 text-[10px] text-white border border-white/10 rounded px-1 outline-none focus:border-amber-500"
                            >
                                {Object.keys(SCALES).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-white/10 mx-1"></div>

                    {/* Loop Selectors */}
                    <div className="flex flex-col gap-1 items-start">
                        <div className="text-[9px] text-neutral-500 font-bold uppercase flex items-center gap-1">
                            <Repeat size={10}/> Loop
                        </div>
                        <div className="flex gap-1">
                             <button onClick={() => changeLoopRegion('ALL')} className={`text-[9px] px-1.5 rounded ${loopRegion === 'ALL' ? 'bg-white text-black font-bold' : 'text-neutral-500 hover:text-white'}`}>ALL</button>
                             {[1, 5].map(start => (
                                 <button key={start} onClick={() => changeLoopRegion(start === 1 ? '1-4' : '5-8')} className={`text-[9px] px-1.5 rounded ${loopRegion === (start===1 ? '1-4' : '5-8') ? 'bg-white text-black font-bold' : 'text-neutral-500 hover:text-white'}`}>{start}-{start+3}</button>
                             ))}
                        </div>
                    </div>

                    <div className="h-8 w-px bg-white/10 mx-1"></div>

                    <div className="flex flex-col items-center">
                        <label className="text-[8px] text-white/40 uppercase">BPM</label>
                        <input 
                            type="number" 
                            value={bpm} 
                            onChange={(e) => setBpm(Number(e.target.value))}
                            className="bg-transparent w-10 text-white font-bold outline-none text-xs text-center"
                        />
                    </div>
                </div>

                <button onClick={clearGrid} className="p-2 text-white/30 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
            </div>

            {/* SCROLLABLE TRACKS */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-neutral-950 scroll-smooth">
                <div className="flex flex-col">
                    
                    <InstrumentTrack 
                        name="Violins (3 Oct)" 
                        notes={VIOLIN_NOTES} 
                        grid={gridState.violins} 
                        onToggle={(r, c) => toggleCell('violins', r, c)} 
                        currentStep={currentStep}
                        colorClass="border-amber-500/30"
                        shadowClass="shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                        icon={<Music size={14}/>}
                        trackKey="violins"
                        mixerState={mixerState}
                        updateMixer={updateMixer}
                        clearTrack={clearTrack}
                        randomizeTrack={randomizeTrack}
                        loopRegion={loopRegion}
                        selectedKey={selectedKey}
                        selectedScale={selectedScale}
                    />

                    <InstrumentTrack 
                        name="Flutes (3 Oct)" 
                        notes={FLUTE_NOTES} 
                        grid={gridState.flutes} 
                        onToggle={(r, c) => toggleCell('flutes', r, c)} 
                        currentStep={currentStep}
                        colorClass="border-cyan-500/30"
                        shadowClass="shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                        icon={<Activity size={14}/>}
                        trackKey="flutes"
                        mixerState={mixerState}
                        updateMixer={updateMixer}
                        clearTrack={clearTrack}
                        randomizeTrack={randomizeTrack}
                        loopRegion={loopRegion}
                        selectedKey={selectedKey}
                        selectedScale={selectedScale}
                    />

                    <InstrumentTrack 
                        name="Brass (3 Oct)" 
                        notes={BRASS_NOTES} 
                        grid={gridState.brass} 
                        onToggle={(r, c) => toggleCell('brass', r, c)} 
                        currentStep={currentStep}
                        colorClass="border-rose-500/30"
                        shadowClass="shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                        icon={<Activity size={14}/>}
                        trackKey="brass"
                        mixerState={mixerState}
                        updateMixer={updateMixer}
                        clearTrack={clearTrack}
                        randomizeTrack={randomizeTrack}
                        loopRegion={loopRegion}
                        selectedKey={selectedKey}
                        selectedScale={selectedScale}
                    />

                    <InstrumentTrack 
                        name="Cellos (3 Oct)" 
                        notes={CELLO_NOTES} 
                        grid={gridState.cellos} 
                        onToggle={(r, c) => toggleCell('cellos', r, c)} 
                        currentStep={currentStep}
                        colorClass="border-indigo-500/30"
                        shadowClass="shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                        icon={<Music size={14}/>}
                        trackKey="cellos"
                        mixerState={mixerState}
                        updateMixer={updateMixer}
                        clearTrack={clearTrack}
                        randomizeTrack={randomizeTrack}
                        loopRegion={loopRegion}
                        selectedKey={selectedKey}
                        selectedScale={selectedScale}
                    />

                    {/* PERCUSSION - Special Case for Labels */}
                    <div className={`mb-6 p-2 rounded-lg transition-colors duration-300 ${mixerState.percussion.mute ? 'opacity-40 grayscale' : 'opacity-100'} ${mixerState.percussion.solo ? 'bg-white/5' : ''}`}>
                        <div className="flex flex-wrap items-center gap-4 mb-2 pb-2 border-b border-emerald-500/30 bg-opacity-20">
                            <div className="text-emerald-400 flex items-center gap-2 min-w-[120px]">
                                <Activity size={14} />
                                <span className="text-xs font-bold uppercase text-emerald-100">Percussion</span>
                            </div>

                             {/* MIXER CONTROLS */}
                            <div className="flex items-center gap-3 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                                <div className="flex items-center gap-2 group">
                                    {mixerState.percussion.vol === -Infinity ? <VolumeX size={12} className="text-neutral-500"/> : <Volume2 size={12} className="text-white/70"/>}
                                    <input 
                                        type="range" min="-40" max="0" step="1" 
                                        value={mixerState.percussion.vol === -Infinity ? -40 : mixerState.percussion.vol}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            updateMixer('percussion', 'vol', val <= -39 ? -Infinity : val);
                                        }}
                                        className="w-20 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white hover:accent-emerald-400"
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => updateMixer('percussion', 'mute', !mixerState.percussion.mute)} className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold transition-all ${mixerState.percussion.mute ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>M</button>
                                    <button onClick={() => updateMixer('percussion', 'solo', !mixerState.percussion.solo)} className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold transition-all ${mixerState.percussion.solo ? 'bg-yellow-500 text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}>S</button>
                                </div>
                                <div className="w-px h-3 bg-white/10 mx-1"></div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => randomizeTrack('percussion')} className="text-white/30 hover:text-amber-400 transition-colors" title="Randomize Notes"><Dices size={12} /></button>
                                    <button onClick={() => clearTrack('percussion')} className="text-white/30 hover:text-red-400 transition-colors" title="Clear Track"><Eraser size={12} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="flex">
                            <div className="w-10 flex flex-col gap-[2px] pt-[0px] mr-1 shrink-0 sticky left-0 z-30 bg-neutral-950/90 backdrop-blur-sm border-r border-white/5">
                                {DRUMS.map((d, i) => (
                                    <div key={i} className="h-4 sm:h-5 flex items-center justify-end pr-2 border-b border-white/5">
                                        <span className="text-[8px] sm:text-[9px] text-white/50 font-medium font-mono whitespace-nowrap overflow-hidden">{d}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 overflow-x-auto custom-scrollbar pb-2">
                                <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${STEPS}, minmax(18px, 1fr))` }}>
                                    {gridState.percussion.map((row, rIdx) => {
                                        return row.map((isActive, cIdx) => {
                                            const activeInLoop = (loopRegion === 'ALL') 
                                                ? true 
                                                : (loopRegion === '1-4' ? cIdx < 64 : (loopRegion === '5-8' ? cIdx >= 64 : (cIdx >= (loopRegion - 1)*16 && cIdx < (loopRegion * 16))));
                                            return (
                                            <div 
                                                key={`p-${rIdx}-${cIdx}`}
                                                onClick={() => toggleCell('percussion', rIdx, cIdx)}
                                                className={`
                                                    h-4 sm:h-5 rounded-[1px] cursor-pointer transition-all duration-75 border border-transparent shrink-0
                                                    ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] border-emerald-300' : 'bg-neutral-800 hover:bg-neutral-700'}
                                                    ${!activeInLoop && !isActive ? 'opacity-30' : ''}
                                                    ${currentStep === cIdx ? 'ring-1 ring-white/80 brightness-150 z-20 scale-105' : ''}
                                                    ${cIdx % 4 === 0 && !isActive ? 'border-l border-white/5' : ''}
                                                    ${cIdx % 16 === 0 ? 'border-l-2 border-l-white/20' : ''}
                                                    ${cIdx % 64 === 0 ? 'border-l-4 border-l-amber-500/20' : ''}
                                                `}
                                            />
                                        )});
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* CHAT */}
            <div className="border-t border-white/10 bg-neutral-900 flex flex-col shrink-0" style={{ maxHeight: '35%' }}>
                <div className="px-4 pt-3 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {QUICK_PROMPTS.map((prompt, i) => (
                        <button 
                            key={i} 
                            onClick={() => triggerPrompt(prompt)}
                            className="whitespace-nowrap flex items-center gap-1 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-amber-500/80 px-2 py-1 rounded-full border border-white/5 transition-colors"
                        >
                            <Sparkles size={10} /> {prompt}
                        </button>
                    ))}
                </div>

                <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 space-y-3 custom-scrollbar min-h-[100px]">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                                msg.role === 'user' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-neutral-800 text-neutral-300 border border-white/10 rounded-bl-none'
                            }`}>
                                {msg.text}
                            </div>
                            {/* Source Citations */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-1 max-w-[85%] flex flex-wrap gap-2">
                                    {msg.sources.map((source, i) => (
                                        <a 
                                            key={i} 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[9px] text-neutral-500 hover:text-amber-400 bg-black/40 px-2 py-1 rounded border border-white/5 transition-colors"
                                        >
                                            <Globe size={8} />
                                            {source.title.length > 20 ? source.title.substring(0, 20) + '...' : source.title}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {isAiProcessing && <div className="text-xs text-amber-500 px-4 animate-pulse">Composing...</div>}
                </div>
                <form onSubmit={handleChatSubmit} className="p-3 bg-black/50 border-t border-white/5 flex gap-2">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Tell the Maestro what to play..."
                        className="flex-1 bg-neutral-800 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-500"
                    />
                    <button type="submit" disabled={isAiProcessing || !chatInput.trim()} className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-md disabled:opacity-50">
                        {isAiProcessing ? <Wand2 size={16} className="animate-spin"/> : <Send size={16} />}
                    </button>
                </form>
            </div>
        </div>

        {/* RIGHT PANEL: VISUALIZER (40%) */}
        <div className="w-full md:w-[40%] h-full bg-black relative border-l border-white/10 hidden md:block">
             <Visualizer audioRef={audioRef} shapeType={shape} />
             <div className="absolute bottom-6 right-6 pointer-events-none text-right">
                 <div className="text-4xl font-bold text-white/5 uppercase tracking-widest select-none">{shape}</div>
             </div>
        </div>

    </div>
  );
};

export default App;
