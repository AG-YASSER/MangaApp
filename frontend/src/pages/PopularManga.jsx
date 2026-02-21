import MangaListPage from '../components/Searchpages/MangaListPage'
import titles from '../data/titles'

const popular = titles
  .slice() // ننسخ المصفوفة باش ما نعدلوش الأصل
  .sort((a, b) => b.likes - a.likes) // الترتيب حسب الإعجابات

function PopularManga() {
  return (
    <MangaListPage title="Popular Mangas" data={popular} showSearchHeader />
  )
}

export default PopularManga
