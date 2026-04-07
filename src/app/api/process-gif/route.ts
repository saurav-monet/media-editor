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
 * Process GIF file using FFmpeg
 * Handles GIF creation from videos and GIF optimization
 */
export async function POST(request: NextRequest) {
    if (!acquireProcessingSlot()) {
        return createBusyResponse();
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const frameRate = formData.get('frameRate') as string;
        const width = formData.get('width') as string;
        const height = formData.get('height') as string;
        const optimization = formData.get('optimization') as string;
        const sourceType = formData.get('sourceType') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        validateUploadSize(file, mediaProcessingConfig.maxGifUploadBytes, 'GIF/video');

        // Create temporary directory
        const tempDir = path.join(os.tmpdir(), `media-editor-gif-${Date.now()}`);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        try {
            // Save uploaded file
            const buffer = await file.arrayBuffer();
            const inputPath = path.join(tempDir, `input.${sourceType === 'video' ? 'mp4' : 'gif'}`);
            fs.writeFileSync(inputPath, Buffer.from(buffer));
            if (sourceType === 'video') {
                validateVideoDuration(inputPath, mediaProcessingConfig.maxVideoDurationSeconds, 'Video');
            }

            // Build FFmpeg command
            const args: string[] = ['-threads', mediaProcessingConfig.ffmpegThreads, '-i', inputPath];
            const filters: string[] = [];

            // Set fps
            const fps = parseInt(frameRate) || 10;
            filters.push(`fps=${fps}`);

            // Add resizing
            if (width && height) {
                filters.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`);
            }

            // Add quality/optimization
            const optimizationMap: Record<string, number> = {
                'low': 256,
                'medium': 128,
                'high': 64,
                'extreme': 32,
            };
            const palette_size = optimizationMap[optimization] || 128;
            filters.push(`split[s0][s1];[s0]palettegen=max_colors=${palette_size}[p];[s1][p]paletteuse`);

            const outputPath = path.join(tempDir, 'output.gif');
            args.push('-vf', filters.join(','), '-y', outputPath);

            // Execute FFmpeg
            console.log('Executing FFmpeg command:', ['ffmpeg', ...args].join(' '));
            execFileSync('ffmpeg', args, { stdio: 'pipe' });

            // Read processed file
            const processedBuffer = fs.readFileSync(outputPath);
            const processedFile = new Blob([processedBuffer], { type: 'image/gif' });

            // Cleanup
            fs.rmSync(tempDir, { recursive: true, force: true });

            // Return processed file
            return new NextResponse(processedFile, {
                headers: {
                    'Content-Type': 'image/gif',
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
        console.error('GIF processing error:', error);
        return createProcessingErrorResponse(error, 'Failed to process GIF');
    } finally {
        releaseProcessingSlot();
    }
}
