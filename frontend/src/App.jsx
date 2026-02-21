import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header/Header'
import Home from './pages/Home'
import Mangas from './pages/Mangas'
import PopularManga from './pages/PopularManga'
import RecentManga from './pages/RecentManga'
import TopRatedManga from './pages/TopRatedManga'
import MangaPage from './pages/MangaPage'
import ChapterPage from './pages/ChapterPage'
import LatestChaptersPage from './components/LatestChaptersPage'

function App() {
  const location = useLocation()
  console.log(location)
  const hideHeader = /^\/manga\/[^/]+\/chapter\/[^/]+$/.test(location.pathname)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <div className="font-Rubik-Regular min-h-dvh bg-[#EDF2FB] dark:bg-[#051923] transition-colors ease-in-out 0.5">
      {!hideHeader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/titles" element={<Mangas />} />
        <Route path="/latest-updates" element={<LatestChaptersPage />} />
        <Route path="/most-popular" element={<PopularManga />} />
        <Route path="/recently-added" element={<RecentManga />} />
        <Route path="/top-rated" element={<TopRatedManga />} />
        <Route path="/manga/:id" element={<MangaPage />} />
        <Route path="/manga/:titleId/chapter/:id" element={<ChapterPage />} />
      </Routes>
    </div>
  )
}

export default App
