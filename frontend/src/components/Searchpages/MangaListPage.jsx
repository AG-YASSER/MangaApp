import { useState, useEffect } from 'react'
import SearchHeader from './SearchHeader'
import TitleList from './TitleList'
import Pagination from './Pagination'
import ViewToggle from './ViewToggle'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function MangaListPage({ title, data, showSearchHeader = false }) {
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('')
  const [filteredTitles, setFilteredTitles] = useState(data)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState('grid')
  const titlesPerPage = 12

  useEffect(() => {
    let results = data

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (title) =>
          title.title.toLowerCase().includes(query) ||
          title.description.toLowerCase().includes(query),
      )
    }

    if (selectedGenres.length > 0) {
      results = results.filter((title) =>
        selectedGenres.every((genre) => title.genres.includes(genre)),
      )
    }

    if (selectedStatus) {
      results = results.filter((title) => title.status === selectedStatus)
    }

    setFilteredTitles(results)
    setCurrentPage(1)
  }, [searchQuery, selectedGenres, selectedStatus, data])

  const indexOfLastTitle = currentPage * titlesPerPage
  const indexOfFirstTitle = indexOfLastTitle - titlesPerPage
  const currentTitles = filteredTitles.slice(
    indexOfFirstTitle,
    indexOfLastTitle,
  )
  const totalPages = Math.ceil(filteredTitles.length / titlesPerPage)

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedGenres([])
    setSelectedStatus('')
  }

  const handleFeelingLucky = () => {
    const randomIndex = Math.floor(Math.random() * filteredTitles.length)
    alert(`Random selection: ${filteredTitles[randomIndex].title}`)
  }

  return (
    <div className="inset-x-0 px-4 pt-16">
      <div className="max-w-[1440px] mx-auto pt-10 py-6">
        {/* Header */}
        <div className="flex items-center mb-4 text-black dark:text-white">
          <ArrowLeft
            className="mr-2 cursor-pointer"
            size={25}
            onClick={() => navigate(-1)}
          />
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>

        {/* Search Header (optional) */}
        {showSearchHeader && (
          <SearchHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedGenres={selectedGenres}
            setSelectedGenres={setSelectedGenres}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            onResetFilters={handleResetFilters}
            onFeelingLucky={handleFeelingLucky}
          />
        )}

        {/* View toggle */}
        <div className="flex justify-end mb-4">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>

        {/* Titles list */}
        <TitleList titles={currentTitles} viewMode={viewMode} />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}

export default MangaListPage
