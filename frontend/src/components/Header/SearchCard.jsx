import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, Heart, MessageSquare, Eye } from 'lucide-react'

const SearchCard = ({
  id,
  title,
  rating,
  likes,
  totalViews,
  comments,
  status,
  cover,
  country, // تأكد أن country هو كود الدولة بحروف كبيرة (مثلاً 'US', 'KR')
}) => {
  const fallbackCover = '/assets/images/covers/placeholder.jpg'
  const [validCover, setValidCover] = useState(fallbackCover)

  useEffect(() => {
    if (!cover) return
    const img = new Image()
    img.src = `/assets/images/covers/${cover}`
    img.onload = () => setValidCover(`/assets/images/covers/${cover}`)
    img.onerror = () => setValidCover(fallbackCover)
  }, [cover])

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-cyan-400'
      case 'ongoing':
        return 'bg-green-400'
      case 'hiatus':
        return 'bg-yellow-400'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <Link to={`/manga/${id}`} className="block hover:cursor-pointer">
      <div className="my-1.5 hover:bg-[#ABC4FF] dark:bg-[#1b263b] bg-[#EDF2FB] dark:hover:bg-[#415a77] text-[#051923] dark:text-[#fdf0d5] p-[6px] rounded-md flex items-center gap-4 w-full transition-all duration-200 shadow-md hover:shadow-lg">
        <img
          src={validCover}
          alt={title}
          className="w-[56px] h-[80px] object-cover rounded"
        />
        <div className="flex-1 pointer-events-none">
          <h2 className="font-bold text-lg">{title}</h2>
          <div className="flex flex-wrap text-sm gap-3 mt-1 items-center text-gray-800 dark:text-gray-100">
            <span className="flex items-center">
              <Star size={14} className="text-yellow-500 mr-1" />
              {rating}
            </span>
            <span className="flex items-center">
              <Heart size={14} className="text-red-500 mr-1" />
              {likes.toLocaleString()}
            </span>
            <span className="flex items-center">
              <Eye size={14} className="text-blue-500 mr-1" />
              {totalViews.toLocaleString()}
            </span>
            <span className="flex items-center">
              <MessageSquare size={14} className="text-green-500 mr-1" />
              {comments.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1 text-sm">
            <div className="flex items-center gap-2 bg-[#dce8ff] dark:bg-[#263653] text-black dark:text-white px-2 py-0.5 rounded w-fit">
              <span
                className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}
              ></span>
              <span>{status}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default SearchCard
