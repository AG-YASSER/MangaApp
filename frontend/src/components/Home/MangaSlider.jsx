import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import MangaCard from './MangaCard'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

// helper function to slugify titles
const toSlug = (str) =>
  str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')

const MangaSlider = ({ title, manga }) => {
  const slug = toSlug(title)

  return (
    <>
      <div className="flex justify-between items-center py-6">
        {/* Title as a link */}
        <Link
          to={`/${slug}`}
          className="text-[24px] sm:text-[28px] md:text-[32px] font-bold text-black dark:text-white"
        >
          {title}
        </Link>

        {/* Arrow icon as link */}
        <Link
          to={`/${slug}`}
          className="flex items-center text-xl text-black dark:text-white hover:text-gray-500"
        >
          <span className="mr-2 hidden md:block">Go to {title}</span>
          <ArrowRight />
        </Link>
      </div>

      <Swiper
        spaceBetween={8}
        loop={true}
        breakpoints={{
          0: { slidesPerView: 2 },
          480: { slidesPerView: 3 },
          640: { slidesPerView: 4 },
          768: { slidesPerView: 5 },
          1024: { slidesPerView: 6 },
          1280: { slidesPerView: 7 },
        }}
      >
        {manga.map((item) => (
          <SwiperSlide key={item.id}>
            <MangaCard
              id={item.id}
              title={item.title}
              description={item.description}
              cover={item.cover}
              lang={item.lang}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  )
}

export default MangaSlider
