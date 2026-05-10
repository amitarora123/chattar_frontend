import { User2 } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

interface Props {
  setFile: (file: File) => void;
  preview: string | null | undefined;
}

const ProfilePictureUploader = ({ preview, setFile }: Props) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleSelectImage = () => {
    ref.current!.click();
  };
  return (
    <div className="rounded-full w-[150] h-[150] border-2 relative border-primary">
      <input
        ref={ref}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
          }
        }}
      />

      {preview ? (
        <Image
          onClick={handleSelectImage}
          src={preview}
          alt="Preview"
          width={150}
          height={150}
          className="object-cover w-[150] h-[150] rounded-full"
        />
      ) : (
        <User2 onClick={handleSelectImage} className="size-50" />
      )}
    </div>
  );
};

export default ProfilePictureUploader;
