import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";

type MobileFiltersSheetProps = {
  title?: string;
  onReset: () => void;
  children: React.ReactNode;
};

//
//
//
//
//

export function MobileFiltersSheet({
  title = "Фильтры",
  onReset,
  children,
}: MobileFiltersSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-10 gap-2 text-lg"
        >
          <SlidersHorizontal className="size-5" />
          Фильтры
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[95%] rounded-t-2xl px-4 pb-8 flex flex-col"
      >
        <SheetHeader className="mb-3 text-center text-2xl p-0 pt-6">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
          {children}
        </div>

        <SheetFooter className="p-0">
          <Button
            variant="ghost"
            className="w-full h-12 text-lg"
            onClick={onReset}
          >
            Сбросить фильтры
          </Button>

          <SheetClose asChild>
            <Button className="w-full h-12 text-lg">
              Применить
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

