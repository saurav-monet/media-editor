import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import {
    acquireProcessingSlot,
    createBusyResponse,
    createProcessingErrorResponse,
    mediaProcessingConfig,
    releaseProcessingSlot,
    validateUploadSize,
    validateVideoDuration,
} from '../_lib/mediaProcessing';

/**
 * Process video file using FFmpeg
 * Handles bitrate, audio quality, orientation, and format changes
 */
export async function POST(request: NextRequest) {
    if (!acquireProcessingSlot()) {
        return createBusyResponse();
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const videoBitrate = formData.get('videoBitrate') as string;
        const audioBitrate = formData.get('audioBitrate') as string;
        const orientation = (formData.get('orientation') as string) || 'original';
        const orientationMode = (formData.get('orientationMode') as string) || 'pad';
        const resolutionPreset = (formData.get('resolutionPreset') as string) || 'source';
        const frameRateCap = (formData.get('frameRateCap') as string) || 'source';
        const orientationOffsetX = parseFloat((formData.get('orientationOffsetX') as string) || '0');
        const orientationOffsetY = parseFloat((formData.get('orientationOffsetY') as string) || '0');
        const orientationZoom = parseFloat((formData.get('orientationZoom') as string) || '1');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        validateUploadSize(file, mediaProcessingConfig.maxVideoUploadBytes, 'Video');

        // Create temporary directory
        const tempDir = path.join(os.tmpdir(), `media-editor-${Date.now()}`);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        try {
            // Save uploaded file (preserve extension)
            const buffer = await file.arrayBuffer();
            const originalName = (file as any).name || 'input';
            const origExt = path.extname(originalName) || '.mp4';
            const inputPath = path.join(tempDir, `input${origExt}`);
            fs.writeFileSync(inputPath, Buffer.from(buffer));
            validateVideoDuration(inputPath, mediaProcessingConfig.maxVideoDurationSeconds, 'Video');

            // Build FFmpeg args (avoid shell quoting issues by using execFileSync)
            const args: string[] = ['-threads', mediaProcessingConfig.ffmpegThreads, '-i', inputPath];

            // Add video bitrate
            if (videoBitrate) {
                args.push('-b:v', videoBitrate);
            }

            // Add audio bitrate
            if (audioBitrate) {
                args.push('-b:a', audioBitrate);
            }

            // Prepare video filter chain for browser-safe MP4 outputs.
            const filters: string[] = [];
            if (orientation && orientation !== 'original') {
                const targetMap: Record<string, { w: number; h: number }> = {
                    portrait: { w: 1080, h: 1920 },
                    landscape: { w: 1920, h: 1080 },
                    instagram: { w: 1080, h: 1350 },
                    square: { w: 1080, h: 1080 },
                };

                if (orientation.startsWith('rotate')) {
                    const rotMap: Record<string, string> = {
                        'rotate-90': 'transpose=1',
                        'rotate-180': 'transpose=1,transpose=1',
                        'rotate-270': 'transpose=2',
                    };
                    if (rotMap[orientation]) filters.push(rotMap[orientation]);
                } else if (targetMap[orientation]) {
                    const { w, h } = targetMap[orientation];
                    if (orientationMode === 'pad') {
                        filters.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`);
                    } else {
                        // crop mode: compute numeric scale/crop using input dimensions so offsets are applied exactly
                        try {
                            const probeOut = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', inputPath], { encoding: 'utf8' });
                            const probe = JSON.parse(probeOut);
                            const inW = probe.streams?.[0]?.width || 0;
                            const inH = probe.streams?.[0]?.height || 0;
                            if (inW > 0 && inH > 0) {
                                // invert offsets to match UI pan direction (positive = crop from left)
                                const offX = -orientationOffsetX;
                                const offY = -orientationOffsetY;
                                const zoomMult = orientationZoom;
                                // scale factor to cover target with zoom
                                const scaleFactor = Math.max((w * zoomMult) / inW, (h * zoomMult) / inH);
                                const scaledW = Math.max(1, Math.round(inW * scaleFactor));
                                const scaledH = Math.max(1, Math.round(inH * scaleFactor));
                                const x = Math.max(0, Math.round((scaledW - w) * (0.5 + offX / 2)));
                                const y = Math.max(0, Math.round((scaledH - h) * (0.5 + offY / 2)));
                                filters.push(`scale=${scaledW}:${scaledH}:force_original_aspect_ratio=disable,crop=${w}:${h}:${x}:${y}`);
                            } else {
                                // fallback to expression-based crop if probe fails
                                const offX = orientationOffsetX;
                                const offY = orientationOffsetY;
                                filters.push(`scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}:x=(iw-${w})*(0.5+${offX}/2):y=(ih-${h})*(0.5+${offY}/2)`);
                            }
                        } catch (probeErr) {
                            const offX = orientationOffsetX;
                            const offY = orientationOffsetY;
                            filters.push(`scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}:x=(iw-${w})*(0.5+${offX}/2):y=(ih-${h})*(0.5+${offY}/2)`);
                        }
                    }
                }
            }

            const resolutionMap: Record<string, { w: number; h: number }> = {
                '1080p': { w: 1920, h: 1080 },
                '720p': { w: 1280, h: 720 },
                '480p': { w: 854, h: 480 },
            };

            if (resolutionPreset !== 'source' && resolutionMap[resolutionPreset]) {
                const { w, h } = resolutionMap[resolutionPreset];
                filters.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease`);
            }

            if (frameRateCap !== 'source') {
                filters.push(`fps=${frameRateCap}`);
            }

            const outputPath = path.join(tempDir, 'output.mp4');

            if (filters.length > 0) args.push('-vf', filters.join(','));

            args.push(
                '-c:v', 'libx264',
                '-preset', mediaProcessingConfig.x264Preset,
                '-profile:v', 'high',
                '-level', '4.1',
                '-pix_fmt', 'yuv420p',
                '-c:a', 'aac',
                '-b:a', audioBitrate || '128k',
                '-ac', '2',
                '-ar', '48000',
                '-g', '60',
                '-keyint_min', '60',
                '-sc_threshold', '0',
                '-movflags', '+faststart',
                '-y',
                outputPath
            );

            console.log('Executing ffmpeg', args.join(' '));
            try {
                execFileSync('ffmpeg', args, { stdio: 'pipe' });
            } catch (execErr: any) {
                const execMsg = execErr?.message || String(execErr);
                const stderr = execErr?.stderr?.toString?.() || execMsg;
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
                console.error('FFmpeg failed:', stderr);
                return NextResponse.json(
                    { error: 'FFmpeg conversion failed', details: stderr },
                    { status: 500 }
                );
            }

            // Read processed file
            const processedBuffer = fs.readFileSync(outputPath);
            const processedFile = new Blob([processedBuffer], { type: 'video/mp4' });

            // Cleanup
            fs.rmSync(tempDir, { recursive: true, force: true });

            // Return processed file
            return new NextResponse(processedFile, {
                headers: {
                    'Content-Type': 'video/mp4',
                    'Content-Length': processedBuffer.length.toString(),
                },
            });
        } catch (error) {
            // Cleanup on error
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            throw error;
        }
    } catch (error) {
        console.error('Video processing error:', error);
        return createProcessingErrorResponse(error, 'Failed to process video');
    } finally {
        releaseProcessingSlot();
    }
}
