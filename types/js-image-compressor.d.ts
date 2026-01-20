declare module "js-image-compressor" {
  interface CompressionOptions {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    mimeType?: string;
    convertSize?: number;
    loose?: boolean;
    redressOrientation?: boolean;
    success?: (result: Blob) => void;
    error?: (error: Error) => void;
  }

  class ImageCompressor {
    constructor(file: File, options: CompressionOptions);
  }

  export default ImageCompressor;
}
