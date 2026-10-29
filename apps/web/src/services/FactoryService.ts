import { purgeVram } from '../components/MaxOverlay/localLlmService';

export interface GenerationProgress {
    stage: 'queued' | 'purging' | 'processing' | 'decoding' | 'texturing' | 'complete' | 'error';
    percent: number;
    message?: string;
}

export class FactoryService {
    private static BASE_URL = 'http://localhost:8080';
    private static API_URL = `${this.BASE_URL}/gradio_api`;

    /**
     * Manifests a 3D model from a 2D image.
     */
    static async generateFromImage(imageFile: File, onProgress?: (p: GenerationProgress) => void): Promise<string> {
        try {
            // 0. Purge LLM models from VRAM to make room for the 3D Factory
            if (onProgress) onProgress({ stage: 'purging', percent: 0, message: 'Purging VRAM for 3D Synthesis...' });
            await purgeVram();
            if (onProgress) onProgress({ stage: 'purging', percent: 100, message: 'GPU Memory Optimized.' });

            // 1. Upload the file to Gradio's temp storage
            const uploadFormData = new FormData();
            uploadFormData.append('files', imageFile);

            const uploadRes = await fetch(`${this.API_URL}/upload`, {
                method: 'POST',
                body: uploadFormData
            });
            const uploadData = await uploadRes.json();
            const tempPath = uploadData[0];

            // 2. Join the prediction queue
            // Based on Hunyuan3D-2 gradio_app.py structure
            const sessionHash = Math.random().toString(36).substring(2);
            const payload = {
                data: [
                    "", // 1. caption (Textbox)
                    { path: tempPath, orig_name: imageFile.name }, // 2. image (Image)
                    null, // 3. mv_image_front (Image)
                    null, // 4. mv_image_back (Image)
                    null, // 5. mv_image_left (Image)
                    null, // 6. mv_image_right (Image)
                    5,    // 7. num_steps (Slider) - Turbo default
                    5.0,  // 8. cfg_scale (Number)
                    1234, // 9. seed (Slider)
                    256,  // 10. octree_resolution (Slider)
                    true, // 11. check_box_rembg (Checkbox)
                    8000, // 12. num_chunks (Slider)
                    true  // 13. randomize_seed (Checkbox)
                ],
                event_data: null,
                fn_index: 5, // Target for generation_all (Actual synthesis)
                session_hash: sessionHash
            };

            const queueRes = await fetch(`${this.API_URL}/queue/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!queueRes.ok) {
                const errorText = await queueRes.text();
                console.error("Gradio Queue Join Failed:", errorText);
                throw new Error(`Failed to join generation queue: ${queueRes.status} ${queueRes.statusText}`);
            }

            // 3. Poll for progress via EventSource
            return new Promise((resolve, reject) => {
                const eventSource = new EventSource(`${this.API_URL}/queue/data?session_hash=${sessionHash}`);

                eventSource.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    
                    if (data.msg === 'progress') {
                        const progress = data.progress_data?.[0];
                        if (onProgress && progress) {
                            onProgress({
                                stage: 'processing',
                                percent: (progress.index / progress.length) * 100,
                                message: `${progress.unit || 'Synthesizing'}: ${progress.index}/${progress.length}`
                            });
                        }
                    }

                    if (data.msg === 'process_completed') {
                        eventSource.close();
                        if (data.success) {
                            console.log("[FACTORY] Synthesis complete. Raw output:", data.output.data);
                            
                            // Find the GLB path dynamically in the output array
                            const glbEntry = data.output.data.find((item: any) => 
                                (item?.path && item.path.toLowerCase().endsWith('.glb')) ||
                                (item?.orig_name && item.orig_name.toLowerCase().endsWith('.glb'))
                            );

                            const glbPath = glbEntry?.path || data.output.data[1]?.path || data.output.data[0]?.path;
                            
                            if (!glbPath || glbPath === 'undefined') {
                                console.error("[FACTORY] Failed to resolve GLB path from response:", data.output.data);
                                reject(new Error("Synthesis succeeded but no GLB asset was found in the response."));
                                return;
                            }

                            const glbUrl = `${this.BASE_URL}/file=${glbPath}`;
                            console.log("[FACTORY] Manifesting GLB from URL:", glbUrl);
                            resolve(glbUrl);
                        } else {
                            reject(new Error("Synthesis failed on the server."));
                        }
                    }

                    if (data.msg === 'process_error') {
                        eventSource.close();
                        reject(new Error(data.output?.error || "Unknown server error during synthesis."));
                    }
                };

                eventSource.onerror = () => {
                    eventSource.close();
                    reject(new Error("Connection to Factory lost. Verify Docker is running."));
                };
            });

        } catch (error) {
            console.error("Factory Synthesis Failed:", error);
            throw error;
        }
    }
}
