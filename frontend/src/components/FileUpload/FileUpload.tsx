import { useRef, useState } from "react";

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

    e.target?.files && handleFileChange(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    e.dataTransfer.files && handleFileChange(e.dataTransfer.files[0]);
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
        className={`w-96 h-40 border-dashed rounded border-2 flex flex-col items-center justify-center gap-1 ${
          dragActive ? `border-violet-200` : "border-violet-500"
        }`}
      >
        {selectedFile === null ? (
          <img
            className="w-8 h-8 animate-bounce"
            src="https://img.icons8.com/ios/100/upload--v1.png"
            alt="upload--v1"
          />
        ) : (
          <img
            className="w-8 h-8"
            src="https://img.icons8.com/office/40/checked--v1.png"
            alt="upload--v1"
          />
        )}
        <input
          type="file"
          id="input-file-upload"
          className="hidden"
          ref={inputRef}
          multiple={false}
          onChange={handleChooseFile}
        />
        {selectedFile === null ? (
          <>
            <label htmlFor="input-file-upload">
              <div className="flex flex-col items-center gap-1">
                <p>Drag and drop your video here or</p>
                <button
                  className="cursor-pointer underline hover:text-violet-400 text-violet-500"
                  onClick={handleUploadClick}
                >
                  Upload Video
                </button>
              </div>
            </label>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <p className="font-bold">{selectedFile.name}</p>
            <button
              className="cursor-pointer underline hover:text-violet-400 text-violet-500"
              onClick={handleUploadClick}
            >
              Choose Another Video
            </button>
          </div>
        )}
      </div>
    </form>
  );
};
