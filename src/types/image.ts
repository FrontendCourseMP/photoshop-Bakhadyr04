export type ImageFormat = 'png' | 'jpg' | 'gb7';

export interface ImageMetadata {
  width: number;
  height: number;
  colorDepth: string;
  format: ImageFormat | '';
  fileSize: number;
  fileName: string;
  hasMask: boolean;
}

export interface LoadedImagePayload {
  imageData: ImageData;
  width: number;
  height: number;
  hasMask: boolean;
  colorDepth: string;
}

export interface DownloadRequest {
  imageData: ImageData;
  width: number;
  height: number;
  format: ImageFormat;
  fileName: string;
  includeMask: boolean;
}
