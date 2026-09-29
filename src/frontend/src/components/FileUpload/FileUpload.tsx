import { useRef, useState } from "react";
import { Button } from "../ui";

interface FileUploadProps {
  handleFileChange: (f: File) => void;
  selectedFile: File | null;
}
export const FileUpload: React.FC<FileUploadProps> = ({
  handleFileChange,
  selectedFile,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleChooseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  return (
    <form
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onSubmit={(e) => e.preventDefault()}
    >
      <div
        className={`w-full max-w-xl min-h-[12rem] border-dashed rounded-lg border-2 flex flex-col items-center justify-center gap-2 p-6 text-center bg-gray-50 ${
          dragActive ? `border-violet-200` : "border-violet-500"
        }`}
      >
        {selectedFile === null ? (
          <img
            className="w-8 h-8 animate-bounce"
            src="https://img.icons8.com/ios/100/upload--v1.png"
            alt=""
          />
        ) : (
          <img
            className="w-8 h-8"
            src="https://img.icons8.com/office/40/checked--v1.png"
            alt=""
          />
        )}
        <input
          type="file"
          id="input-file-upload"
          className="hidden"
          ref={inputRef}
          multiple={false}
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleChooseFile}
        />
        {selectedFile === null ? (
          <div className="flex flex-col items-center gap-1">
            <p>Drag and drop your video here or</p>
            <Button
              variant="text"
              className="px-1 py-1"
              onClick={handleUploadClick}
            >
              Upload Video
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="font-bold">{selectedFile.name}</p>
            <Button
              variant="text"
              className="px-1 py-1"
              onClick={handleUploadClick}
            >
              Choose Another Video
            </Button>
          </div>
        )}
      </div>
    </form>
  );
};
