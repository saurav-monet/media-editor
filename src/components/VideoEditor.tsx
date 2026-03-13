'use client';

import { useEffect, useRef, useState } from 'react';
import { downloadFile, processVideoFile, sanitizeFilename } from '@/utils/fileProcessing';

const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024;

type FileStatus = 'pending' | 'processing' | 'processed' | 'error';
type FileMetadata = { durationSeconds?: number };

export default function VideoEditor() {
    const [files, setFiles] = useState<File[]>([]);
    const [videoBitrate, setVideoBitrate] = useState('5000k');
    const [videoBitratePreset, setVideoBitratePreset] = useState('5000k');
    const [customVideoBitrate, setCustomVideoBitrate] = useState('');
    const [audioBitrate, setAudioBitrate] = useState('128k');
    const [orientation, setOrientation] = useState('original');
    const [orientationMode, setOrientationMode] = useState('pad');
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [zoom, setZoom] = useState(100);
    const cropScale = 80;
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const draggingRef = useRef(false);
    const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
    const [format, setFormat] = useState('mp4');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingFileKey, setProcessingFileKey] = useState<string | null>(null);
    const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>({});
    const [fileMetadata, setFileMetadata] = useState<Record<string, FileMetadata>>({});
    const [validationMessage, setValidationMessage] = useState('Select one or more video files to continue. Maximum file size per file: 250 MB.');

    const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;
    const effectiveVideoBitrate = videoBitratePreset === 'custom' ? `${customVideoBitrate.trim()}k` : videoBitrate;
    const isMultiFileQueueMode = files.length > 1 && orientation === 'original';
    const parseBitrateKbps = (bitrate: string) => {
        const value = Number.parseFloat(bitrate.replace(/k$/i, ''));
        return Number.isFinite(value) ? value : 0;
    };
    const formatFileSize = (bytes: number) => {
        if (bytes <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex += 1;
        }
        return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
    };
    const getEstimatedOutputSize = (file: File) => {
        const durationSeconds = fileMetadata[getFileKey(file)]?.durationSeconds;
        if (!durationSeconds || durationSeconds <= 0) return 'Calculating...';
        const totalBitrateKbps = parseBitrateKbps(effectiveVideoBitrate) + parseBitrateKbps(audioBitrate);
        if (totalBitrateKbps <= 0) return 'N/A';
        const estimatedBytes = (durationSeconds * totalBitrateKbps * 1000) / 8;
        return formatFileSize(estimatedBytes);
    };

    const handleFilesSelection = (selectedFiles: File[]) => {
        if (selectedFiles.length === 0) {
            setFiles([]);
            setFileStatuses({});
            setFileMetadata({});
            setValidationMessage('Select one or more video files to continue. Maximum file size per file: 250 MB.');
            return;
        }

        const oversizedFiles = selectedFiles.filter((file) => file.size > MAX_FILE_SIZE_BYTES);
        const validFiles = selectedFiles.filter((file) => file.size <= MAX_FILE_SIZE_BYTES);

        if (oversizedFiles.length > 0) {
            const rejectedNames = oversizedFiles.map((file) => `"${file.name}"`).join(', ');
            setValidationMessage(`${rejectedNames} exceed the 250 MB limit and were not added.`);
        } else if (validFiles.length > 1) {
            setValidationMessage(`${validFiles.length} video files are ready. Keep Orientation set to Original to enable queued processing.`);
        } else {
            setValidationMessage('1 video file is ready. Maximum allowed size per file: 250 MB.');
        }

        setFiles(validFiles);
        setFileStatuses(Object.fromEntries(validFiles.map((file) => [getFileKey(file), 'pending' as FileStatus])));
        setFileMetadata({});
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFilesSelection(Array.from(e.target.files));
    };

    const validateProcessingRequest = () => {
        if (files.length === 0) {
            const message = 'Please select one or more video files before processing.';
            setValidationMessage(message);
            alert(message);
            return false;
        }

        if (videoBitratePreset === 'custom') {
            const customBitrateValue = Number(customVideoBitrate);
            if (!customVideoBitrate.trim() || !Number.isFinite(customBitrateValue) || customBitrateValue <= 0) {
                const message = 'Please enter a valid custom video bitrate in kbps.';
                setValidationMessage(message);
                alert(message);
                return false;
            }
        }

        if (files.length > 1 && orientation !== 'original') {
            const message = 'Multiple-file processing is only available when Orientation is set to Keep Original.';
            setValidationMessage(message);
            alert(message);
            return false;
        }

        return true;
    };

    const processSingleFile = async (file: File) => {
        const fileKey = getFileKey(file);
        const effectiveOrientation = files.length > 1 ? 'original' : orientation;
        const effectiveOrientationMode = files.length > 1 ? 'pad' : orientationMode;

        setIsProcessing(true);
        setProcessingFileKey(fileKey);
        setFileStatuses((current) => ({ ...current, [fileKey]: 'processing' }));

        try {
            const processedBlob = await processVideoFile(file, {
                videoBitrate: effectiveVideoBitrate,
                audioBitrate,
                orientation: effectiveOrientation,
                format,
                orientationMode: effectiveOrientationMode,
                orientationOffsetX: offsetX / 100,
                orientationOffsetY: offsetY / 100,
                orientationZoom: zoom / 100,
            });

            const originalName = sanitizeFilename(file.name.split('.')[0]);
            downloadFile(processedBlob, `${originalName}_edt.${format}`);
            setFileStatuses((current) => ({ ...current, [fileKey]: 'processed' }));
        } catch (error) {
            console.error('Error processing video:', error);
            setFileStatuses((current) => ({ ...current, [fileKey]: 'error' }));
            alert(`Error processing "${file.name}": ${error}`);
            throw error;
        } finally {
            setIsProcessing(false);
            setProcessingFileKey(null);
        }
    };

    const handleProcess = async () => {
        if (!validateProcessingRequest() || files.length !== 1) return;
        try {
            await processSingleFile(files[0]);
            alert('✅ Video processed successfully!');
            setFiles([]);
            setFileStatuses({});
        } catch {}
    };

    const handleProcessQueuedFile = async (file: File) => {
        if (!validateProcessingRequest()) return;
        try {
            await processSingleFile(file);
        } catch {}
    };

    const getStatusLabel = (file: File) => {
        const status = fileStatuses[getFileKey(file)] || 'pending';
        if (status === 'processing') return 'Processing';
        if (status === 'processed') return 'Processed';
        if (status === 'error') return 'Failed';
        return 'Pending';
    };

    const getStatusClasses = (file: File) => {
        const status = fileStatuses[getFileKey(file)] || 'pending';
        if (status === 'processing') return 'bg-yellow-100 text-yellow-800';
        if (status === 'processed') return 'bg-green-100 text-green-800';
        if (status === 'error') return 'bg-red-100 text-red-700';
        return 'bg-gray-100 text-gray-700';
    };

    useEffect(() => {
        if (files.length === 0) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(files[0]);
        setPreviewUrl(url);
        return () => {
            URL.revokeObjectURL(url);
            setPreviewUrl(null);
        };
    }, [files]);

    useEffect(() => {
        if (files.length > 1 && orientation === 'original') {
            setValidationMessage(`${files.length} video files are ready for queued processing. Use the table below to process each file.`);
        } else if (files.length > 1) {
            setValidationMessage('Multiple videos are selected. Change Orientation to Keep Original to enable processing.');
        } else if (files.length === 1) {
            setValidationMessage('1 video file is ready. Maximum allowed size per file: 250 MB.');
        }
    }, [files, orientation]);

    useEffect(() => {
        if (files.length <= 1) return;
        setFileStatuses(Object.fromEntries(files.map((file) => [getFileKey(file), 'pending' as FileStatus])));
    }, [videoBitratePreset, customVideoBitrate, audioBitrate, format, orientation]);

    useEffect(() => {
        if (files.length === 0) {
            setFileMetadata({});
            return;
        }

        let isCancelled = false;
        files.forEach((file) => {
            const fileKey = getFileKey(file);
            if (fileMetadata[fileKey]?.durationSeconds) return;

            const objectUrl = URL.createObjectURL(file);
            const probeVideo = document.createElement('video');
            probeVideo.preload = 'metadata';
            probeVideo.src = objectUrl;
            probeVideo.onloadedmetadata = () => {
                if (!isCancelled) {
                    setFileMetadata((current) => ({
                        ...current,
                        [fileKey]: { durationSeconds: probeVideo.duration },
                    }));
                }
                URL.revokeObjectURL(objectUrl);
            };
            probeVideo.onerror = () => {
                URL.revokeObjectURL(objectUrl);
            };
        });

        return () => {
            isCancelled = true;
        };
    }, [files, fileMetadata]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">🎥 Video Editor</h1>
                    <p className="text-gray-600 mb-8">Upload your video and adjust bitrates, orientation, and format</p>

                    <div className="mb-8">
                        <label className="block text-lg font-semibold text-gray-900 mb-4">Upload Video File</label>
                        <div
                            className="border-2 border-dashed border-blue-300 rounded-lg p-8 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (e.dataTransfer.files) {
                                    const list = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('video/'));
                                    handleFilesSelection(list);
                                }
                            }}
                        >
                            <input
                                type="file"
                                accept="video/*"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                id="video-input"
                            />
                            <label htmlFor="video-input" className="cursor-pointer">
                                <div className="text-center">
                                    <svg className="mx-auto h-12 w-12 text-blue-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v24a4 4 0 004 4h24a4 4 0 004-4V20m-8-8l-4 4m0 0l-4-4m4 4v12"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <p className="text-gray-700 font-semibold">
                                        {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className="text-gray-500 text-sm mt-1">MP4, WebM, OGG or other video formats, up to 250 MB each</p>
                                </div>
                            </label>
                        </div>
                        <p className={`mt-3 text-sm ${files.length > 0 ? 'text-blue-700' : 'text-red-600'}`}>{validationMessage}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Video Bitrate</label>
                            <select
                                value={videoBitratePreset}
                                onChange={(e) => {
                                    const nextValue = e.target.value;
                                    setVideoBitratePreset(nextValue);
                                    if (nextValue !== 'custom') setVideoBitrate(nextValue);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="1024k">Low (1024 kbps)</option>
                                <option value="2500k">Medium (2500 kbps)</option>
                                <option value="5000k">High (5000 kbps)</option>
                                <option value="10000k">Very High (10000 kbps)</option>
                                <option value="custom">Custom</option>
                            </select>
                            {videoBitratePreset === 'custom' && (
                                <div className="mt-3">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Video Bitrate (kbps)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        inputMode="numeric"
                                        value={customVideoBitrate}
                                        onChange={(e) => {
                                            const nextValue = e.target.value;
                                            setCustomVideoBitrate(nextValue);
                                            setVideoBitrate(nextValue.trim() ? `${nextValue.trim()}k` : '');
                                        }}
                                        placeholder="e.g. 3500"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Lower bitrate = smaller file, higher bitrate = better quality</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Audio Bitrate</label>
                            <select
                                value={audioBitrate}
                                onChange={(e) => setAudioBitrate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="64k">Low (64 kbps)</option>
                                <option value="128k">Medium (128 kbps)</option>
                                <option value="192k">High (192 kbps)</option>
                                <option value="320k">Very High (320 kbps)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Orientation</label>
                            <select
                                value={orientation}
                                onChange={(e) => setOrientation(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="original">Keep Original</option>
                                <option value="portrait">Portrait (9:16)</option>
                                <option value="landscape">Landscape (16:9)</option>
                                <option value="instagram">Instagram Feed (4:5)</option>
                                <option value="square">Square (1:1)</option>
                                <option value="rotate-90">Rotate 90°</option>
                                <option value="rotate-180">Rotate 180°</option>
                                <option value="rotate-270">Rotate 270°</option>
                            </select>
                            {files.length > 1 && orientation !== 'original' && (
                                <p className="text-xs text-amber-600 mt-1">Multi-file processing is enabled only when Orientation is Keep Original.</p>
                            )}
                            {files.length === 1 && orientation !== 'original' && (
                                <div className="mt-2 text-sm text-gray-600">
                                    <label className="inline-flex items-center mr-4">
                                        <input
                                            type="radio"
                                            name="orientationMode"
                                            value="pad"
                                            checked={orientationMode === 'pad'}
                                            onChange={() => setOrientationMode('pad')}
                                            className="mr-2"
                                        />
                                        Fit (pad background)
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="orientationMode"
                                            value="crop"
                                            checked={orientationMode === 'crop'}
                                            onChange={() => setOrientationMode('crop')}
                                            className="mr-2"
                                        />
                                        Fill (crop center)
                                    </label>
                                </div>
                            )}
                            {files.length === 1 && orientation !== 'original' && orientationMode === 'crop' && (
                                <div className="mt-4 space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Horizontal Offset</label>
                                        <input
                                            type="range"
                                            min={-100}
                                            max={100}
                                            value={offsetX}
                                            onChange={(e) => setOffsetX(Number(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="text-xs text-gray-500">{offsetX}% (Left ← → Right)</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Vertical Offset</label>
                                        <input
                                            type="range"
                                            min={-100}
                                            max={100}
                                            value={offsetY}
                                            onChange={(e) => setOffsetY(Number(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="text-xs text-gray-500">{offsetY}% (Up ↑ ↓ Down)</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Zoom</label>
                                        <input
                                            type="range"
                                            min={100}
                                            max={200}
                                            value={zoom}
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="text-xs text-gray-500">{zoom}% (100% = no zoom)</div>
                                    </div>

                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Preview (drag video to pan, wheel to zoom, play/pause)</label>
                                        <div
                                            ref={previewRef}
                                            onMouseDown={(e) => {
                                                if (e.button !== 0) return;
                                                draggingRef.current = true;
                                                dragStartRef.current = { x: e.clientX, y: e.clientY, offsetX, offsetY };
                                            }}
                                            onMouseMove={(e) => {
                                                if (!draggingRef.current || !dragStartRef.current || !previewRef.current) return;
                                                const dx = e.clientX - dragStartRef.current.x;
                                                const dy = e.clientY - dragStartRef.current.y;
                                                const rect = previewRef.current.getBoundingClientRect();
                                                const deltaXPercent = (dx / rect.width) * 200;
                                                const deltaYPercent = (dy / rect.height) * 200;
                                                let nextX = dragStartRef.current.offsetX + deltaXPercent;
                                                let nextY = dragStartRef.current.offsetY + deltaYPercent;
                                                nextX = Math.max(-100, Math.min(100, nextX));
                                                nextY = Math.max(-100, Math.min(100, nextY));
                                                setOffsetX(nextX);
                                                setOffsetY(nextY);
                                            }}
                                            onMouseUp={() => {
                                                draggingRef.current = false;
                                                dragStartRef.current = null;
                                            }}
                                            onMouseLeave={() => {
                                                draggingRef.current = false;
                                                dragStartRef.current = null;
                                            }}
                                            onWheel={(e) => {
                                                e.preventDefault();
                                                const delta = e.deltaY > 0 ? -5 : 5;
                                                setZoom((z) => Math.max(100, Math.min(200, z + delta)));
                                            }}
                                            className="w-full bg-gray-900 overflow-hidden rounded-lg relative"
                                            style={{ height: 360 }}
                                        >
                                            {previewUrl && files.length === 1 ? (
                                                <video
                                                    ref={videoPreviewRef}
                                                    src={previewUrl}
                                                    controls={false}
                                                    autoPlay={false}
                                                    muted
                                                    playsInline
                                                    style={{
                                                        position: 'absolute',
                                                        left: `calc(50% + ${offsetX * 3.6}px)`,
                                                        top: `calc(50% + ${offsetY * 3.6}px)`,
                                                        transform: `translate(-50%, -50%) scale(${zoom / 100})`,
                                                        transformOrigin: 'center center',
                                                        minWidth: '100%',
                                                        minHeight: '100%',
                                                        objectFit: 'cover' as const,
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-center text-white text-sm pt-40">No preview</div>
                                            )}

                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div
                                                    className="border-2 border-dashed border-white"
                                                    style={{
                                                        width: (() => {
                                                            const containerH = 360;
                                                            const boxH = (containerH * cropScale) / 100;
                                                            const ratios: Record<string, number> = {
                                                                portrait: 1080 / 1920,
                                                                landscape: 1920 / 1080,
                                                                instagram: 1080 / 1350,
                                                                square: 1,
                                                            };
                                                            const ratio = ratios[orientation] || 1920 / 1080;
                                                            return `${Math.round(boxH * ratio)}px`;
                                                        })(),
                                                        height: `${Math.round((360 * cropScale) / 100)}px`,
                                                        boxShadow: '0 0 0 100vmax rgba(0,0,0,0.45)',
                                                    }}
                                                />
                                            </div>

                                            <button
                                                onClick={() => {
                                                    const video = videoPreviewRef.current;
                                                    if (!video) return;
                                                    if (video.paused) video.play();
                                                    else video.pause();
                                                }}
                                                className="absolute left-3 bottom-3 bg-white/90 text-gray-900 px-3 py-1 rounded-md"
                                                style={{ pointerEvents: 'auto' }}
                                            >
                                                Play/Pause
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Output Format</label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="mp4">MP4 (H.264)</option>
                                <option value="webm">WebM (VP9)</option>
                                <option value="ogg">OGG (Theora)</option>
                                <option value="mov">MOV (ProRes)</option>
                            </select>
                        </div>
                    </div>

                    {files.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                            <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                                <div className="rounded-lg bg-white/70 px-3 py-2 col-span-2 xl:col-span-4">
                                    <div className="text-gray-700 mb-1">Files</div>
                                    <div className="font-mono text-gray-600 break-words">{files.map((f) => f.name).join(', ')}</div>
                                </div>
                                <div className="rounded-lg bg-white/70 px-3 py-2">
                                    <div className="text-gray-700 mb-1">Total Size</div>
                                    <div className="font-mono text-gray-600">
                                        {(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                </div>
                                <div className="rounded-lg bg-white/70 px-3 py-2">
                                    <div className="text-gray-700 mb-1">Video Bitrate</div>
                                    <div className="font-mono text-gray-600">{effectiveVideoBitrate || 'Not set'}</div>
                                </div>
                                <div className="rounded-lg bg-white/70 px-3 py-2">
                                    <div className="text-gray-700 mb-1">Audio Bitrate</div>
                                    <div className="font-mono text-gray-600">{audioBitrate}</div>
                                </div>
                                <div className="rounded-lg bg-white/70 px-3 py-2">
                                    <div className="text-gray-700 mb-1">Orientation</div>
                                    <div className="font-mono text-gray-600">{orientation}</div>
                                </div>
                                <div className="rounded-lg bg-white/70 px-3 py-2">
                                    <div className="text-gray-700 mb-1">Output Format</div>
                                    <div className="font-mono text-gray-600">{format.toUpperCase()}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    {isMultiFileQueueMode && (
                        <div className="mb-8 overflow-hidden rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Video</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Original Size</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Estimated Output</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {files.map((file) => {
                                        const fileKey = getFileKey(file);
                                        const status = fileStatuses[fileKey] || 'pending';
                                        const isCurrentFile = processingFileKey === fileKey;
                                        return (
                                            <tr key={fileKey}>
                                                <td className="px-4 py-3 text-sm text-gray-800">{file.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(file.size)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{getEstimatedOutputSize(file)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(file)}`}>
                                                        {getStatusLabel(file)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => handleProcessQueuedFile(file)}
                                                        disabled={isProcessing || status === 'processed'}
                                                        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:bg-gray-400"
                                                    >
                                                        {isCurrentFile ? 'Processing...' : status === 'processed' ? 'Processed' : 'Process'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!isMultiFileQueueMode && (
                        <button
                            onClick={handleProcess}
                            disabled={files.length === 0 || isProcessing || files.length > 1}
                            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                        >
                            {isProcessing ? 'Processing...' : files.length > 1 ? 'Use Keep Original for Multi-File Processing' : 'Process Video'}
                        </button>
                    )}
                </div>

                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">❓ Help & Tips</h2>
                    <ul className="space-y-3 text-gray-700">
                        <li>
                            <strong>Video Bitrate:</strong> Controls video quality and file size. More bitrate = better quality but larger file.
                        </li>
                        <li>
                            <strong>Audio Bitrate:</strong> Controls audio quality. 128kbps is suitable for most uses.
                        </li>
                        <li>
                            <strong>Orientation:</strong> Multi-file processing is available only with Keep Original. Other orientation modes remain single-file.
                        </li>
                        <li>
                            <strong>Format:</strong> Choose the output format based on your needs (MP4 is most compatible).
                        </li>
                        <li>
                            <strong>Queue Processing:</strong> When multiple files are selected with Keep Original, process each row and track its status in the table.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
