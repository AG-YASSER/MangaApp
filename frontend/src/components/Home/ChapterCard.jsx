import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Link } from 'react-router-dom'

dayjs.extend(relativeTime)

function ChapterCard({ id, titleId, cover, title, chapter, author, addedAt }) {
  const fallbackCover = '/assets/images/covers/placeholder.jpg'
  const baseCoverPath = '/assets/images/covers/'
  const [validCover, setValidCover] = useState(fallbackCover)

  useEffect(() => {
    if (!cover) return

    const fullCoverPath = baseCoverPath + cover
    const img = new Image()
    img.src = fullCoverPath
    img.onload = () => setValidCover(fullCoverPath)
    img.onerror = () => setValidCover(fallbackCover)
  }, [cover])

  return (
    <Link
      to={`/manga/${titleId}/chapter/${id}`}
      className="flex items-center h-25 w-full gap-3 overflow-hidden dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-[#263653] transition cursor-pointer"
    >
      <img
        src={validCover}
        alt={title}
        className="w-16 h-24 object-cover rounded-md"
      />

      <div className="flex flex-col justify-between flex-1 h-full max-h-24 py-0 overflow-hidden">
        <div className="flex-1 min-w-0 w-full overflow-hidden">
          <div
            className="font-semibold text-base truncate max-w-full"
            title={title}
          >
            {title}
          </div>
          <p className="text-sm">Chapter {chapter}</p>
        </div>

        <div className="flex justify-between items-start text-xs mt-2">
          <div className="text-[14px] leading-tight">
            <p>{author}</p>
            <p>Added {dayjs(addedAt).fromNow()}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ChapterCard
