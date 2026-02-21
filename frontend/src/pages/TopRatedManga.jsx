import MangaListPage from '../components/Searchpages/MangaListPage'
import titles from '../data/titles'

const topRated = titles.slice().sort((a, b) => b.rating - a.rating) // أعلى تقييم أولاً

function TopRatedManga() {
  return (
    <MangaListPage title="Top Rated Mangas" data={topRated} showSearchHeader />
  )
}

export default TopRatedManga
