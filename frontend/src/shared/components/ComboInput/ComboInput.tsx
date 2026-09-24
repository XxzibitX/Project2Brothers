import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"


function getValueForComboInput(data: any): { label: string; value: string }[] {
  if (!data || data.length === 0) return [];
  return data.map((item: any) => ({
    label: item.displayName ? item.displayName : item.name,
    value: item.id,
  }));
}

type Props = {
  data: any;
  value: string;
  setValue: (value: string) => void;
  disabled?: boolean;
}

export function ComboInput({ data, value, setValue, disabled }: Props) {

  const options = getValueForComboInput(data)
  const selectedLabel = options.find((o) => o.value === value)?.label ?? ""

  return (
    <Combobox items={options} value={selectedLabel} onValueChange={(val) => setValue(val ?? "")}>
      <ComboboxInput disabled={disabled} placeholder="Выберете..." />
      <ComboboxContent className="pointer-events-auto">
        <ComboboxEmpty>Не найдено</ComboboxEmpty>
        <ComboboxList
          className="max-h-60 overflow-y-auto overscroll-contain"
          onWheelCapture={(e) => e.stopPropagation()}
          onTouchMoveCapture={(e) => e.stopPropagation()}
        >
          {(item) => (
            <ComboboxItem key={item.value} value={item.value}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}