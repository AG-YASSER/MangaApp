import chapters from '../../data/chapters'
import ChapterList from './ChapterList'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const splitIntoGroups = (array, size) => {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

const LatestUpdates = () => {
  const chapterGroups = splitIntoGroups(chapters, 6)
  const [visibleCount, setVisibleCount] = useState(1)

  const handleResize = () => {
    const width = window.innerWidth
    if (width >= 1536) setVisibleCount(4)
    else if (width >= 1280) setVisibleCount(3)
    else if (width >= 640) setVisibleCount(2)
    else setVisibleCount(1)
  }

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="inset-x-0 px-4">
      <div className="w-full max-w-[1440px] mx-auto">
        <div className="flex justify-between items-center py-6">
          <Link
            to="/latest-updates"
            className="text-[24px] sm:text-[28px] md:text-[32px] font-bold text-black dark:text-white"
          >
            Latest Updates
          </Link>

          <Link
            to="/latest-updates"
            className="flex items-center text-xl text-black dark:text-white hover:text-gray-500"
          >
            <span className="mr-2 hidden md:block">Go to Latest Updates</span>
            <ArrowRight />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {chapterGroups.slice(0, visibleCount).map((group, index) => (
            <ChapterList key={index} chapters={group} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LatestUpdates
