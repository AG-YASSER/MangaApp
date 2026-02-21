import { List, Columns, Grid } from 'lucide-react'

function ViewToggle({ viewMode, setViewMode }) {
  // Get position class for the background slider
  const getPosition = () => {
    switch (viewMode) {
      case 'list':
        return 'left-0'
      case 'compact':
        return 'left-1/3'
      case 'grid':
        return 'left-2/3'
      default:
        return 'left-0'
    }
  }

  return (
    <div className="relative flex w-[120px] h-[36px] border rounded-md overflow-hidden border-gray-300 dark:border-gray-700">
      {/* Background slider that covers the full height */}
      <div
        className={`${viewMode === 'grid' ? 'ml-[1px]' : ''} absolute top-0 bottom-0 h-full w-1/3 bg-gray-800 dark:bg-gray-600 transition-all duration-300 ${getPosition()}`}
      />

      {/* List view button */}
      <button
        onClick={() => setViewMode('list')}
        className={`relative z-10 flex-1 flex items-center justify-center ${
          viewMode === 'list'
            ? 'text-white'
            : 'text-gray-800 dark:text-gray-200'
        }`}
        aria-label="List view"
      >
        <List size={18} />
      </button>

      {/* Compact view button */}
      <button
        onClick={() => setViewMode('compact')}
        className={`relative z-10 flex-1 flex items-center justify-center ${
          viewMode === 'compact'
            ? 'text-white'
            : 'text-gray-800 dark:text-gray-200'
        }`}
        aria-label="Compact view"
      >
        <Columns size={18} />
      </button>

      {/* Grid view button */}
      <button
        onClick={() => setViewMode('grid')}
        className={`relative z-10 flex-1 flex items-center justify-center ${
          viewMode === 'grid'
            ? 'text-white'
            : 'text-gray-800 dark:text-gray-200'
        }`}
        aria-label="Grid view"
      >
        <Grid size={18} />
      </button>
    </div>
  )
}

export default ViewToggle
