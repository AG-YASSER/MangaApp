import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const allGenres = [
  'ACTION',
  'ADVENTURE',
  'COMEDY',
  'CRIME',
  'DRAMA',
  'FANTASY',
  'HISTORICAL',
  'HORROR',
  'MUSIC',
  'MYSTERY',
  'PSYCHOLOGICAL',
  'ROMANCE',
  'SCI-FI',
  'SLICE OF LIFE',
  'SPORTS',
  'SUPERNATURAL',
  'THRILLER',
  'SCHOOL LIFE',
  'WEB COMIC',
  'LONG STRIP',
  'DEMONS',
  'MONSTERS',
  'REINCARNATION',
  'LOLI',
]

const statusOptions = ['Completed', 'Ongoing', 'Hiatus']

function SearchHeader({
  searchQuery,
  setSearchQuery,
  selectedGenres,
  setSelectedGenres,
  selectedStatus,
  setSelectedStatus,
  onResetFilters,
  onFeelingLucky,
}) {
  const [showFilters, setShowFilters] = useState(false)

  const toggleFilter = () => {
    setShowFilters(!showFilters)
  }

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre))
    } else {
      setSelectedGenres([...selectedGenres, genre])
    }
  }

  const toggleStatus = (status) => {
    if (selectedStatus === status) {
      setSelectedStatus('')
    } else {
      setSelectedStatus(status)
    }
  }

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            className="block w-full py-2 px-3 border border-gray-300 rounded-md leading-5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          onClick={toggleFilter}
          className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <span>Show filters</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-600">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Genres
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedGenres.includes(genre)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Status
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedStatus === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-between">
        <button
          onClick={onResetFilters}
          className="px-4 py-2 text-gray-800 border border-gray-800 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Reset filters
        </button>

        <div className="flex gap-2">
          <button
            onClick={onFeelingLucky}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md border border-gray-300 dark:bg-gray-700 dark:text-gray-200"
          >
            I'm feeling lucky
          </button>
        </div>
      </div>
    </div>
  )
}

export default SearchHeader
