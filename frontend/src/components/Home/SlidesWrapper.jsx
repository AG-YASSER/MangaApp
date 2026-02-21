import titles from '../../data/titles'
import MangaSlider from './MangaSlider'

const SlidesWrapper = () => {
  // Recently Added
  const recentlyAddedMangaList = [...titles]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20)

  // Most Popular
  const popularMangaList = [...titles]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 20)

  return (
    <div className="inset-x-0 px-4 py-6">
      <div className="w-full max-w-[1440px] mx-auto">
        <div className="mb-12">
          <MangaSlider title="Most Popular" manga={popularMangaList} />
        </div>
        <div>
          <MangaSlider title="Recently Added" manga={recentlyAddedMangaList} />
        </div>
      </div>
    </div>
  )
}

export default SlidesWrapper
