import { useState, useRef, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'
import { Link } from 'react-router-dom'
import 'swiper/css'
import titles from '../../data/titles'

const HeroSection = () => {
  const prevRef = useRef(null)
  const nextRef = useRef(null)
  const swiperRef = useRef(null)

  const fallbackCover = '/assets/images/covers/placeholder.jpg'

  useEffect(() => {
    if (
      swiperRef.current &&
      prevRef.current &&
      nextRef.current &&
      swiperRef.current.params?.navigation
    ) {
      swiperRef.current.params.navigation.prevEl = prevRef.current
      swiperRef.current.params.navigation.nextEl = nextRef.current
      swiperRef.current.navigation.destroy()
      swiperRef.current.navigation.init()
      swiperRef.current.navigation.update()
    }
  }, [])

  const baseCoverPath = '/assets/images/covers/'
  const baseBgPath = '/assets/images/background/'

  const mostPopular = [...titles]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 10)
    .map((title) => ({
      id: title.id,
      image: title.cover.replace('/assets/images/covers/', ''),
      title: title.title,
      genres: title.genres,
      description: title.description,
      authors: ['Yasser Latrech'],
    }))

  const [currentBg, setCurrentBg] = useState(
    `${baseCoverPath}${mostPopular[0].image}`,
  )
  const [currentIndex, setCurrentIndex] = useState(1)
  const [validImages, setValidImages] = useState(
    mostPopular.map(() => fallbackCover),
  )

  useEffect(() => {
    mostPopular.forEach((item, i) => {
      const img = new Image()
      img.src = baseCoverPath + item.image
      img.onload = () => {
        setValidImages((prev) => {
          const newArr = [...prev]
          newArr[i] = baseCoverPath + item.image
          return newArr
        })
      }
      img.onerror = () => {
        setValidImages((prev) => {
          const newArr = [...prev]
          newArr[i] = fallbackCover
          return newArr
        })
      }
    })
  }, [])

  const handleSlideChange = (swiper) => {
    const newIndex = swiper.realIndex
    setCurrentIndex(newIndex + 1)
    setCurrentBg(validImages[newIndex])
  }

  return (
    <div className="relative w-full h-[324px] md:h-[400px] lg:h-[440px] transition-all duration-500">
      <div className="absolute top-[56px] left-0 w-full z-20 px-[16px]">
        <h1 className="select-none w-full max-w-[1440px] mx-auto py-3 text-[24px] sm:text-[28px] md:text-[32px] font-bold text-black dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">
          Popular New Titles
        </h1>
      </div>

      <div className="absolute z-30 md:top-[calc(157px+200px)] lg:top-[calc(185px+200px)] right-[5%] gap-2 hidden md:flex">
        <div className="self-center">
          <span
            className={`font-bold p-4 mt-2 ${currentIndex === 1 ? 'text-[#9d0208] dark:text-[#fca311]' : 'text-black dark:text-white'}`}
          >
            NO. {currentIndex}
          </span>
        </div>
        <button
          ref={prevRef}
          className="px-2 py-1 text-[#003554] dark:text-[#D7E3FC] hover:text-[#00355496] dark:hover:text-[#d7e3fca9] transition"
        >
          ◀
        </button>
        <button
          ref={nextRef}
          className="px-2 py-1 text-[#003554] dark:text-[#D7E3FC] hover:text-[#00355496] dark:hover:text-[#d7e3fca9] transition"
        >
          ▶
        </button>
      </div>

      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        onSlideChange={handleSlideChange}
        slidesPerView={1}
        loop={true}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        modules={[Autoplay, Navigation]}
        className="w-full h-full"
      >
        {mostPopular.map((bg, index) => (
          <SwiperSlide key={bg.id}>
            <Link
              to={`/manga/${bg.id}`}
              className="relative w-full h-full flex justify-center"
              style={{
                backgroundImage: `url(${
                  window.innerWidth < 768
                    ? validImages[index]
                    : baseBgPath + bg.image
                }), url(${fallbackCover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 30%',
                transition: 'background-image 0.5s ease-in-out',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#EDF2FB]/40 to-[#EDF2FB]/100 dark:from-[#051923]/40 dark:to-[#051923]/100"></div>

              <div className="absolute z-20 inset-x-0 top-[108px] h-[160px] md:h-[276px] lg:h-[306px] px-[1rem] p-3 md:pt-2">
                <div className="w-full max-w-[1440px] mx-auto h-full grid grid-cols-[fit-content(100%)_1fr] gap-[1rem]">
                  <img
                    onContextMenu={(e) => e.preventDefault()}
                    src={validImages[index]}
                    alt={bg.title}
                    className="rounded-[8px] w-[112px] h-[160px] md:w-[194px] md:h-[276px] lg:w-[215px] lg:h-[307px] object-cover"
                  />

                  <div className="relative flex flex-col h-full overflow-hidden">
                    <h2 className="text-[20px] sm:text-[24px] md:text-[28px] lg:text-[32px] xl:text-[36px] font-bold text-black dark:text-white">
                      {bg.title}
                    </h2>

                    <div className="text-[#D7E3FC] dark:text-[#003554] mt-1 md:mt-2">
                      {bg.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {bg.genres.map((genre, idx) => (
                            <span
                              key={idx}
                              className="bg-[#003554] dark:bg-[#D7E3FC] rounded px-2 py-1 text-[0.8rem]"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="hidden md:block mt-2 text-[16px] text-[#002135] dark:text-[#f4f8ff] overflow-hidden text-ellipsis">
                      {bg.description}
                    </p>

                    <div className="mt-auto text-[1.1rem] text-[#003554] dark:text-[#D7E3FC] hidden md:block italic">
                      {bg.authors.join(', ')}
                    </div>
                  </div>

                  <div className="block md:hidden text-[14px] text-[#003554] dark:text-[#D7E3FC] italic">
                    {bg.authors.join(', ')}
                  </div>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default HeroSection
