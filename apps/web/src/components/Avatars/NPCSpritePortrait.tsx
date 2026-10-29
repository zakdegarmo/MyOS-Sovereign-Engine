import React, { useEffect, useState, useRef } from 'react';
import { genomeFromPersonaTags, genomeFromPath } from '../../hooks/useOntologicalGenome';
import { useAvatarCompositor, type AvatarGenome } from '../../hooks/useAvatarCompositor';

export const NPCSpritePortrait: React.FC<{ slug: string; size?: number; spriteTags?: string[] }> = ({ slug, size = 120, spriteTags }) => {
    const [manifest, setManifest] = useState<any>({});
    
    useEffect(() => {
        fetch('/textures/avatars/lpc/mephit_manifest.json')
            .then(r => r.json())
            .then(data => setManifest(data.sprites || data))
            .catch(console.error);
    }, []);

    const genome: AvatarGenome = React.useMemo(() => {
        if (!manifest || Object.keys(manifest).length === 0) return {} as AvatarGenome;
        if (spriteTags && spriteTags.length > 0) return genomeFromPersonaTags(spriteTags, manifest);
        return genomeFromPath(slug, manifest);
    }, [slug, spriteTags, manifest]);

    const { canvas, isLoaded } = useAvatarCompositor(genome, 'idle', 'D', 0, { showGlow: false });
    
    const [imgUrl, setImgUrl] = useState<string>('');
    const animRef = useRef<number>(0);

    useEffect(() => {
        const updateFrame = () => {
            if (canvas && isLoaded && canvas.width > 0) {
                try {
                    setImgUrl(canvas.toDataURL());
                } catch (e) {
                    // Ignore tainted canvas
                }
            }
            animRef.current = requestAnimationFrame(updateFrame);
        };
        animRef.current = requestAnimationFrame(updateFrame);
        return () => cancelAnimationFrame(animRef.current);
    }, [canvas, isLoaded]);

    if (!isLoaded || !imgUrl) {
        return (
            <div 
                className="bg-black/40 border border-white/5 shadow-inner rounded-xl animate-pulse flex items-center justify-center flex-shrink-0"
                style={{ width: size, height: size }}
            />
        );
    }

    return (
        <div 
            className="bg-black/40 relative border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] rounded-xl overflow-hidden flex-shrink-0"
            style={{ width: size, height: size }}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
            <img 
                src={imgUrl} 
                alt={slug}
                className="absolute inset-0 w-full h-full object-cover object-top filter contrast-125 saturate-150 z-0 scale-[1.5] origin-top pixelated"
            />
        </div>
    );
};
