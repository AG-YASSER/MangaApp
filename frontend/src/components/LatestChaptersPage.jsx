import { useState, useEffect } from 'react'
import { Calendar, Book, List, LayoutGrid } from 'lucide-react'
import chapters from '../data/chapters'

function LatestChaptersPage() {
  const [viewMode, setViewMode] = useState('list')
  const [sortedChapters, setSortedChapters] = useState([])
  
  useEffect(() => {
    // Sort chapters by addedAt (newest first)
    const sorted = [...chapters].sort((a, b) => 
      new Date(b.addedAt) - new Date(a.addedAt)
    )
    setSortedChapters(sorted)
  }, [])

  // Format date to human readable format (e.g. "2 days ago")
  const formatDate = (dateString) => {
    try {
      const now = new Date()
      const date = new Date(dateString)
      const diffTime = Math.abs(now - date)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      
      if (diffMinutes < 1) return 'just now'
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
      if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
      
      // Format as date if older than a month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    } catch (e) {
      return 'Unknown date'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 pt-30 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Latest Chapters
          </h1>
          
          {/* View mode toggle */}
          <div className="flex justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400">
              Browse the most recently added chapters
            </p>
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 rounded-md ${
                  viewMode === 'compact'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Chapters list */}
        <div className={`grid gap-4 ${viewMode === 'compact' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {sortedChapters.map((chapter) => (
            <ChapterCard 
              key={chapter.id} 
              chapter={chapter} 
              viewMode={viewMode} 
              formatDate={formatDate}
            />
          ))}
        </div>

        {/* Pagination (if needed) */}
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button className="p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
              Previous
            </button>
            <span className="px-4 py-2 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium">
              1
            </span>
            <button className="p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}

function ChapterCard({ chapter, viewMode, formatDate }) {
  const [isHovered, setIsHovered] = useState(false)
  const fallbackCover = '/assets/images/covers/placeholder.jpg'
  const [validCover, setValidCover] = useState(fallbackCover)
  
  useEffect(() => {
    if (!chapter?.cover) return

    const imagePath = `/assets/images/covers/${chapter.cover}`
    const img = new Image()
    img.src = imagePath
    img.onload = () => setValidCover(imagePath)
    img.onerror = () => setValidCover(fallbackCover)
  }, [chapter?.cover])

  // List view - detailed card with more information
  if (viewMode === 'list') {
    return (
      <a
        href={`/manga/${chapter.titleId}/chapter/${chapter.id}`}
        className="block transition-all duration-200"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`flex bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm h-full transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 ${
            isHovered ? 'shadow-md translate-y-px' : ''
          }`}
        >
          {/* Cover image */}
          <div className="w-24 md:w-32 shrink-0 relative">
            <div className="aspect-[3/4] w-full h-full">
              <img
                src={validCover}
                alt={`${chapter.titleName} cover`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-gray-900 line-clamp-1 dark:text-white">
                {chapter.titleName}
              </h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full font-medium dark:bg-blue-900 dark:text-blue-300">
                Ch. {chapter.chapterNumber}
              </span>
            </div>

            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              By {chapter.author}
            </div>

            <div className="mt-auto pt-3 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar size={16} className="mr-1" />
              <span>Added {formatDate(chapter.addedAt)}</span>
            </div>

            <div className="mt-2 flex justify-between items-center">
              <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Book size={16} className="mr-1" />
                {chapter.imageCount} pages
              </span>
              <span className="text-blue-600 text-sm font-medium dark:text-blue-400 hover:underline">
                Read Now →
              </span>
            </div>
          </div>
        </div>
      </a>
    )
  }

  // Compact view - streamlined layout for browsing lists
  return (
    <a
      href={`/manga/${chapter.titleId}/chapter/${chapter.id}`}
      className="block transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm h-24 transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 ${
          isHovered ? 'shadow-md translate-y-px' : ''
        }`}
      >
        {/* Cover */}
        <div className="w-16 shrink-0 relative">
          <div className="h-full">
            <img
              src={validCover}
              alt={`${chapter.titleName} cover`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 overflow-hidden flex flex-col">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-sm text-gray-900 line-clamp-1 dark:text-white">
              {chapter.titleName}
            </h3>
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full font-medium whitespace-nowrap dark:bg-blue-900 dark:text-blue-300">
              Ch. {chapter.chapterNumber}
            </span>
          </div>

          <div className="mt-auto flex justify-between items-center text-xs">
            <span className="flex items-center text-gray-500 dark:text-gray-400">
              <Calendar size={12} className="mr-1" />
              {formatDate(chapter.addedAt)}
            </span>
            <span className="text-blue-600 font-medium dark:text-blue-400">
              Read →
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}

export default LatestChaptersPage