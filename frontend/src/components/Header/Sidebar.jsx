import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        className={clsx(
          'fixed inset-0 bg-black/60 z-40 transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />
      <aside
        className={clsx(
          'fixed z-50 top-0 h-full w-[280px] bg-[#EDF2FB] dark:bg-[#051923] shadow-lg transition-transform',
          'lg:left-0 lg:translate-x-0 lg:static lg:block',
          isOpen ? 'left-0' : '-left-full lg:left-0'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex items-center gap-2">
            <img src="/DarkLogo.svg" className="h-10 dark:hidden" />
            <img src="/LightLogo.svg" className="h-10 hidden dark:block" />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-700 dark:text-gray-200"
          >
            <X />
          </button>
        </div>
        <nav className="p-4 flex flex-col gap-4 text-[#003554] dark:text-[#CCDBFD]">
          <Link to="/" onClick={onClose}>Home</Link>
          <Link to="/titles" onClick={onClose}>All Mangas</Link>
          <Link to="/most-popular" onClick={onClose}>Popular</Link>
          <Link to="/recently-added" onClick={onClose}>Recent</Link>
          <Link to="/top-rated" onClick={onClose}>Top Rated</Link>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
