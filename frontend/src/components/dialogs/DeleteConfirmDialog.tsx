import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { textSize } from "@/constants/adaptive/textSize";
import { roendedSize } from "@/constants/adaptive/roundedSize";

type Props = {
  onConfirm: () => void | Promise<void>;
  isPending: boolean;
  name: string;
  title: string;
  description: string;
};

export function DeleteConfirmDialog({
  onConfirm,
  isPending,
  name,
  title,
  description,
}: Props) {
  const [open, setOpen] = useState(false);

  const displayName = name ?? "";
  const defaultTitle = title ?? "Удалить";
  const defaultDescription = description ?? "Вы уверены, что хотите удалить?";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" onClick={(e) => e.stopPropagation()}>
          <Trash className="text-red-500" />
          <span className="text-red-500">Удалить</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle className={cn(textSize.hg)}>{defaultTitle}</DialogTitle>
          <DialogDescription className={cn(textSize.md)}>
            {defaultDescription}{" "}
            <span className="text-white/90">{displayName}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className={cn(textSize.md, roendedSize.input, "w-full py-2.5")}
          >
            Отмена
          </Button>

          <Button
            type="button"
            onClick={async () => {
              await onConfirm();
              setOpen(false);
            }}
            disabled={isPending}
            className={cn(textSize.md, roendedSize.input, "w-full py-2.5")}
          >
            {isPending ? "Удаление..." : "Удалить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
