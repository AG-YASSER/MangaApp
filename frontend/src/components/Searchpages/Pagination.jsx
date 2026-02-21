// src/components/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'

function Pagination({ currentPage, totalPages, onPageChange }) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []

    // Always show the first page
    pageNumbers.push(1)

    // Calculate range around current page
    let startPage = Math.max(2, currentPage - 1)
    let endPage = Math.min(totalPages - 1, currentPage + 1)

    // Adjust to always show 3 pages if possible
    if (currentPage <= 3) {
      endPage = Math.min(totalPages - 1, 4)
    } else if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - 3)
    }

    // Add ellipsis if needed before startPage
    if (startPage > 2) {
      pageNumbers.push('...')
    }

    // Add pages in the middle
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    // Add ellipsis if needed after endPage
    if (endPage < totalPages - 1) {
      pageNumbers.push('...')
    }

    // Always show the last page if there's more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex justify-center items-center space-x-1 mt-8">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`p-2 rounded-md transition-colors duration-300 ${
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft size={20} />
      </button>

      {getPageNumbers().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          className={`px-3 py-1.5 rounded-md transition-colors duration-300 ${
            currentPage === page
              ? 'bg-[#051923] text-white dark:text-black dark:bg-[#ABC4FF]'
              : page === '...'
                ? 'text-gray-500 dark:text-gray-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
          disabled={page === '...'}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-md transition-colors duration-300 ${
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
        aria-label="Next page"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

export default Pagination
