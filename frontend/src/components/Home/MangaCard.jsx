// src/components/MangaCard.jsx
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function MangaCard({
  id,
  title = 'Untitled',
  description = 'No description available.',
  cover,
  lang = '🇯🇵',
}) {
  const fallbackCover = '/assets/images/covers/placeholder.jpg'
  const [validCover, setValidCover] = useState(fallbackCover)

  useEffect(() => {
    if (!cover) return

    const imagePath = `/assets/images/covers/${cover}`
    const img = new Image()
    img.src = imagePath
    img.onload = () => setValidCover(imagePath)
    img.onerror = () => setValidCover(fallbackCover)
  }, [cover])

  return (
    <Link
      to={`/manga/${id}`}
      className="relative group cursor-pointer w-full max-w-[220px] min-w-[130px] min-h-[230px]"
    >
      {/* Cover */}
      <div
        className="w-full aspect-[13/18] min-h-[180px] bg-amber-400 rounded-md"
        style={{
          backgroundImage: `url(${validCover})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>

      {/* Title */}
      <div className="text-black dark:text-white py-1 line-clamp-2 text-sm sm:text-base">
        {title}
      </div>

      {/* Hover Overlay */}
      <div className="absolute top-0 left-0 w-full aspect-[13/18] min-h-[180px] bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 pr-1 rounded-md z-10">
        {/* Description */}
        <p className="text-white text-xs sm:text-sm overflow-y-auto max-h-[140px] pr-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900 scrollbar-thumb-rounded">
          {description}
        </p>

        {/* Read button */}
        <div className="bg-white text-black px-3 py-1 rounded flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold hover:bg-gray-200 cursor-pointer">
          Read <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  )
}

export default MangaCard
