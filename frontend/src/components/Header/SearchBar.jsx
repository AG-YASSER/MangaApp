import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import SearchCard from './SearchCard'
import titles from '../../data/titles'

const SearchBar = ({ onMobileSearchChange }) => {
  const [isFocused, setIsFocused] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const searchRef = useRef(null)
  const mobileSearchRef = useRef(null)

  const filteredManga = titles.filter((manga) =>
    manga.title.toLowerCase().includes(inputValue.toLowerCase()),
  )

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target)
      ) {
        setIsFocused(false)
        setShowSearchBar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    let timeout
    if (isFocused) {
      setShowMobileSearch(true)
      timeout = setTimeout(() => setShowResults(true), 50)
    } else {
      setShowResults(false)
      timeout = setTimeout(() => setShowMobileSearch(false), 300)
    }
    return () => clearTimeout(timeout)
  }, [isFocused])

  useEffect(() => {
    if (showSearchBar) {
      setShowMobileSearch(true)
      onMobileSearchChange(true)
    } else if (!isFocused) {
      const timeout = setTimeout(() => {
        setShowMobileSearch(false)
        onMobileSearchChange(false)
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [showSearchBar, isFocused, onMobileSearchChange])

  return (
    <>
      {isFocused && (
        <div
          className="fixed w-full inset-0 bg-white/30 dark:bg-black/30 z-0"
          onClick={() => setIsFocused(false)}
        />
      )}

      <div
        ref={searchRef}
        className={`${!isFocused ? 'w-full max-w-[300px]' : 'flex-grow'} relative transition-all ease-in-out duration-400 z-10`}
      >
        <input
          type="text"
          placeholder="Search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onFocus={() => setIsFocused(true)}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-0 md:w-full h-[32px] py-[4px] px-[16px] rounded-lg outline-none text-2xl leading-[36px] bg-white/50 dark:bg-black/50 text-black dark:text-white placeholder-[#003554] dark:placeholder-[#CCDBFD] focus:bg-white/70 dark:focus:bg-black/70 border border-transparent focus:border-[#003554] dark:focus:border-[#CCDBFD] transition-all ease-in-out duration-300 absolute right-0.5 top-1/2 -translate-y-1/2 cursor-default md:cursor-text"
        />

        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              setShowSearchBar(!showSearchBar)
              if (!showSearchBar) setIsFocused(true)
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#003554] dark:text-[#CCDBFD] cursor-pointer md:cursor-auto"
        >
          <Search size={22} />
        </button>

        {inputValue && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setInputValue('')}
            className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 bg-[#003554] dark:bg-[#D7E3FC] rounded-[25%] text-[#D7E3FC] dark:text-[#003554]"
            tabIndex="-1"
          >
            <X size={22} />
          </button>
        )}

        <div
          className={`hidden md:block absolute top-3 right-0.5 w-full mt-2 bg-[#edf2fbdc] dark:bg-[#051923cc] shadow-md rounded-lg z-10 border-transparent transition-all ease-in-out duration-300 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900 scrollbar-thumb-rounded
            ${isFocused ? 'opacity-100 border-[#003554] dark:border-[#CCDBFD]' : 'opacity-0 pointer-events-none border-transparent'}
            ${showResults ? 'max-h-96 p-4 overflow-y-auto' : 'max-h-0 p-0 overflow-hidden'}`}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div
            className={`transition-opacity duration-300 ${showResults ? 'opacity-100' : 'opacity-0'}`}
          >
            {inputValue === '' ? (
              <p className="mb-2 dark:text-white">Enter a search query...</p>
            ) : filteredManga.length > 0 ? (
              filteredManga.map((manga) => (
                <SearchCard key={manga.id} {...manga} />
              ))
            ) : (
              <p className="mb-2 dark:text-white">
                No results found for "{inputValue}"
              </p>
            )}
          </div>
        </div>

        {showMobileSearch && (
          <div
            ref={mobileSearchRef}
            className={`fixed top-0 left-0 w-screen flex flex-col bg-white/10 dark:bg-black/10 backdrop-blur-md md:hidden z-10
              transition-all ease-in-out duration-300 
              ${isFocused || showSearchBar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}
          >
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  className="w-full py-[6px] px-4 rounded-lg text-lg outline-none bg-white/50 dark:bg-black/50 text-black dark:text-white placeholder-[#003554] dark:placeholder-[#CCDBFD] focus:bg-white/70 dark:focus:bg-black/70 border border-transparent focus:border-[#003554] dark:focus:border-[#CCDBFD] transition-all ease-in-out duration-300"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Search
                    size={22}
                    className="text-[#003554] dark:text-[#CCDBFD]"
                  />
                </button>
                {inputValue && (
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#003554] dark:bg-[#D7E3FC] rounded-[25%] text-[#D7E3FC] dark:text-[#003554]"
                    onClick={() => setInputValue('')}
                  >
                    <X size={22} />
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setShowSearchBar(false)
                  setIsFocused(false)
                }}
              >
                <X
                  size={22}
                  className="text-[#003554] dark:text-[#CCDBFD] rounded-[25%] hover:bg-[#780000] hover:text-[#fdf0d5] transition-colors ease-in-out duration-200"
                />
              </button>
            </div>

            <div
              className={`w-full shadow-md transition-all ease-in-out duration-300
                ${showResults ? 'max-h-96 p-4 overflow-y-auto' : 'max-h-0 p-0 overflow-hidden'}`}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div
                className={`transition-opacity duration-300 ${showResults ? 'opacity-100' : 'opacity-0'}`}
              >
                {inputValue === '' ? (
                  <p className="mb-2 text-black dark:text-white">
                    Enter a search query...
                  </p>
                ) : filteredManga.length > 0 ? (
                  filteredManga.map((manga) => (
                    <SearchCard key={manga.id} {...manga} />
                  ))
                ) : (
                  <p className="mb-2 text-black dark:text-white">
                    No results found for "{inputValue}"
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default SearchBar
