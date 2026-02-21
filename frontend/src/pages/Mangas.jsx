import MangaListPage from '../components/Searchpages/MangaListPage'
import titles from '../data/titles'

function Mangas() {
  return (
    <div>
      <MangaListPage
        title="Manga Explorer"
        data={titles}
        showSearchHeader={true}
      />
    </div>
  )
}

export default Mangas
