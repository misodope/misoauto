'use client';

import { useState } from 'react';
import Drawer from '@frontend/app/components/Drawer';
import FormStepWizard, {
  type FormStep,
} from '@frontend/app/components/FormStepWizard';
import { useUploads } from '../../../../contexts/UploadContext';
import ReviewSubmitStep from './components/ReviewSubmitStep';
import SelectThumbnailStep from './components/SelectThumbnailStep';
import UploadVideoFileStep from './components/UploadVideoFileStep';

interface UploadVideoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadVideoDrawer({
  open,
  onOpenChange,
}: UploadVideoDrawerProps) {
  const { startVideoUpload } = useUploads();

  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<Blob | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSession, setFormSession] = useState(0);

  const resetForm = () => {
    setFile(null);
    setThumbnail(null);
    setTitle('');
    setDescription('');
    setIsSubmitting(false);
    setFormSession((session) => session + 1);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isSubmitting) resetForm();
    onOpenChange(isOpen);
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setThumbnail(null);
    if (!title) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setThumbnail(null);
  };

  const handleSubmit = () => {
    if (!file || !thumbnail || !title.trim()) return;

    setIsSubmitting(true);

    startVideoUpload({
      file,
      thumbnail,
      title: title.trim(),
      description: description.trim() || undefined,
      onComplete: () => {
        resetForm();
        onOpenChange(false);
      },
      onError: () => setIsSubmitting(false),
    });
  };

  const config: FormStep[] = [
    {
      id: 'video-file',
      title: 'Upload a Video File',
      description: 'Choose the video you want to add to your library.',
      content: (
        <UploadVideoFileStep
          file={file}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
        />
      ),
      canContinue: Boolean(file),
    },
    {
      id: 'thumbnail',
      title: 'Select a Thumbnail',
      description: 'Choose a frame from your video to use as its thumbnail.',
      content: (
        <SelectThumbnailStep
          file={file}
          onThumbnailChange={setThumbnail}
        />
      ),
      canContinue: Boolean(thumbnail),
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Check the thumbnail and details before uploading.',
      content: (
        <ReviewSubmitStep
          file={file}
          thumbnail={thumbnail}
          title={title}
          description={description}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
        />
      ),
      canContinue: Boolean(file && thumbnail && title.trim()),
    },
  ];

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      title="Upload video"
      description="Add a video to your library"
      width={640}
    >
      <FormStepWizard
        config={config}
        orientation="horizontal"
        resetKey={formSession}
        isSubmitting={isSubmitting}
        submitLabel="Upload video"
        onCancel={() => handleOpenChange(false)}
        onSubmit={handleSubmit}
      />
    </Drawer>
  );
}
