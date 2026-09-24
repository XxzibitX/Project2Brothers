import { cn } from '@/lib/utils'
import * as React from 'react'

interface TableCellWithTooltipProps {
	children: React.ReactNode
	className?: string
	title?: string
	truncate?: boolean
}

export function TableCellWithTooltip({
	children,
	className,
	title,
	truncate = true
}: TableCellWithTooltipProps) {
	const content = typeof children === 'string' ? children : title
	const displayTitle = title || content

	const handleClick = async () => {
		if (!displayTitle) return
		await navigator.clipboard.writeText(String(displayTitle))
	}

	return (
		<div
			className={cn(truncate ? 'truncate cursor-pointer' : 'cursor-pointer', className)}
			title={displayTitle}
			onClick={handleClick}
		>
			{children}
		</div>
	)
}