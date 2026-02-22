import ThemeToggle from './ThemeToggle'
import SearchBar from './SearchBar'
import Profile from './Profile'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'

function Header() {
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(() => {
    const saved = localStorage.getItem('menu')
    return saved === 'true'
  })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMenu = () => {
    const newState = !menuOpen
    setMenuOpen(newState)
    localStorage.setItem('menu', newState)
  }

  return (
    <nav
      className={`fixed w-full transition-colors duration-300 z-50 ${
        scrolled && !isMobileSearchActive
          ? 'bg-white/10 dark:bg-black/10  backdrop-blur-md border-b border-[#051923] dark:border-[#EDF2FB] transition-all ease-in-out duration-300'
          : 'bg-transparent border-b-0'
      }`}
    >
      <div className="flex items-center justify-between px-[16px] w-full max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="h-[56px] flex items-center">
            <img
              src="/logo.png"
              alt="Website Logo Light"
              className="h-[50px]  w-auto max-w-[150px] object-contain block dark:hidden"
            />
            <img
              src="/dark.logo.png"
              alt="Website Logo Dark"
              className="h-[50px]  w-auto max-w-[146px] object-contain hidden dark:block"
            />
          </Link>
        </div>

        <div className="flex justify-end items-center space-x-4 w-[800px]">
          <SearchBar onMobileSearchChange={setIsMobileSearchActive} />
          <ThemeToggle />
          <Profile />
        </div>
      </div>
    </nav>
  )
}

export default Header
