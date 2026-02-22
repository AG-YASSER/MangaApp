import { User,  UserRoundCog , LogIn, Store, Settings  } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const Profile = () => {
  const [isOpen, setIsOpen] = useState(false)
  const profileRef = useRef(null)
  const profileNavRef = useRef(null)

  const menuItems = [
    <UserRoundCog  size={30} className="text-black dark:text-white" />,
    <Store size={30} className="text-black dark:text-white" />,
    <LogIn size={30} className="text-black dark:text-white" />,
    <Settings size={30} className="text-black dark:text-white" />
  ]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target) &&
        profileNavRef.current &&
        !profileNavRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <>
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 bg-white/40 dark:bg-black/40 z-40"
            onClick={() => setIsOpen(false)}
          />,
          document.body
        )}
    <div className="relative">
      <div
        ref={profileRef}
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-10 min-w-10 rounded-full bg-white/50 dark:bg-black/50 text-[#003554] dark:text-[#CCDBFD] 
            transition-colors duration-300 hover:bg-white/70 dark:hover:bg-black/70 
            focus:outline-none focus:ring-2 focus:ring-[#003554] dark:focus:ring-[#CCDBFD] cursor-pointer flex items-center justify-center"
      >
        <User size={30} className="text-black dark:text-white" />
      </div>

      {isOpen && (
        <div
          ref={profileNavRef}
          className="absolute top-13 -right-2 bg-white dark:bg-black p-1 rounded-lg shadow-xl border border-[#051923] dark:border-[#EDF2FB] z-50"
        >
          <div>
            {menuItems.map((item, index) => (
              <ProfileNavItem key={index} item={item} setIsOpen={setIsOpen} />
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default Profile

const ProfileNavItem = ({ item, setIsOpen }) => (
  <button onClick={() => setIsOpen(false)}
  className="min-h-10 min-w-10 rounded-full text-[#003554] dark:text-[#CCDBFD] 
            transition-colors duration-300 hover:bg-[#e5e5e5] dark:hover:bg-[#003566] 
            focus:outline-none focus:ring-2 focus:ring-[#003554] dark:focus:ring-[#CCDBFD] cursor-pointer flex items-center justify-center mt-2 first:mt-0">
    <a href='#'>{item}</a>
  </button>
)
