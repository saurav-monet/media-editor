/**
 * Utility function to download a file
 * @param blob - The file blob to download
 * @param filename - The name of the file to download as
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Sanitize filename by replacing spaces with underscores and removing special characters
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/['",./]/g, ''); // Remove single quotes, double quotes, dots, commas
};

/**
 * Process video file using FFmpeg API
 */
export const processVideoFile = async (
  file: File,
  settings: {
    videoBitrate: string;
    audioBitrate: string;
    orientation: string;
    format: string;
    orientationMode?: string;
    orientationOffsetX?: number;
    orientationOffsetY?: number;
    orientationZoom?: number;
  },
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('videoBitrate', settings.videoBitrate);
  formData.append('audioBitrate', settings.audioBitrate);
  formData.append('orientation', settings.orientation);
  if (settings.orientationMode) formData.append('orientationMode', settings.orientationMode);
  formData.append('format', settings.format);
  if (settings.orientationOffsetX !== undefined)
    formData.append('orientationOffsetX', String(settings.orientationOffsetX));
  if (settings.orientationOffsetY !== undefined)
    formData.append('orientationOffsetY', String(settings.orientationOffsetY));
  if (settings.orientationZoom !== undefined) formData.append('orientationZoom', String(settings.orientationZoom));

  const response = await fetch('api/process-video', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || 'Failed to process video');
  }

  return await response.blob();
};

export const processBrowserVideoFile = async (
  file: File,
  settings: {
    videoBitrate: string;
    audioBitrate: string;
    orientation: string;
    format: string;
    orientationMode?: string;
    orientationOffsetX?: number;
    orientationOffsetY?: number;
    orientationZoom?: number;
    resolutionPreset: string;
    frameRateCap: string;
  },
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('videoBitrate', settings.videoBitrate);
  formData.append('audioBitrate', settings.audioBitrate);
  formData.append('orientation', settings.orientation);
  if (settings.orientationMode) formData.append('orientationMode', settings.orientationMode);
  formData.append('format', settings.format);
  formData.append('resolutionPreset', settings.resolutionPreset);
  formData.append('frameRateCap', settings.frameRateCap);
  if (settings.orientationOffsetX !== undefined)
    formData.append('orientationOffsetX', String(settings.orientationOffsetX));
  if (settings.orientationOffsetY !== undefined)
    formData.append('orientationOffsetY', String(settings.orientationOffsetY));
  if (settings.orientationZoom !== undefined) formData.append('orientationZoom', String(settings.orientationZoom));

  const response = await fetch('api/process-browser-video', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || 'Failed to process browser video');
  }

  return await response.blob();
};

/**
 * Process image file using FFmpeg API
 */
export const processImageFile = async (
  file: File,
  settings: {
    width: string;
    height: string;
    quality: string;
    format: string;
    rotation: string;
    cropX?: number;
    cropY?: number;
    cropWidth?: number;
    cropHeight?: number;
  },
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('width', settings.width);
  formData.append('height', settings.height);
  formData.append('quality', settings.quality);
  formData.append('format', settings.format);
  formData.append('rotation', settings.rotation);
  if (settings.cropX !== undefined) formData.append('cropX', String(settings.cropX));
  if (settings.cropY !== undefined) formData.append('cropY', String(settings.cropY));
  if (settings.cropWidth !== undefined) formData.append('cropWidth', String(settings.cropWidth));
  if (settings.cropHeight !== undefined) formData.append('cropHeight', String(settings.cropHeight));

  const response = await fetch('api/process-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || 'Failed to process image');
  }

  return await response.blob();
};

/**
 * Process GIF file using FFmpeg API
 */
export const processGIFFile = async (
  file: File,
  settings: {
    frameRate: string;
    quality: string;
    width: string;
    height: string;
    optimization: string;
    sourceType: string;
  },
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('frameRate', settings.frameRate);
  formData.append('quality', settings.quality);
  formData.append('width', settings.width);
  formData.append('height', settings.height);
  formData.append('optimization', settings.optimization);
  formData.append('sourceType', settings.sourceType);

  const response = await fetch('api/process-gif', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || 'Failed to process GIF');
  }

  return await response.blob();
};
