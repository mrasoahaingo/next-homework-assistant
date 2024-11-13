'use client';

import { Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { deleteFile, uploadFile } from '@/stores/session-store';
import type { Attachment } from '@/types/attachment';

import { ImagePlus } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type ImageCardProps = {
  image: Attachment;
  onRemove?: (file: Attachment) => void;
};

const LoadingSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <Loader2 className="h-4 w-4 animate-spin" />
  </div>
);

export const ImageCard: React.FC<ImageCardProps> = ({ image, onRemove }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleRemove = () => {
    if (!image.fileId || !onRemove) {
      return;
    }

    setIsDeleting(true);
    onRemove(image);
  };

  if (!image.fileUrl || isDeleting) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Image
        src={image.fileUrl}
        width={100}
        height={100}
        alt={`Preview ${image.fileName}`}
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
        className="relative h-20 w-20 rounded-sm object-cover"
      />
      {onRemove && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="-top-2 -right-2 absolute h-6 w-6"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </>
  );
};

export const FileUploadForm: React.FC<{
  setValue: (value: Attachment[]) => void;
}> = ({ setValue }) => {
  const [images, setImages] = React.useState<Attachment[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }

    for (const file of Array.from(e.target.files as FileList)) {
      if (file.size <= MAX_FILE_SIZE) {
        setImages((prev) => [
          ...prev,
          { fileName: file.name, fileId: '', fileUrl: '' },
        ]);
        uploadFile(file).then((file) => {
          setImages((prev) =>
            prev.map((image) =>
              image.fileName === file.fileName
                ? { ...image, fileId: file.fileId, fileUrl: file.fileUrl }
                : image,
            ),
          );
        });
      }
    }
  };

  const onRemove = (file: Attachment) => () => {
    if (!file.fileId) {
      return;
    }

    deleteFile(file.fileId).then(() => {
      setImages((prev) => prev.filter((image) => image.fileId !== file.fileId));
    });
  };

  React.useEffect(() => {
    setValue(images);
  }, [images, setValue]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-2">
        {images.map((image) => (
          <div
            key={image.fileName}
            className='relative h-20 w-20 rounded-md border border-gray-200 p-1 shadow-sm'
          >
            <ImageCard image={image} onRemove={onRemove(image)} />
          </div>
        ))}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        ref={fileInputRef}
        multiple
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImagePlus className="h-4 w-4" />
      </Button>
    </div>
  );
};
