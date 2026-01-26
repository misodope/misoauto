'use client';

import { Text } from '@radix-ui/themes';
import Modal from '@frontend/app/components/Modal';
import { Video } from '@frontend/app/hooks/apis/videos/use-videos';

interface DeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export default function DeleteModal({
  isOpen,
  onOpenChange,
  video,
  onConfirm,
  isDeleting = false,
}: DeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Delete Video"
      onConfirm={onConfirm}
      confirmLabel="Delete"
      confirmColor="red"
      confirmLoading={isDeleting}
    >
      <Text as="p" size="2">
        Are you sure you want to delete <strong>{video?.title}</strong>? This
        action cannot be undone.
      </Text>
    </Modal>
  );
}
