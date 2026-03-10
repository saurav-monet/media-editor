'use client';

import { useEffect, useRef, useState } from 'react';
import { downloadFile, processImageFile, sanitizeFilename } from '@/utils/fileProcessing';

export default function ImageEditor() {
    const [files, setFiles] = useState<File[]>([]);
    const [width, setWidth] = useState<string>('1920');
    const [height, setHeight] = useState<string>('1080');
    const [quality, setQuality] = useState<string>('85');
    const [format, setFormat] = useState<string>('jpeg');
    const [rotation, setRotation] = useState<string>('0');
    const [cropX, setCropX] = useState<number>(0);
    const [cropY, setCropY] = useState<number>(0);
    const [cropWidth, setCropWidth] = useState<number>(100);
    const [cropHeight, setCropHeight] = useState<number>(100);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageNaturalWidth, setImageNaturalWidth] = useState<number>(0);
    const [imageNaturalHeight, setImageNaturalHeight] = useState<number>(0);
    const [previewHeight, setPreviewHeight] = useState<number>(300);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragState, setDragState] = useState<{ type: 'move' | 'resize'; edge?: string; startX: number; startY: number; startCropX: number; startCropY: number; startCropW: number; startCropH: number } | null>(null);
    const previewRef = useRef<HTMLImageElement | null>(null);
    const previewContainerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleCropMouseDown = (e: React.MouseEvent, edge?: string) => {
        e.preventDefault();
        if (!previewContainerRef.current) return;
        setDragState({
            type: edge ? 'resize' : 'move',
            edge,
            startX: e.clientX,
            startY: e.clientY,
            startCropX: cropX,
            startCropY: cropY,
            startCropW: cropWidth,
            startCropH: cropHeight,
        });
    };

    const handleCropMouseMove = (e: React.MouseEvent) => {
        if (!dragState || !previewContainerRef.current) return;

        const rect = previewContainerRef.current.getBoundingClientRect();
        const deltaX = ((e.clientX - dragState.startX) / rect.width) * 100;
        const deltaY = ((e.clientY - dragState.startY) / rect.height) * 100;

        if (dragState.type === 'move') {
            // Move the entire crop box
            let newX = dragState.startCropX + deltaX;
            let newY = dragState.startCropY + deltaY;
            newX = Math.max(0, Math.min(100 - dragState.startCropW, newX));
            newY = Math.max(0, Math.min(100 - dragState.startCropH, newY));
            setCropX(newX);
            setCropY(newY);
        } else if (dragState.type === 'resize' && dragState.edge) {
            // Resize from edges
            const edge = dragState.edge;
            let newX = dragState.startCropX;
            let newY = dragState.startCropY;
            let newW = dragState.startCropW;
            let newH = dragState.startCropH;

            if (edge.includes('left')) {
                newX = Math.max(0, Math.min(dragState.startCropX + dragState.startCropW - 10, dragState.startCropX + deltaX));
                newW = dragState.startCropW + (dragState.startCropX - newX);
            }
            if (edge.includes('right')) {
                newW = Math.max(10, Math.min(100 - dragState.startCropX, dragState.startCropW + deltaX));
            }
            if (edge.includes('top')) {
                newY = Math.max(0, Math.min(dragState.startCropY + dragState.startCropH - 10, dragState.startCropY + deltaY));
                newH = dragState.startCropH + (dragState.startCropY - newY);
            }
            if (edge.includes('bottom')) {
                newH = Math.max(10, Math.min(100 - dragState.startCropY, dragState.startCropH + deltaY));
            }

            setCropX(newX);
            setCropY(newY);
            setCropWidth(newW);
            setCropHeight(newH);
        }
    };

    const handleCropMouseUp = () => {
        setDragState(null);
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const list = Array.from(e.target.files);
            setFiles(list);
            if (list.length === 1) {
                const url = URL.createObjectURL(list[0]);
                setPreviewUrl(url);
                setCropX(0);
                setCropY(0);
                setCropWidth(100);
                setCropHeight(100);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    useEffect(() => {
        const updateHeight = () => {
            if (previewContainerRef.current && imageNaturalWidth && imageNaturalHeight) {
                const rect = previewContainerRef.current.getBoundingClientRect();
                setPreviewHeight(rect.width * (imageNaturalHeight / imageNaturalWidth));
            }
        };
        window.addEventListener('resize', updateHeight);
        updateHeight();
        return () => window.removeEventListener('resize', updateHeight);
    }, [imageNaturalWidth, imageNaturalHeight, previewUrl]);

    const handleProcess = async () => {
        if (files.length === 0) {
            console.warn('Please select one or more image files');
            alert('Please select one or more image files');
            return;
        }

        setIsProcessing(true);
        try {
            for (const file of files) {
                console.log('Processing image with settings:', {
                    file: file.name,
                    width,
                    height,
                    quality,
                    format,
                    rotation,
                    cropX: files.length === 1 ? cropX : undefined,
                    cropY: files.length === 1 ? cropY : undefined,
                    cropWidth: files.length === 1 ? cropWidth : undefined,
                    cropHeight: files.length === 1 ? cropHeight : undefined,
                });

                const processedBlob = await processImageFile(file, {
                    width,
                    height,
                    quality,
                    format,
                    rotation,
                    cropX: files.length === 1 ? cropX : undefined,
                    cropY: files.length === 1 ? cropY : undefined,
                    cropWidth: files.length === 1 ? cropWidth : undefined,
                    cropHeight: files.length === 1 ? cropHeight : undefined,
                });

                const originalName = sanitizeFilename(file.name.split('.')[0]);
                const outputFilename = `${originalName}_edt.${format}`;
                downloadFile(processedBlob, outputFilename);

                console.log(`✅ Image processed: ${outputFilename}`);
            }

            alert('✅ All images processed successfully!');
            setFiles([]);
            setPreviewUrl(null);
        } catch (error) {
            console.error('Error processing images:', error);
            alert('Error processing images: ' + error);
        } finally {
            if (inputRef.current) inputRef.current.value = '';
            setIsProcessing(false);
        }
    };

    const commonResolutions = [
        { name: 'Thumbnail', w: '150', h: '150' },
        { name: 'Web Small', w: '640', h: '480' },
        { name: 'HD', w: '1920', h: '1080' },
        { name: 'Instagram Feed', w: '1080', h: '1080' },
        { name: 'Instagram Story', w: '1080', h: '1920' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🖼️ Image Editor
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Resize, compress, rotate, and convert your images to any format
                    </p>

                    {/* File Upload */}
                    <div className="mb-8">
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            Upload Image File
                        </label>
                        <div
                            className="border-2 border-dashed border-green-300 rounded-lg p-8 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (e.dataTransfer.files) {
                                    const list = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
                                    if (list.length) setFiles(list);
                                }
                            }}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                id="image-input"
                            />
                            <label htmlFor="image-input" className="cursor-pointer">
                                <div className="text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-green-400 mb-2"
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
                                        PNG, JPG, WebP, SVG or other image formats
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Quick Resolution Presets */}
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Quick Presets
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {commonResolutions.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => {
                                        setWidth(preset.w);
                                        setHeight(preset.h);
                                    }}
                                    className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors"
                                >
                                    {preset.name}
                                    <br />
                                    <span className="text-xs text-gray-600">
                                        {preset.w}×{preset.h}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Image Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Width */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Width (px)
                            </label>
                            <input
                                type="number"
                                value={width}
                                onChange={(e) => setWidth(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Height */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Height (px)
                            </label>
                            <input
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Quality */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Quality: {quality}%
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={quality}
                                onChange={(e) => setQuality(e.target.value)}
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Lower quality reduces file size
                            </p>
                        </div>

                        {/* Rotation */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Rotation
                            </label>
                            <select
                                value={rotation}
                                onChange={(e) => setRotation(e.target.value)}
                                disabled={files.length > 1}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                            >
                                <option value="0">No Rotation</option>
                                <option value="90">Rotate 90°</option>
                                <option value="180">Rotate 180°</option>
                                <option value="270">Rotate 270°</option>
                                <option value="flip-h">Flip Horizontal</option>
                                <option value="flip-v">Flip Vertical</option>
                            </select>
                        </div>

                        {/* Crop Section - Only for single file */}
                        {files.length === 1 && previewUrl && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-900 mb-3">
                                    Crop Image
                                </label>
                                <div className="flex gap-6">
                                    {/* Image Preview with Crop Box */}
                                    <div className="flex-1">
                                        <div
                                            ref={previewContainerRef}
                                            className="relative w-full bg-gray-900 rounded-lg overflow-hidden cursor-move"
                                            style={{ height: `${previewHeight}px`, userSelect: 'none' }}
                                            onMouseMove={handleCropMouseMove}
                                            onMouseUp={handleCropMouseUp}
                                            onMouseLeave={handleCropMouseUp}
                                        >
                                            <img
                                                ref={previewRef}
                                                src={previewUrl}
                                                alt="Preview"
                                                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                                onLoad={(e) => {
                                                    const img = e.currentTarget as HTMLImageElement;
                                                    const natW = img.naturalWidth;
                                                    const natH = img.naturalHeight;
                                                    setImageNaturalWidth(natW);
                                                    setImageNaturalHeight(natH);
                                                    if (previewContainerRef.current) {
                                                        const rect = previewContainerRef.current.getBoundingClientRect();
                                                        const newH = rect.width * (natH / natW);
                                                        setPreviewHeight(newH);
                                                    }
                                                }}
                                            />
                                            {/* Crop Box Overlay */}
                                            <div
                                                className="absolute border-2 border-dashed border-white"
                                                style={{
                                                    left: `${cropX}%`,
                                                    top: `${cropY}%`,
                                                    width: `${cropWidth}%`,
                                                    height: `${cropHeight}%`,
                                                    boxShadow: '0 0 0 100vmax rgba(0,0,0,0.45)',
                                                    cursor: dragState?.type === 'move' ? 'grabbing' : 'grab',
                                                }}
                                                onMouseDown={(e) => handleCropMouseDown(e)}
                                            >
                                                {/* Resize Handles */}
                                                {/* Corners */}
                                                <div
                                                    className="absolute w-3 h-3 bg-white rounded-full"
                                                    style={{ left: '-6px', top: '-6px', cursor: 'nwse-resize' }}
                                                    onMouseDown={(e) => handleCropMouseDown(e, 'top-left')}
                                                />
                                                <div
                                                    className="absolute w-3 h-3 bg-white rounded-full"
                                                    style={{ right: '-6px', top: '-6px', cursor: 'nesw-resize' }}
                                                    onMouseDown={(e) => handleCropMouseDown(e, 'top-right')}
                                                />
                                                <div
                                                    className="absolute w-3 h-3 bg-white rounded-full"
                                                    style={{ left: '-6px', bottom: '-6px', cursor: 'nesw-resize' }}
                                                    onMouseDown={(e) => handleCropMouseDown(e, 'bottom-left')}
                                                />
                                                <div
                                                    className="absolute w-3 h-3 bg-white rounded-full"
                                                    style={{ right: '-6px', bottom: '-6px', cursor: 'nwse-resize' }}
                                                    onMouseDown={(e) => handleCropMouseDown(e, 'bottom-right')}
                                                />
                                                {/* Edges */}
                                                <div
                                                    className="absolute bg-white/50"
                                                    style={{ left: '-2px', top: '0', width: '4px', height: '100%', cursor: 'ew-resize' }}
                                                    onMouseDown={(e) => handleCropMouseDown(e, 'left')}
                                                />
                                                <div
                                                    className="absolute bg-white/50"
                                                    style={{ right: '-2px', top: '0', width: '4px', height: '100%', cursor: 'ew-resize' }}
                                                    onMouseDown={(e) => handleCropMouseDown(e, 'right')}
                                                />
                                                <div
                                                    className="absolute bg-white/50"
                                                    style={{ left: '0', top: '-2px', width: '100%', height: '4px', cursor: 'ns-resize' }}
                                                    onMouseDown={(e) => handleCropMouseDown(e, 'top')}
                                                />
                                                <div
                                                    className="absolute bg-white/50"
                                                    style={{ left: '0', bottom: '-2px', width: '100%', height: '4px', cursor: 'ns-resize' }}
                                                    onMouseDown={(e) => handleCropMouseDown(e, 'bottom')}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">Drag to move, drag handles to resize</p>
                                    </div>

                                    {/* Crop Controls */}
                                    <div className="flex-1 space-y-4 text-sm">
                                        <div>
                                            <label className="block font-medium text-gray-700 mb-1">Crop X: {cropX}%</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={cropX}
                                                onChange={(e) => setCropX(Math.min(100 - cropWidth, Number(e.target.value)))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-medium text-gray-700 mb-1">Crop Y: {cropY}%</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={cropY}
                                                onChange={(e) => setCropY(Math.min(100 - cropHeight, Number(e.target.value)))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-medium text-gray-700 mb-1">Crop Width: {cropWidth}%</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="100"
                                                value={cropWidth}
                                                onChange={(e) => setCropWidth(Math.max(1, Math.min(100 - cropX, Number(e.target.value))))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-medium text-gray-700 mb-1">Crop Height: {cropHeight}%</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="100"
                                                value={cropHeight}
                                                onChange={(e) => setCropHeight(Math.max(1, Math.min(100 - cropY, Number(e.target.value))))}
                                                className="w-full"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                setCropX(0);
                                                setCropY(0);
                                                setCropWidth(100);
                                                setCropHeight(100);
                                            }}
                                            className="w-full mt-4 py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
                                        >
                                            Reset Crop
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Output Format */}

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Output Format
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {['jpeg', 'png', 'webp', 'gif'].map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => setFormat(fmt)}
                                        className={`py-2 px-4 rounded-lg font-semibold transition-colors ${format === fmt
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                            }`}
                                    >
                                        {fmt.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    {files.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                            <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                            <dl className="grid grid-cols-2 gap-2 text-sm">
                                <dt className="text-gray-700">Files:</dt>
                                <dd className="font-mono text-gray-600 col-span-3">
                                    {files.map((f) => f.name).join(', ')}
                                </dd>
                                <dt className="text-gray-700">Total Size:</dt>
                                <dd className="font-mono text-gray-600">
                                    {(files.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(2)} KB
                                </dd>
                                <dt className="text-gray-700">New Dimensions:</dt>
                                <dd className="font-mono text-gray-600">
                                    {width}×{height}px
                                </dd>
                                <dt className="text-gray-700">Quality:</dt>
                                <dd className="font-mono text-gray-600">{quality}%</dd>
                                <dt className="text-gray-700">Output:</dt>
                                <dd className="font-mono text-gray-600">{format.toUpperCase()}</dd>
                            </dl>
                        </div>
                    )}

                    {/* Process Button */}
                    <button
                        onClick={handleProcess}
                        disabled={files.length === 0 || isProcessing}
                        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        {isProcessing ? 'Processing...' : 'Process Image'}
                    </button>
                </div>

                {/* Help Section */}
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">❓ Help & Tips</h2>
                    <ul className="space-y-3 text-gray-700">
                        <li>
                            <strong>Resize:</strong> Choose your desired dimensions or select from common presets.
                        </li>
                        <li>
                            <strong>Quality:</strong> Adjust quality to balance file size and image clarity.
                        </li>
                        <li>
                            <strong>Rotation:</strong> Flip or rotate your image to the desired orientation.
                        </li>
                        <li>
                            <strong>Crop:</strong> Available only when processing a single image. Use the sliders to define your crop area. The preview shows the crop box in real-time.
                        </li>
                        <li>
                            <strong>Format:</strong> PNG for transparency, JPEG for photos, WebP for modern browsers.
                        </li>
                        <li>
                            <strong>Batch Processing:</strong> Select multiple image files to resize, compress, and convert in one go. Rotation settings will be ignored when more than one file is selected.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
