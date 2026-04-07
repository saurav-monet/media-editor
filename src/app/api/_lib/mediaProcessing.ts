import { execFileSync } from 'child_process';
import { NextResponse } from 'next/server';

const ONE_MB = 1024 * 1024;

const parseEnvInt = (name: string, fallback: number) => {
    const value = process.env[name];
    if (!value) return fallback;

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const globalState = globalThis as typeof globalThis & {
    __mediaEditorActiveJobs?: number;
};

export const mediaProcessingConfig = {
    maxConcurrentJobs: parseEnvInt('MEDIA_EDITOR_MAX_CONCURRENT_JOBS', 1),
    maxVideoUploadBytes: parseEnvInt('MEDIA_EDITOR_MAX_VIDEO_UPLOAD_MB', 80) * ONE_MB,
    maxImageUploadBytes: parseEnvInt('MEDIA_EDITOR_MAX_IMAGE_UPLOAD_MB', 20) * ONE_MB,
    maxGifUploadBytes: parseEnvInt('MEDIA_EDITOR_MAX_GIF_UPLOAD_MB', 40) * ONE_MB,
    maxVideoDurationSeconds: parseEnvInt('MEDIA_EDITOR_MAX_VIDEO_DURATION_SECONDS', 60),
    ffmpegThreads: parseEnvInt('MEDIA_EDITOR_FFMPEG_THREADS', 1).toString(),
    x264Preset: process.env.MEDIA_EDITOR_FFMPEG_PRESET || 'veryfast',
};

export const createBusyResponse = () =>
    NextResponse.json(
        {
            error: 'Server busy',
            details: 'Another media job is already running on this server. Please wait for it to finish and try again.',
        },
        {
            status: 503,
            headers: {
                'Retry-After': '15',
            },
        }
    );

export const createProcessingErrorResponse = (error: unknown, fallbackMessage: string) => {
    const details = error instanceof Error ? error.message : String(error);
    const isClientError =
        details.includes('too large') ||
        details.includes('too long') ||
        details.includes('No file provided') ||
        details.includes('Could not determine media duration');

    return NextResponse.json(
        {
            error: fallbackMessage,
            details,
        },
        { status: isClientError ? 400 : 500 }
    );
};

export const acquireProcessingSlot = () => {
    const activeJobs = globalState.__mediaEditorActiveJobs ?? 0;
    if (activeJobs >= mediaProcessingConfig.maxConcurrentJobs) {
        return false;
    }

    globalState.__mediaEditorActiveJobs = activeJobs + 1;
    return true;
};

export const releaseProcessingSlot = () => {
    const activeJobs = globalState.__mediaEditorActiveJobs ?? 0;
    globalState.__mediaEditorActiveJobs = Math.max(0, activeJobs - 1);
};

export const validateUploadSize = (file: File, maxBytes: number, label: string) => {
    if (file.size > maxBytes) {
        const maxMb = Math.round(maxBytes / ONE_MB);
        throw new Error(`${label} file is too large. Maximum allowed size is ${maxMb} MB.`);
    }
};

export const getVideoDurationSeconds = (inputPath: string) => {
    const probeOut = execFileSync(
        'ffprobe',
        [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            inputPath,
        ],
        { encoding: 'utf8' }
    ).trim();

    const duration = Number.parseFloat(probeOut);
    if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error('Could not determine media duration.');
    }

    return duration;
};

export const validateVideoDuration = (inputPath: string, maxDurationSeconds: number, label: string) => {
    const duration = getVideoDurationSeconds(inputPath);
    if (duration > maxDurationSeconds) {
        throw new Error(`${label} is too long. Maximum allowed duration is ${maxDurationSeconds} seconds.`);
    }
};
