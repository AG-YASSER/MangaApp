import MangaListPage from '../components/Searchpages/MangaListPage'
import titles from '../data/titles'

const recent = titles
  .slice()
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // الأحدث أولاً

function RecentManga() {
  return <MangaListPage title="Recently Added" data={recent} showSearchHeader />
}

export default RecentManga
