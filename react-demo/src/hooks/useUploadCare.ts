import { useState } from 'react';
import { uploadFileToUploadCare, deleteUploadCareFile } from '@libs/upload';

interface UseUploadCareReturn {
  uploading: boolean;
  uploadFile: (file: File) => Promise<string | null>;
  deleteFile: (fileId: string) => Promise<boolean>;
  progress: number;
}

export const useUploadCare = (): UseUploadCareReturn => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const result = await uploadFileToUploadCare(file);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.fileId) {
        return result.fileId;
      }
      return null;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const deleteFile = async (fileId: string): Promise<boolean> => {
    return await deleteUploadCareFile(fileId);
  };

  return {
    uploading,
    uploadFile,
    deleteFile,
    progress,
  };
};
