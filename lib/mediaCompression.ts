/**
 * Media Compression Utilities
 * Handles image and audio compression for optimal storage and performance
 */

/**
 * Compress an image file using Canvas API (more reliable than library)
 * @param file - The original image file
 * @returns Promise<File> - Compressed image file
 */
export async function compressImage(file: File): Promise<File> {
  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.warn("Not an image file, returning original");
      return file;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject(new Error("Failed to read file"));

      reader.onload = (e) => {
        const img = new Image();

        img.onerror = () => reject(new Error("Failed to load image"));

        img.onload = () => {
          try {
            // Calculate new dimensions (max 1920px)
            const maxSize = 1920;
            let width = img.width;
            let height = img.height;

            if (width > maxSize || height > maxSize) {
              if (width > height) {
                height = (height / width) * maxSize;
                width = maxSize;
              } else {
                width = (width / height) * maxSize;
                height = maxSize;
              }
            }

            // Create canvas and compress
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Failed to get canvas context"));
              return;
            }

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob with compression
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to compress image"));
                  return;
                }

                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, ".jpg"),
                  {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  },
                );

                console.log(
                  `Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`,
                );
                resolve(compressedFile);
              },
              "image/jpeg",
              0.8, // 80% quality
            );
          } catch (error) {
            reject(error);
          }
        };

        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error("Image compression failed:", error);
    return file; // Return original file if compression fails
  }
}

/**
 * Smart audio file compression with support for all common formats
 * Handles MPEG, MP4, MP3, WAV, and other audio formats intelligently
 * @param file - The original audio file
 * @returns Promise<File> - Processed audio file
 */
export async function compressAudio(file: File): Promise<File> {
  try {
    const fileSizeMB = file.size / (1024 * 1024);
    console.log(
      `Processing audio: ${file.name} (${fileSizeMB.toFixed(2)}MB, ${file.type})`,
    );

    // Comprehensive list of already-compressed audio formats
    const compressedFormats = [
      "audio/mpeg", // MP3
      "audio/mp3", // MP3 (alternative MIME)
      "audio/mp4", // MP4 audio
      "audio/m4a", // M4A (Apple audio)
      "audio/aac", // AAC
      "audio/ogg", // OGG Vorbis
      "audio/opus", // Opus
      "audio/webm", // WebM audio
      "audio/x-m4a", // M4A (alternative MIME)
      "audio/x-mp3", // MP3 (alternative MIME)
    ];

    // Check by MIME type
    const isCompressedByMime = compressedFormats.includes(
      file.type.toLowerCase(),
    );

    // Check by file extension (fallback for cases where MIME type is generic)
    const fileName = file.name.toLowerCase();
    const compressedExtensions = [
      ".mp3",
      ".m4a",
      ".aac",
      ".ogg",
      ".opus",
      ".webm",
      ".mp4",
    ];
    const isCompressedByExtension = compressedExtensions.some((ext) =>
      fileName.endsWith(ext),
    );

    if (isCompressedByMime || isCompressedByExtension) {
      console.log(
        `✓ Audio already compressed (${file.type || "detected by extension"}), using as-is`,
      );
      return file;
    }

    // For uncompressed formats (WAV, AIFF, FLAC)
    const uncompressedFormats = [
      "audio/wav",
      "audio/x-wav",
      "audio/wave",
      "audio/aiff",
      "audio/flac",
    ];
    const isUncompressed =
      uncompressedFormats.includes(file.type.toLowerCase()) ||
      fileName.endsWith(".wav") ||
      fileName.endsWith(".aiff") ||
      fileName.endsWith(".flac");

    if (isUncompressed) {
      // Only try to compress if it's reasonably large
      if (fileSizeMB < 3) {
        console.log(
          `✓ Uncompressed audio is small (${fileSizeMB.toFixed(2)}MB), using as-is`,
        );
        return file;
      }

      // For large uncompressed files, we accept them but recommend server-side compression
      // Client-side compression would require heavy codec libraries and block the UI
      console.log(
        `⚠ Large uncompressed audio (${fileSizeMB.toFixed(2)}MB) - accepting as-is. Server-side compression recommended.`,
      );
      return file;
    }

    // Unknown format - accept it
    console.log(`✓ Unknown audio format (${file.type}), accepting as-is`);
    return file;
  } catch (error) {
    console.error("Audio processing failed:", error);
    return file; // Return original file on any error
  }
}

/**
 * Get compressed data URL from file
 * @param file - The file to compress
 * @param type - Type of media (image or audio)
 * @returns Promise<string> - Data URL of compressed file
 */
export async function getCompressedDataUrl(
  file: File,
  type: "image" | "audio",
): Promise<string> {
  const compressedFile =
    type === "image" ? await compressImage(file) : await compressAudio(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(compressedFile);
  });
}
