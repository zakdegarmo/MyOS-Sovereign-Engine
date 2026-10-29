// apps/web/src/hooks/useCanvasRecorder.ts
import { useState, useRef, useCallback, useEffect } from 'react';

export interface SavedScreeningResult {
    filename: string;
    url: string;
    sizeBytes: number;
}

export interface UseCanvasRecorderReturn {
    isRecording: boolean;
    recordingDuration: number;
    formattedDuration: string;
    startRecording: (customPrefix?: string) => Promise<boolean>;
    stopRecording: () => Promise<SavedScreeningResult | null>;
    lastSavedScreening: SavedScreeningResult | null;
    error: string | null;
}

export function useCanvasRecorder(): UseCanvasRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [lastSavedScreening, setLastSavedScreening] = useState<SavedScreeningResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);
    const prefixRef = useRef<string>('take');

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = useCallback(async (customPrefix: string = 'take'): Promise<boolean> => {
        setError(null);
        try {
            // Find the active 3D WebGL canvas
            const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
            if (!canvas) {
                const msg = 'No 3D canvas found to record!';
                console.warn('[useCanvasRecorder]', msg);
                setError(msg);
                return false;
            }

            if (typeof canvas.captureStream !== 'function') {
                const msg = 'canvas.captureStream is not supported by your browser.';
                console.warn('[useCanvasRecorder]', msg);
                setError(msg);
                return false;
            }

            // Capture pristine 60 FPS stream directly from WebGL
            const stream = canvas.captureStream(60);

            // Determine best supported codec (prefer MP4 if browser supports it)
            let mimeType = 'video/webm';
            if (MediaRecorder.isTypeSupported('video/mp4')) {
                mimeType = 'video/mp4';
            } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
                mimeType = 'video/webm; codecs=vp9';
            } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8')) {
                mimeType = 'video/webm; codecs=vp8';
            }

            const recorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 8_000_000 // 8 Mbps high-quality bitrate
            });

            chunksRef.current = [];
            prefixRef.current = customPrefix;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.start(250); // Collect slices every 250ms
            mediaRecorderRef.current = recorder;

            setIsRecording(true);
            setRecordingDuration(0);

            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

            console.log(`[useCanvasRecorder] 🎬 Started recording viewport stream at 60 FPS (${mimeType})`);
            return true;
        } catch (err: any) {
            console.error('[useCanvasRecorder] Failed to start recording:', err);
            setError(err.message || 'Recording failed to start');
            return false;
        }
    }, []);

    const stopRecording = useCallback((): Promise<SavedScreeningResult | null> => {
        return new Promise((resolve) => {
            const recorder = mediaRecorderRef.current;
            if (!recorder || recorder.state === 'inactive') {
                setIsRecording(false);
                if (timerRef.current) clearInterval(timerRef.current);
                resolve(null);
                return;
            }

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            recorder.onstop = async () => {
                try {
                    const mimeType = recorder.mimeType || 'video/webm';
                    const blob = new Blob(chunksRef.current, { type: mimeType });

                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const ext = mimeType.includes('mp4') ? '.mp4' : '.webm';
                    const filename = `${prefixRef.current}_${timestamp}${ext}`;

                    console.log(`[useCanvasRecorder] 🎞️ Encoded ${blob.size} bytes (${(blob.size / (1024 * 1024)).toFixed(2)} MB). Uploading to /api/screenings/save...`);

                    // Save directly into apps/web/public/screenings/
                    const res = await fetch('/api/screenings/save', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'x-filename': filename
                        },
                        body: blob
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const result: SavedScreeningResult = {
                            filename: data.filename || filename,
                            url: data.url || `/screenings/${filename}`,
                            sizeBytes: data.sizeBytes || blob.size
                        };

                        setLastSavedScreening(result);
                        console.log(`[useCanvasRecorder] ✅ Screening saved to ${result.url}`);

                        // Dispatch global event so Cinema Remote and Vault sync immediately
                        window.dispatchEvent(new CustomEvent('myos:new-screening-ready', { detail: result }));
                        window.dispatchEvent(new CustomEvent('myos:open-cinema-vault'));

                        resolve(result);
                    } else {
                        console.warn('[useCanvasRecorder] Server save returned non-200 status:', res.status);
                        resolve(null);
                    }
                } catch (err: any) {
                    console.error('[useCanvasRecorder] Error saving screening:', err);
                    setError(err.message || 'Failed to save screening');
                    resolve(null);
                } finally {
                    setIsRecording(false);
                    mediaRecorderRef.current = null;
                    chunksRef.current = [];
                }
            };

            recorder.stop();
        });
    }, []);

    return {
        isRecording,
        recordingDuration,
        formattedDuration: formatDuration(recordingDuration),
        startRecording,
        stopRecording,
        lastSavedScreening,
        error
    };
}

export default useCanvasRecorder;
