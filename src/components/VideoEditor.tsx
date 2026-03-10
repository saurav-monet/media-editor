'use client';

import { useState, useRef, useEffect } from 'react';
import { downloadFile, processVideoFile, sanitizeFilename } from '@/utils/fileProcessing';

const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024;

export default function VideoEditor() {
    const [files, setFiles] = useState<File[]>([]);
    const [videoBitrate, setVideoBitrate] = useState<string>('5000k');
    const [audioBitrate, setAudioBitrate] = useState<string>('128k');
    const [orientation, setOrientation] = useState<string>('original');
    const [orientationMode, setOrientationMode] = useState<string>('pad');
    const [offsetX, setOffsetX] = useState<number>(0); // percent -100..100
    const [offsetY, setOffsetY] = useState<number>(0); // percent -100..100
    const [zoom, setZoom] = useState<number>(100); // percent 100..200
    const cropScale = 80; // percent of preview box height
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
    const draggingRef = useRef(false);
    const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
    const [format, setFormat] = useState<string>('mp4');
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationMessage, setValidationMessage] = useState<string>('Select one or more video files to continue. Maximum file size per file: 250 MB.');

    const handleFilesSelection = (selectedFiles: File[]) => {
        if (selectedFiles.length === 0) {
            setFiles([]);
            setValidationMessage('Select one or more video files to continue. Maximum file size per file: 250 MB.');
            return;
        }

        const oversizedFiles = selectedFiles.filter((file) => file.size > MAX_FILE_SIZE_BYTES);
        const validFiles = selectedFiles.filter((file) => file.size <= MAX_FILE_SIZE_BYTES);

        if (oversizedFiles.length > 0) {
            const rejectedNames = oversizedFiles.map((file) => `"${file.name}"`).join(', ');
            setValidationMessage(`${rejectedNames} exceed the 250 MB limit and were not added.`);
        } else {
            setValidationMessage(`${validFiles.length} video file${validFiles.length > 1 ? 's are' : ' is'} ready. Maximum allowed size per file: 250 MB.`);
        }

        setFiles(validFiles);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFilesSelection(Array.from(e.target.files));
    };

    const handleProcess = async () => {
        if (files.length === 0) {
            const message = 'Please select one or more video files before processing.';
            console.warn(message);
            setValidationMessage(message);
            alert(message);
            return;
        }

        setIsProcessing(true);
        try {
            for (const file of files) {
                // if we're batching more than one file, orientation/crop should be ignored
                const effectiveOrientation = files.length > 1 ? 'original' : orientation;
                const effectiveOrientationMode = files.length > 1 ? 'pad' : orientationMode;
                console.log('Processing video with settings:', {
                    file: file.name,
                    videoBitrate,
                    audioBitrate,
                    orientation: effectiveOrientation,
                    format,
                });

                const processedBlob = await processVideoFile(file, {
                    videoBitrate,
                    audioBitrate,
                    orientation: effectiveOrientation,
                    format,
                    orientationMode: effectiveOrientationMode,
                    orientationOffsetX: offsetX / 100,
                    orientationOffsetY: offsetY / 100,
                    orientationZoom: zoom / 100,
                });

                const originalName = sanitizeFilename(file.name.split('.')[0]);
                const outputFilename = `${originalName}_edt.${format}`;
                downloadFile(processedBlob, outputFilename);

                console.log(`✅ Video processed: ${outputFilename}`);
            }

            alert('✅ All videos processed successfully!');
            setFiles([]);
        } catch (error) {
            console.error('Error processing videos:', error);
            alert('Error processing videos: ' + error);
        } finally {
            setIsProcessing(false);
        }
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

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🎥 Video Editor
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Upload your video and adjust bitrates, orientation, and format
                    </p>

                    {/* File Upload */}
                    <div className="mb-8">
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            Upload Video File
                        </label>
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
                                    <svg
                                        className="mx-auto h-12 w-12 text-blue-400 mb-2"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v24a4 4 0 004 4h24a4 4 0 004-4V20m-8-8l-4 4m0 0l-4-4m4 4v12"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <p className="text-gray-700 font-semibold">
                                        {files.length > 0
                                            ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
                                            : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className="text-gray-500 text-sm mt-1">
                                        MP4, WebM, OGG or other video formats, up to 250 MB each
                                    </p>
                                </div>
                            </label>
                        </div>
                        <p className={`mt-3 text-sm ${files.length > 0 ? 'text-blue-700' : 'text-red-600'}`}>
                            {validationMessage}
                        </p>
                    </div>

                    {/* Video Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Video Bitrate */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Video Bitrate
                            </label>
                            <select
                                value={videoBitrate}
                                onChange={(e) => setVideoBitrate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="1024k">Low (1024 kbps)</option>
                                <option value="2500k">Medium (2500 kbps)</option>
                                <option value="5000k">
                                    High (5000 kbps)
                                </option>
                                <option value="10000k">Very High (10000 kbps)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Lower bitrate = smaller file, higher bitrate = better quality
                            </p>
                        </div>

                        {/* Audio Bitrate */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Audio Bitrate
                            </label>
                            <select
                                value={audioBitrate}
                                onChange={(e) => setAudioBitrate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="64k">Low (64 kbps)</option>
                                <option value="128k">
                                    Medium (128 kbps)
                                </option>
                                <option value="192k">High (192 kbps)</option>
                                <option value="320k">Very High (320 kbps)</option>
                            </select>
                        </div>

                        {/* Orientation */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Orientation
                            </label>
                            <select
                                value={orientation}
                                onChange={(e) => setOrientation(e.target.value)}
                                disabled={files.length > 1}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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

                            {/* Crop controls shown when Fill selected */}
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

                                    {/* Preview: original video with centered crop box overlay */}
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Preview (drag video to pan, wheel to zoom, play/pause)</label>
                                        <div
                                            ref={previewRef}
                                            onMouseDown={(e) => {
                                                // start dragging only when left button
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

                                            {/* Centered crop box */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div
                                                    className="border-2 border-dashed border-white"
                                                    style={{
                                                        width: (() => {
                                                            const containerH = 360;
                                                            const boxH = (containerH * cropScale) / 100;
                                                            const ratios: Record<string, number> = { portrait: 1080 / 1920, landscape: 1920 / 1080, instagram: 1080 / 1350, square: 1 };
                                                            const ratio = ratios[orientation] || (1920 / 1080);
                                                            return `${Math.round(boxH * ratio)}px`;
                                                        })(),
                                                        height: `${Math.round(360 * cropScale / 100)}px`,
                                                        boxShadow: '0 0 0 100vmax rgba(0,0,0,0.45)'
                                                    }}
                                                />
                                            </div>

                                            {/* Play/Pause button */}
                                            <button
                                                onClick={() => {
                                                    const v = videoPreviewRef.current;
                                                    if (!v) return;
                                                    if (v.paused) v.play(); else v.pause();
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

                        {/* Output Format */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Output Format
                            </label>
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

                    {/* Summary */}
                    {files.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                            <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                            <dl className="grid grid-cols-2 gap-2 text-sm">
                                <dt className="text-gray-700">Files:</dt>
                                <dd className="font-mono text-gray-600 col-span-3">
                                    {files.map((f) => f.name).join(', ')}
                                </dd>
                                <dt className="text-gray-700">Total Size:</dt>
                                <dd className="font-mono text-gray-600">
                                    {(
                                        files.reduce((sum, f) => sum + f.size, 0) /
                                        1024 /
                                        1024
                                    ).toFixed(2)} MB
                                </dd>
                                <dt className="text-gray-700">Video Bitrate:</dt>
                                <dd className="font-mono text-gray-600">{videoBitrate}</dd>
                                <dt className="text-gray-700">Audio Bitrate:</dt>
                                <dd className="font-mono text-gray-600">{audioBitrate}</dd>
                                <dt className="text-gray-700">Output Format:</dt>
                                <dd className="font-mono text-gray-600">{format.toUpperCase()}</dd>
                            </dl>
                        </div>
                    )}

                    {/* Process Button */}
                    <button
                        onClick={handleProcess}
                        disabled={files.length === 0 || isProcessing}
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        {isProcessing ? 'Processing...' : 'Process Video'}
                    </button>
                </div>

                {/* Help Section */}
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
                            <strong>Orientation:</strong> Adjust or rotate the video to your preferred orientation.
                        </li>
                        <li>
                            <strong>Format:</strong> Choose the output format based on your needs (MP4 is most compatible).
                        </li>
                        <li>
                            <strong>Batch Processing:</strong> You can select multiple video files to convert bitrate and format in one go. Orientation settings will be ignored when more than one file is selected.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
