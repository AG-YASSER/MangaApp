import { useState, useEffect } from 'react'
import { Star, Heart, MessageSquare, Eye, Info } from 'lucide-react'
import { Link } from 'react-router-dom'

function TitleCard({ title, viewMode = 'grid' }) {
  const fallbackCover = '/assets/images/covers/placeholder.jpg'
  const [validCover, setValidCover] = useState(fallbackCover)
  const [isHovered, setIsHovered] = useState(false)

useEffect(() => {
  if (!title?.cover) return

  const imagePath = `/assets/images/covers/${title.cover}`
  const img = new Image()
  img.src = imagePath
  img.onload = () => setValidCover(imagePath)
  img.onerror = () => setValidCover(fallbackCover)
}, [title?.cover])

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'text-cyan-500'
      case 'Ongoing':
        return 'text-green-500'
      case 'Hiatus':
        return 'text-amber-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-cyan-500'
      case 'Ongoing':
        return 'bg-green-500'
      case 'Hiatus':
        return 'bg-amber-500'
      default:
        return 'bg-gray-500'
    }
  }

  const truncateText = (text, maxLength) =>
    text && text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text || ''

  // Wrapping component with Link
  const CardWrapper = ({ children }) => (
    <Link
      to={`/manga/${title.id}`}
      className="block h-full transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </Link>
  )

  const renderGenreTags = (limit) => (
    <div className="flex flex-wrap gap-1">
      {title.genres.slice(0, limit).map((genre) => (
        <span
          key={genre}
          className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full dark:bg-gray-700 dark:text-gray-300"
        >
          {genre}
        </span>
      ))}
      {title.genres.length > limit && (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center dark:bg-gray-700 dark:text-gray-300">
          <Info size={10} className="mr-0.5" />+{title.genres.length - limit}
        </span>
      )}
    </div>
  )

  // List view - detailed card with description
  if (viewMode === 'list') {
    return (
      <CardWrapper>
        <div
          className={`flex bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm h-full transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 ${isHovered ? 'shadow-md translate-y-px' : ''}`}
        >
          {/* Cover image with consistent aspect ratio */}
          <div className="w-32 md:w-40 lg:w-48 shrink-0 relative">
            <div className="aspect-[3/4] w-full h-full">
              <img
                src={validCover}
                alt={title.title}
                className="w-full h-full object-cover"
              />
              {/* Status indicator */}
              <div className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs text-white font-medium shadow-sm flex items-center gap-1 backdrop-blur-sm bg-opacity-80 bg-gray-800 dark:bg-gray-600">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusBgColor(title.status)}`}
                ></div>
                <span>{title.status}</span>
              </div>
              {/* Country flag */}
              {title.flag && (
                <div className="absolute top-2 right-2">
                  <span className="text-lg text-white dark:text-gray-300">
                    {title.flag}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <h3 className="font-bold text-lg text-gray-900 line-clamp-1 dark:text-white">
              {title.title}
            </h3>

            {/* Tags/Genres */}
            <div className="mt-2 mb-3">{renderGenreTags(4)}</div>

            {/* Description with gradient fade for overflow */}
            <div className="relative mb-auto">
              <p className="text-gray-600 text-sm line-clamp-3 dark:text-gray-300">
                {truncateText(title.description, 200)}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent dark:from-gray-800 dark:to-transparent"></div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-between items-center gap-y-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center text-gray-700 dark:text-gray-300">
                  <Star size={16} className="text-yellow-500 mr-1" />
                  {title.rating}
                </span>
                <span className="flex items-center text-gray-700 dark:text-gray-300">
                  <Heart size={16} className="text-red-500 mr-1" />
                  {title.likes}
                </span>
                <span className="flex items-center text-gray-700 dark:text-gray-300">
                  <Eye size={16} className="text-blue-500 mr-1" />
                  {title.views}
                </span>
                <span className="flex items-center text-gray-700 dark:text-gray-300">
                  <MessageSquare size={16} className="text-green-500 mr-1" />
                  {title.comments}
                </span>
              </div>

              {/* Right side - custom accent tag if available */}
              {title.colorTag && (
                <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full shadow-sm dark:bg-gray-600">
                  {title.colorTag}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardWrapper>
    )
  }

  // Compact view - streamlined layout for browsing lists
  if (viewMode === 'compact') {
    return (
      <CardWrapper>
        <div
          className={`flex bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm h-28 transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 ${isHovered ? 'shadow-md translate-y-px' : ''}`}
        >
          {/* Cover */}
          <div className="w-20 md:w-24 shrink-0 relative">
            <div className="h-full">
              <img
                src={validCover}
                alt={title.title}
                className="w-full h-full object-cover"
              />

              {/* Status indicator dot */}
              <div className="absolute bottom-2 right-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full border-2 border-white ${getStatusBgColor(title.status)}`}
                ></span>
              </div>

              {/* Flag icon overlay */}
              {title.flag && (
                <div className="absolute top-1 left-1">
                  <span className="text-sm text-white">{title.flag}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-3 overflow-hidden flex flex-col">
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 dark:text-white">
              {title.title}
            </h3>

            {/* Tags */}
            <div className="mt-1 mb-1">{renderGenreTags(2)}</div>

            {/* Stats */}
            <div className="flex justify-between items-center mt-auto">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center">
                  <Star size={12} className="text-yellow-500 mr-0.5" />
                  {title.rating}
                </span>
                <span className="flex items-center">
                  <Heart size={12} className="text-red-500 mr-0.5" />
                  {title.likes}
                </span>
                <span className="flex items-center">
                  <MessageSquare size={12} className="text-green-500 mr-0.5" />
                  {title.comments}
                </span>
              </div>
              <span
                className={`text-xs font-medium ${getStatusColor(title.status)} dark:text-gray-300`}
              >
                {title.status}
              </span>
            </div>
          </div>
        </div>
      </CardWrapper>
    )
  }

  // Grid view (default) - cover-focused for gallery layouts
  return (
    <CardWrapper>
      <div
        className={`flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 ${isHovered ? 'shadow-md translate-y-px' : ''}`}
      >
        <div className="relative flex-shrink-0">
          <div className="aspect-[3/4] w-full h-full">
            <img
              src={validCover}
              alt={title.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs text-white font-medium shadow-sm flex items-center gap-1 backdrop-blur-sm bg-opacity-80 bg-gray-800 dark:bg-gray-600">
              <div
                className={`w-2 h-2 rounded-full ${getStatusBgColor(title.status)}`}
              ></div>
              <span>{title.status}</span>
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  )
}

export default TitleCard
