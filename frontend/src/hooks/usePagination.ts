export function usePagination(currentPage: number, totalPages: number) {
	const getPageNumbers = (): (number | 'ellipsis')[] => {
		const pages: (number | 'ellipsis')[] = []
		const current = currentPage
		const total = totalPages

		if (total <= 7) {
			for (let i = 1; i <= total; i++) {
				pages.push(i)
			}
		} else {
			if (current <= 3) {
				for (let i = 1; i <= 4; i++) {
					pages.push(i)
				}
				pages.push('ellipsis')
				pages.push(total)
			} else if (current >= total - 2) {
				pages.push(1)
				pages.push('ellipsis')
				for (let i = total - 3; i <= total; i++) {
					pages.push(i)
				}
			} else {
				pages.push(1)
				pages.push('ellipsis')
				for (let i = current - 1; i <= current + 1; i++) {
					pages.push(i)
				}
				pages.push('ellipsis')
				pages.push(total)
			}
		}

		return pages
	}

	return getPageNumbers()
}
