import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
  description?: string;
}

export function FileUpload({
  onFileSelect,
  accept = '.csv',
  maxSize = 10 * 1024 * 1024, // 10MB default
  label = 'Upload a file',
  description = 'Drag and drop or click to select',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = useCallback(
    (file: File): boolean => {
      if (maxSize && file.size > maxSize) {
        setError(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
        return false;
      }

      if (accept) {
        const acceptedTypes = accept.split(',').map((t) => t.trim());
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(fileExtension) && !acceptedTypes.includes(file.type)) {
          setError(`Invalid file type. Accepted: ${accept}`);
          return false;
        }
      }

      setError(null);
      return true;
    },
    [accept, maxSize]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect, validateFile]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect, validateFile]
  );

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {selectedFile ? (
        <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <File className="h-8 w-8 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
            isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
          )}
        >
          <Upload
            className={cn(
              'mb-3 h-10 w-10',
              isDragging ? 'text-primary-600' : 'text-gray-400'
            )}
          />
          <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
          <p className="text-xs text-gray-500">Accepted: {accept}</p>

          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
