import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type FileItem = {
  url: string;
  mimetype: string;
};

type Props = {
  files: FileItem[];
};

export function MediaViewer({ files }: Props) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // ESC закрытие
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewIndex(null);
    };

    if (previewIndex !== null) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => window.removeEventListener("keydown", handleEsc);
  }, [previewIndex]);

  return (
    <>
      <div className="flex gap-3 flex-wrap mt-3">
        {files.map((file, i) => {
          if (file.mimetype.startsWith("image/")) {
            return (
              <img
                key={i}
                src={file.url}
                onClick={() => setPreviewIndex(i)}
                className="w-30 h-30 object-cover rounded-md border cursor-pointer"
              />
            );
          }

          if (file.mimetype.startsWith("video/")) {
            return (
              <video
                key={i}
                src={file.url}
                onClick={() => setPreviewIndex(i)}
                className="w-30 h-30 rounded-md border cursor-pointer object-cover"
                muted
              />
            );
          }

          return (
            <a
              key={i}
              href={file.url}
              target="_blank"
              className="text-sm underline"
            >
              <Button variant={"outline"} className="!h-30 w-30 border-2">
                <span className="text-muted-foreground/95">
                  Открыть <br />
                  документ №{i + 1}
                </span>
              </Button>
            </a>
          );
        })}
      </div>

      {previewIndex !== null && files[previewIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setPreviewIndex(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {files[previewIndex].mimetype.startsWith("image/") ? (
              <img
                src={files[previewIndex].url}
                className="max-w-full max-h-[90vh] object-contain rounded-md"
              />
            ) : (
              <video
                src={files[previewIndex].url}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] rounded-md"
              />
            )}

            <button
              onClick={() => setPreviewIndex(null)}
              className="absolute top-2 right-2 text-white text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
