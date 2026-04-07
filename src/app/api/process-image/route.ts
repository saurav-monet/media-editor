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
} from '../_lib/mediaProcessing';

/**
 * Process image file using FFmpeg
 * Handles resizing, compression, rotation, and format conversion
 */
export async function POST(request: NextRequest) {
    if (!acquireProcessingSlot()) {
        return createBusyResponse();
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const width = formData.get('width') as string;
        const height = formData.get('height') as string;
        const quality = formData.get('quality') as string;
        const format = formData.get('format') as string;
        const rotation = formData.get('rotation') as string;
        const cropX = formData.get('cropX') ? parseFloat(formData.get('cropX') as string) : undefined;
        const cropY = formData.get('cropY') ? parseFloat(formData.get('cropY') as string) : undefined;
        const cropWidth = formData.get('cropWidth') ? parseFloat(formData.get('cropWidth') as string) : undefined;
        const cropHeight = formData.get('cropHeight') ? parseFloat(formData.get('cropHeight') as string) : undefined;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        validateUploadSize(file, mediaProcessingConfig.maxImageUploadBytes, 'Image');

        // Create temporary directory
        const tempDir = path.join(os.tmpdir(), `media-editor-img-${Date.now()}`);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        try {
            // Save uploaded file (preserve original extension when creating temp input file)
            const buffer = await file.arrayBuffer();
            const origName = (file && (file as any).name) ? String((file as any).name) : 'input';
            const ext = path.extname(origName) || '.jpg';
            const inputPath = path.join(tempDir, `input${ext}`);
            fs.writeFileSync(inputPath, Buffer.from(buffer));

            // Build FFmpeg command
            const args: string[] = ['-threads', mediaProcessingConfig.ffmpegThreads, '-i', inputPath];

            // Get image dimensions for crop calculation
            let imageDimensions = { width: 0, height: 0 };
            try {
                const probeOutput = execFileSync(
                    'ffprobe',
                    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=s=x:p=0', inputPath],
                    { encoding: 'utf-8' }
                ).trim();
                const [w, h] = probeOutput.split('x').map(Number);
                imageDimensions = { width: w, height: h };
            } catch (e) {
                console.log('Could not probe image dimensions, using defaults');
                imageDimensions = { width: 1920, height: 1080 };
            }

            // Add filters
            const filters = [];

            // Crop (must be before scale)
            if (cropX !== undefined && cropY !== undefined && cropWidth !== undefined && cropHeight !== undefined) {
                const cropPixelX = Math.round((cropX / 100) * imageDimensions.width);
                const cropPixelY = Math.round((cropY / 100) * imageDimensions.height);
                const cropPixelW = Math.max(1, Math.round((cropWidth / 100) * imageDimensions.width));
                const cropPixelH = Math.max(1, Math.round((cropHeight / 100) * imageDimensions.height));
                filters.push(`crop=${cropPixelW}:${cropPixelH}:${cropPixelX}:${cropPixelY}`);
            }

            // Resize
            if (width && height) {
                filters.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`);
            }

            // Rotation
            if (rotation && rotation !== '0') {
                const rotationMap: Record<string, string> = {
                    '90': "transpose=1",
                    '180': "transpose=2,transpose=2",
                    '270': "transpose=2",
                    'flip-h': "hflip",
                    'flip-v': "vflip",
                };
                if (rotationMap[rotation]) {
                    filters.push(rotationMap[rotation]);
                }
            }

            if (filters.length > 0) {
                args.push('-vf', filters.join(','));
            }

            // Set quality based on format
            const qualityValue = parseInt(quality) || 85;
            const qualityPercent = Math.max(1, Math.min(31, Math.round((100 - qualityValue) / 3.2)));

            const formatMap: Record<string, { ext: string, opts: string }> = {
                'jpeg': { ext: 'jpg', opts: `-q:v ${qualityPercent}` },
                'png': { ext: 'png', opts: `-compression_level ${Math.round(qualityValue / 10)}` },
                'webp': { ext: 'webp', opts: `-quality ${qualityValue}` },
                'gif': { ext: 'gif', opts: '' },
            };

            const outputFormat = formatMap[format] || formatMap['jpeg'];
            const outputPath = path.join(tempDir, `output.${outputFormat.ext}`);

            if (outputFormat.opts) {
                args.push(...outputFormat.opts.split(' '));
            }
            args.push('-y', outputPath);

            // Execute FFmpeg
            console.log('Image dimensions:', imageDimensions);
            console.log('Crop params:', { cropX, cropY, cropWidth, cropHeight });
            console.log('Executing FFmpeg command:', ['ffmpeg', ...args].join(' '));
            execFileSync('ffmpeg', args, { stdio: 'pipe' });

            // Read processed file
            const processedBuffer = fs.readFileSync(outputPath);
            const mimeType = `image/${outputFormat.ext === 'jpg' ? 'jpeg' : outputFormat.ext}`;
            const processedFile = new Blob([processedBuffer], { type: mimeType });

            // Cleanup
            fs.rmSync(tempDir, { recursive: true, force: true });

            // Return processed file
            return new NextResponse(processedFile, {
                headers: {
                    'Content-Type': mimeType,
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
        console.error('Image processing error:', error);
        return createProcessingErrorResponse(error, 'Failed to process image');
    } finally {
        releaseProcessingSlot();
    }
}
