import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'

type SearchFilterProps = {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	width?: string
	isMobile?: boolean;
}

export function SearchFilter({
	value,
	onChange,
	placeholder = 'Поиск...',
	width = 'w-[min(56vw,200px)] sm:w-[220px]',
	isMobile = false
}: SearchFilterProps) {
	return (
		<div className="relative w-auto max-w-full">
			<Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-4" />
			<Input
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={cn(`${width} h-9 pl-11 sm:pl-12`, isMobile && "h-10 text-lg")}
			/>
		</div>
	)
}
