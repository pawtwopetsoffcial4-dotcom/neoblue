"use client";

import React, { useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export interface ImageKitUploadWidgetProps {
  children: (props: { open: () => void; isUploading: boolean }) => React.ReactNode;
  onSuccess?: (result: { info: { secure_url: string; url: string; fileId?: string; name?: string } }) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  folder?: string;
  uploadPreset?: string;
  options?: {
    multiple?: boolean;
    resourceType?: 'image' | 'video' | 'auto';
    maxFileSize?: number;
    sources?: string[];
    cropping?: boolean;
    croppingAspectRatio?: number;
    showSkipCropButton?: boolean;
  };
}

export default function ImageKitUploadWidget({
  children,
  onSuccess,
  onError,
  onOpen,
  onClose,
  folder = '/neoblue',
  options = {},
}: ImageKitUploadWidgetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const resourceType = options?.resourceType || 'image';
  const isMultiple = Boolean(options?.multiple);

  const acceptTypes = resourceType === 'video' 
    ? 'video/*' 
    : resourceType === 'auto' 
      ? 'image/*,video/*' 
      : 'image/*';

  const triggerOpen = () => {
    setErrorToast(null);
    if (onOpen) onOpen();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      if (onClose) onClose();
      return;
    }

    setIsUploading(true);
    setErrorToast(null);

    try {
      // 1. Fetch Auth parameters from /api/imagekit/auth
      const authRes = await fetch('/api/imagekit/auth');
      if (!authRes.ok) {
        const authErrData = await authRes.json().catch(() => ({}));
        throw new Error(
          authErrData?.error || 'Failed to authenticate with ImageKit. Please check your environment keys.'
        );
      }
      const authData = await authRes.json();
      const { token, expire, signature, publicKey } = authData;

      if (!signature || !token || !publicKey) {
        throw new Error('ImageKit authorization payload is incomplete.');
      }

      // 2. Upload file(s) sequentially or in parallel
      const fileList = Array.from(files);
      const targetFolder = folder.startsWith('/') ? folder : `/${folder}`;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadProgress(
          fileList.length > 1 
            ? `Uploading ${i + 1} of ${fileList.length}...` 
            : 'Uploading to ImageKit...'
        );

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name.replace(/[^a-zA-Z0-9._-]/g, '_'));
        formData.append('publicKey', publicKey);
        formData.append('signature', signature);
        formData.append('expire', String(expire));
        formData.append('token', token);
        formData.append('folder', targetFolder);
        formData.append('useUniqueFileName', 'true');

        const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json().catch(() => ({}));
          throw new Error(uploadErr?.message || uploadErr?.help || 'ImageKit upload failed.');
        }

        const uploadData = await uploadRes.json();
        const secureUrl = uploadData.url;

        if (onSuccess) {
          onSuccess({
            info: {
              secure_url: secureUrl,
              url: secureUrl,
              fileId: uploadData.fileId,
              name: uploadData.name,
            },
          });
        }
      }

      setIsUploading(false);
      setUploadProgress('');
      if (onClose) onClose();
    } catch (err: any) {
      console.error('ImageKit upload error:', err);
      const msg = err?.message || 'Upload failed. Please try again.';
      setErrorToast(msg);
      setIsUploading(false);
      setUploadProgress('');
      if (onError) onError(err);
      if (onClose) onClose();
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        multiple={isMultiple}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {children({ open: triggerOpen, isUploading })}

      {/* Uploading Status Overlay Toast */}
      {isUploading && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-slate-100">{uploadProgress || 'Uploading media...'}</p>
            <p className="text-[10px] text-slate-400">Powered by ImageKit.io</p>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-rose-900/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-rose-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <AlertCircle className="h-5 w-5 text-rose-300 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-rose-100">Upload Error</p>
            <p className="text-[11px] text-rose-200">{errorToast}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorToast(null)}
            className="ml-2 text-rose-300 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

// Export named alias for drop-in migration
export { ImageKitUploadWidget as CldUploadWidget };
