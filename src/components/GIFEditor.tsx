'use client';

import { useState, useRef } from 'react';
import { downloadFile, processGIFFile, sanitizeFilename } from '@/utils/fileProcessing';

const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024;

export default function GIFEditor() {
    const [file, setFile] = useState<File | null>(null);
    const [frameRate, setFrameRate] = useState<string>('10');
    const [quality, setQuality] = useState<string>('80');
    const [width, setWidth] = useState<string>('480');
    const [height, setHeight] = useState<string>('270');
    const [optimization, setOptimization] = useState<string>('medium');
    const [sourceType, setSourceType] = useState<string>('gif');
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationMessage, setValidationMessage] = useState<string>('Select a file to continue. Maximum file size: 250 MB.');
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleFileSelection = (selectedFile: File | null) => {
        if (!selectedFile) {
            setFile(null);
            setValidationMessage('Select a file to continue. Maximum file size: 250 MB.');
            return;
        }

        if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
            setFile(null);
            setValidationMessage(`"${selectedFile.name}" is larger than 250 MB. Please choose a smaller file.`);
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        setFile(selectedFile);
        setValidationMessage(`Ready to process "${selectedFile.name}". Maximum allowed size per file: 250 MB.`);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelection(e.target.files?.[0] ?? null);
    };

    const handleProcess = async () => {
        if (!file) {
            const message = sourceType === 'gif'
                ? 'Please select a GIF file before processing.'
                : 'Please select a video file before processing.';
            console.warn(message);
            setValidationMessage(message);
            alert(message);
            return;
        }

        setIsProcessing(true);
        try {
            console.log('Processing GIF with settings:', {
                file: file.name,
                sourceType,
                frameRate,
                quality,
                width,
                height,
                optimization,
            });

            // Process using FFmpeg API
            const processedBlob = await processGIFFile(file, {
                frameRate,
                quality,
                width,
                height,
                optimization,
                sourceType,
            });

            // Generate output filename
            const originalName = sanitizeFilename(file.name.split('.')[0]);
            const outputFilename = `${originalName}_edt.gif`;

            // Trigger download
            downloadFile(processedBlob, outputFilename);

            const successMsg = `✅ GIF processed successfully!\n\nFile: ${outputFilename}\nSize: ${(processedBlob.size / 1024 / 1024).toFixed(2)} MB\nFrame Rate: ${frameRate} FPS`;
            console.log(successMsg);
            alert(successMsg);
            setFile(null);
        } catch (error) {
            console.error('Error processing GIF:', error);
            alert('Error processing GIF: ' + error);
        } finally {
            if (inputRef.current) inputRef.current.value = '';
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🎞️ GIF Editor
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Create and optimize animated GIFs from videos or other GIFs
                    </p>

                    {/* Source Type Selector */}
                    <div className="mb-8">
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            What are you converting?
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                onClick={() => setSourceType('gif')}
                                className={`p-4 border-2 rounded-lg font-semibold transition-all ${sourceType === 'gif'
                                    ? 'border-purple-500 bg-purple-50 text-purple-900'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    }`}
                            >
                                Optimize Existing GIF
                            </button>
                            <button
                                onClick={() => setSourceType('video')}
                                className={`p-4 border-2 rounded-lg font-semibold transition-all ${sourceType === 'video'
                                    ? 'border-purple-500 bg-purple-50 text-purple-900'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    }`}
                            >
                                Convert Video to GIF
                            </button>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="mb-8">
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            Upload{' '}
                            {sourceType === 'gif' ? 'GIF' : 'Video'} File
                        </label>
                        <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors">
                            <input
                                ref={inputRef}
                                type="file"
                                accept={sourceType === 'gif' ? 'image/gif' : 'video/*'}
                                onChange={handleFileChange}
                                className="hidden"
                                id="gif-input"
                            />
                            <label htmlFor="gif-input" className="cursor-pointer">
                                <div className="text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-purple-400 mb-2"
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
                                        {file ? file.name : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {sourceType === 'gif'
                                            ? 'GIF files up to 250 MB'
                                            : 'Video files up to 250 MB'}
                                    </p>
                                </div>
                            </label>
                        </div>
                        <p className={`mt-3 text-sm ${file ? 'text-purple-700' : 'text-red-600'}`}>
                            {validationMessage}
                        </p>
                    </div>

                    {/* GIF Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Frame Rate */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Frame Rate (FPS): {frameRate}
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="30"
                                value={frameRate}
                                onChange={(e) => setFrameRate(e.target.value)}
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Higher FPS = smoother animation but larger file
                            </p>
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
                                Color depth and palette quality
                            </p>
                        </div>

                        {/* Width */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Width (px)
                            </label>
                            <input
                                type="number"
                                value={width}
                                onChange={(e) => setWidth(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* Optimization Level */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Optimization Level
                            </label>
                            <select
                                value={optimization}
                                onChange={(e) => setOptimization(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="low">
                                    Low (Best quality, larger file)
                                </option>
                                <option value="medium" selected>
                                    Medium (Balanced)
                                </option>
                                <option value="high">
                                    High (Better compression, smaller file)
                                </option>
                                <option value="extreme">
                                    Extreme (Maximum compression)
                                </option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Adjust compression level based on your needs
                            </p>
                        </div>
                    </div>

                    {/* Summary */}
                    {file && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8">
                            <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
                            <dl className="grid grid-cols-2 gap-2 text-sm">
                                <dt className="text-gray-700">File:</dt>
                                <dd className="font-mono text-gray-600">{file.name}</dd>
                                <dt className="text-gray-700">Size:</dt>
                                <dd className="font-mono text-gray-600">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </dd>
                                <dt className="text-gray-700">Source Type:</dt>
                                <dd className="font-mono text-gray-600">
                                    {sourceType === 'gif' ? 'GIF' : 'Video'}
                                </dd>
                                <dt className="text-gray-700">Frame Rate:</dt>
                                <dd className="font-mono text-gray-600">{frameRate} FPS</dd>
                                <dt className="text-gray-700">Output Size:</dt>
                                <dd className="font-mono text-gray-600">
                                    {width}×{height}px
                                </dd>
                                <dt className="text-gray-700">Optimization:</dt>
                                <dd className="font-mono text-gray-600">
                                    {optimization.charAt(0).toUpperCase() + optimization.slice(1)}
                                </dd>
                            </dl>
                        </div>
                    )}

                    {/* Process Button */}
                    <button
                        onClick={handleProcess}
                        disabled={!file || isProcessing}
                        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        {isProcessing ? (
                            <>
                                <span className="animate-spin inline-block mr-2">⌛</span>
                                Processing...
                            </>
                        ) : (
                            'Process GIF'
                        )}
                    </button>
                </div>

                {/* Help Section */}
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">❓ Help & Tips</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Converting Video to GIF
                            </h3>
                            <ul className="text-gray-700 space-y-1 ml-4">
                                <li>• Select a video file (MP4, WebM, etc.)</li>
                                <li>• Adjust frame rate for animation quality</li>
                                <li>• Set size to optimize for web or social media</li>
                                <li>• Choose optimization level to reduce file size</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Optimizing Existing GIF
                            </h3>
                            <ul className="text-gray-700 space-y-1 ml-4">
                                <li>• Upload your GIF file</li>
                                <li>• Reduce dimensions to minimize file size</li>
                                <li>• Adjust quality and optimization settings</li>
                                <li>• Download the optimized GIF</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
