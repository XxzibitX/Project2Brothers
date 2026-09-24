import type { ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SplitButtonProps {
  trigger: ReactNode;
  menu: ReactNode;
  align?: "start" | "center" | "end";
  openSplit: boolean
  setOpenSplit: (v: boolean) => void;
}

export function SplitButton({
  trigger,
  menu,
  align = "end",
  openSplit,
  setOpenSplit
}: SplitButtonProps) {
  return (
    <ButtonGroup className="w-full">
      {trigger}

      <DropdownMenu open={openSplit} onOpenChange={setOpenSplit}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            className="h-10 w-20 px-2 !border-l !border-card !rounded-l-none"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align={align}>{menu}</DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
