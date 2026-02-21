import { useState } from 'react'
import TitleCard from './TitleCard'
import { LayoutGrid, List, AlignJustify, X, Search } from 'lucide-react'

function TitleList({
  titles = [],
  viewMode = 'grid',
  onViewModeChange,
  isLoading = false,
  filters = {},
  onFilterChange,
  onSearch,
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (onSearch) onSearch(searchQuery)
  }

  const ViewModeToggle = () => (
    <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
      <button
        className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-100 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        onClick={() => onViewModeChange && onViewModeChange('grid')}
        aria-label="Grid view"
      >
        <LayoutGrid size={18} />
      </button>
      <button
        className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-100 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        onClick={() => onViewModeChange && onViewModeChange('list')}
        aria-label="List view"
      >
        <List size={18} />
      </button>
      <button
        className={`p-2 rounded-md ${viewMode === 'compact' ? 'bg-gray-100 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        onClick={() => onViewModeChange && onViewModeChange('compact')}
        aria-label="Compact view"
      >
        <AlignJustify size={18} />
      </button>
    </div>
  )

  const renderFilterTags = () => {
    // Only show if we have active filters
    const activeFilters = Object.entries(filters).filter(
      ([_, value]) =>
        value !== null &&
        value !== undefined &&
        value !== '' &&
        (Array.isArray(value) ? value.length > 0 : true),
    )

    if (activeFilters.length === 0) return null

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {activeFilters.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm"
          >
            <span className="mr-1 font-medium capitalize">{key}:</span>
            <span className="mr-1">
              {Array.isArray(value) ? value.join(', ') : value}
            </span>
            <button
              onClick={() => onFilterChange(key, null)}
              className="text-blue-700 hover:text-blue-900"
              aria-label={`Remove ${key} filter`}
            >
              <X size={14} />
            </button>
          </div>
        ))}

        <button
          onClick={() => onFilterChange('clear')}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Clear all
        </button>
      </div>
    )
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center mb-6">
          <div className="w-48 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <ViewModeToggle />
        </div>

        <div
          className={`
          ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6' : ''}
          ${viewMode === 'compact' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}
          ${viewMode === 'list' ? 'space-y-6' : ''}
        `}
        >
          {Array(viewMode === 'grid' ? 12 : 6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className={`
              ${viewMode === 'grid' ? 'animate-pulse bg-gray-200 rounded-xl aspect-[3/5]' : ''}
              ${viewMode === 'compact' ? 'animate-pulse bg-gray-200 rounded-xl h-28' : ''}
              ${viewMode === 'list' ? 'animate-pulse bg-gray-200 rounded-xl h-48' : ''}
            `}
              ></div>
            ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (titles.length === 0) {
    return (
      <div>
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            No results found
          </h3>
          <p className="text-gray-500 mt-2 mb-6 max-w-md mx-auto">
            We couldn't find any titles that match your search criteria. Try
            adjusting your filters or search terms.
          </p>
        </div>
      </div>
    )
  }

  // Main content with titles
  return (
    <div>
      <div
        className={`
          ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6' : ''}
          ${viewMode === 'compact' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}
          ${viewMode === 'list' ? 'space-y-6' : ''}
        `}
      >
        {titles.map((title) => (
          <TitleCard key={title.id} title={title} viewMode={viewMode} />
        ))}
      </div>
    </div>
  )
}

export default TitleList
