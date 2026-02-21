import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Home,
  List,
  Share2,
  Menu,
  X,
  BookOpen,
  Maximize,
  ArrowLeft,
  ArrowRight,
  Heart,
  MessageCircle
} from 'lucide-react';
import chapters from '../data/chapters';
import titles from '../data/titles';

const ChapterPage = () => {
  const { titleId, id } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [manga, setManga] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [readerSettings, setReaderSettings] = useState({
    direction: 'vertical', // vertical or horizontal
    fitMode: 'width', // width, height, or original
    backgroundColor: 'dark', // light, dark, or black
  });
  
  // Find prev and next chapters
  const [prevChapter, setPrevChapter] = useState(null);
  const [nextChapter, setNextChapter] = useState(null);
  
  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout;
    
    const resetTimer = () => {
      clearTimeout(timeout);
      setShowControls(true);
      
      timeout = setTimeout(() => {
        if (!showSettings) {
          setShowControls(false);
        }
      }, 3000);
    };
    
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('keydown', resetTimer);
    
    resetTimer();
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [showSettings]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const currentChapter = chapters.find((c) => c.id === parseInt(id));
    if (currentChapter) {
      setChapter(currentChapter);
      
      const mangaData = titles.find((t) => t.id === parseInt(titleId));
      setManga(mangaData);
      
      const mangaChapters = chapters
        .filter((c) => c.titleId === parseInt(titleId))
        .sort((a, b) => a.chapterNumber - b.chapterNumber);
      
      const currentIndex = mangaChapters.findIndex((c) => c.id === parseInt(id));
      
      if (currentIndex > 0) {
        setPrevChapter(mangaChapters[currentIndex - 1]);
      } else {
        setPrevChapter(null);
      }
      
      if (currentIndex < mangaChapters.length - 1) {
        setNextChapter(mangaChapters[currentIndex + 1]);
      } else {
        setNextChapter(null);
      }
    }
  }, [id, titleId]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && prevChapter) {
        navigate(`/manga/${titleId}/chapter/${prevChapter.id}`);
      } else if (e.key === 'ArrowRight' && nextChapter) {
        navigate(`/manga/${titleId}/chapter/${nextChapter.id}`);
      } else if (e.key === 'Escape') {
        setShowSettings(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, prevChapter, nextChapter, titleId]);
  
  if (!chapter || !manga) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#EDF2FB] dark:bg-[#051923] transition-colors">
        <div className="text-[#003554] dark:text-[#CCDBFD] p-6">Loading chapter...</div>
      </div>
    );
  }
  
  // Apply reader settings
  const getBackgroundColor = () => {
    switch (readerSettings.backgroundColor) {
      case 'light': return 'bg-[#EDF2FB] dark:bg-[#EDF2FB]';
      case 'dark': return 'bg-[#051923] dark:bg-[#051923]';
      case 'black': return 'bg-black dark:bg-black';
      default: return 'bg-[#051923] dark:bg-[#051923]';
    }
  };
  
  const getFitMode = () => {
    switch (readerSettings.fitMode) {
      case 'width': return 'w-full h-auto';
      case 'height': return 'h-screen w-auto';
      case 'original': return 'w-auto h-auto';
      default: return 'w-full h-auto';
    }
  };
  
  const getContainerClass = () => {
    if (readerSettings.direction === 'horizontal') {
      return 'flex flex-row overflow-x-auto snap-x snap-mandatory';
    }
    return 'flex flex-col space-y-2';
  };
  
  const getPageContainerClass = () => {
    if (readerSettings.direction === 'horizontal') {
      return 'min-w-full flex justify-center snap-center';
    }
    return 'flex justify-center';
  };

  // Derive text colors based on theme mode
  const getTextColorClass = (backgroundColor) => {
    switch (backgroundColor) {
      case 'light': return 'text-[#003554]';
      case 'dark': 
      case 'black': 
      default: return 'text-[#CCDBFD]';
    }
  };
  
  const getPrimaryTextColor = () => getTextColorClass(readerSettings.backgroundColor);
  const getSecondaryTextColor = () => {
    switch (readerSettings.backgroundColor) {
      case 'light': return 'text-gray-600';
      case 'dark': 
      case 'black': 
      default: return 'text-gray-400';
    }
  };

  const getButtonClass = (isActive = true) => {
    const baseClass = 'transition rounded-lg flex items-center gap-2 ';
    
    if (!isActive) {
      return `${baseClass} ${
        readerSettings.backgroundColor === 'light' 
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
          : 'bg-gray-800 text-gray-600 cursor-not-allowed'
      }`;
    }

    return `${baseClass} ${
      readerSettings.backgroundColor === 'light'
        ? 'bg-[#003554] hover:bg-[#00476F] text-white'
        : 'bg-gray-800 hover:bg-gray-700 text-[#CCDBFD]'
    }`;
  };
  
  return (
    <div className={`min-h-screen ${getBackgroundColor()} transition-colors duration-200`}>
      {/* Top Navigation Bar - Shown when controls are visible */}
      <div 
        className={`fixed top-0 left-0 right-0 z-30 ${
          readerSettings.backgroundColor === 'light'
            ? 'bg-white shadow-md'
            : 'bg-[#051923] shadow-md'
        } transition-transform duration-300 ${
          showControls ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/manga/${titleId}`} className={`flex items-center gap-2 ${getPrimaryTextColor()} hover:opacity-80`}>
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Back to manga</span>
            </Link>
            
            <h1 className={`text-lg font-medium ${getPrimaryTextColor()} hidden md:block`}>
              {manga.title} - Chapter {chapter.chapterNumber}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className={`p-2 rounded-full ${getPrimaryTextColor()} hover:bg-black/10 dark:hover:bg-white/10 transition`}
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <Link to="/" className={`p-2 rounded-full ${getPrimaryTextColor()} hover:bg-black/10 dark:hover:bg-white/10 transition`}>
              <Home className="w-5 h-5" />
            </Link>
            
            <button 
              className={`p-2 rounded-full ${getPrimaryTextColor()} hover:bg-black/10 dark:hover:bg-white/10 transition`}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Chapter Navigation */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-30 ${
          readerSettings.backgroundColor === 'light'
            ? 'bg-white shadow-md'
            : 'bg-[#051923] shadow-md'
        } transition-transform duration-300 ${
          showControls ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => prevChapter && navigate(`/manga/${titleId}/chapter/${prevChapter.id}`)}
            disabled={!prevChapter}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg ${
              prevChapter 
                ? `${getPrimaryTextColor()} hover:bg-black/10 dark:hover:bg-white/10` 
                : `${getSecondaryTextColor()} cursor-not-allowed`
            } transition`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Previous</span>
          </button>
          
          <div className="flex gap-2">
            <button 
              className={`p-2 rounded-full ${getPrimaryTextColor()} hover:bg-black/10 dark:hover:bg-white/10 transition`}
            >
              <Heart className="w-5 h-5" />
            </button>
            
            <button 
              className={`p-2 rounded-full ${getPrimaryTextColor()} hover:bg-black/10 dark:hover:bg-white/10 transition`}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            
            <button 
              className={`p-2 rounded-full ${getPrimaryTextColor()} hover:bg-black/10 dark:hover:bg-white/10 transition`}
              onClick={() => {
                const elem = document.documentElement;
                if (!document.fullscreenElement) {
                  elem.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable fullscreen: ${err.message}`);
                  });
                } else {
                  document.exitFullscreen();
                }
              }}
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            onClick={() => nextChapter && navigate(`/manga/${titleId}/chapter/${nextChapter.id}`)}
            disabled={!nextChapter}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg ${
              nextChapter 
                ? `${getPrimaryTextColor()} hover:bg-black/10 dark:hover:bg-white/10` 
                : `${getSecondaryTextColor()} cursor-not-allowed`
            } transition`}
          >
            <span className="font-medium hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Reader Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-40 bg-black/40 bg-opacity-50 flex items-center justify-center" onClick={() => setShowSettings(false)}>
          <div className={`${
            readerSettings.backgroundColor === 'light'
              ? 'bg-white'
              : 'bg-[#051923]'
          } rounded-lg p-6 max-w-md w-full m-4`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${getPrimaryTextColor()}`}>Reader Settings</h3>
              <button className={`${getSecondaryTextColor()} hover:opacity-80`} onClick={() => setShowSettings(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${getSecondaryTextColor()} mb-2`}>Reading Direction</label>
                <div className="flex gap-2">
                  <button 
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      readerSettings.direction === 'vertical'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-black-300'
                        : `border-gray-300 dark:border-gray-600 ${getPrimaryTextColor()}`
                    }`}
                    onClick={() => setReaderSettings({...readerSettings, direction: 'vertical'})}
                  >
                    Vertical
                  </button>
                  <button 
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      readerSettings.direction === 'horizontal'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-black-300'
                        : `border-gray-300 dark:border-gray-600 ${getPrimaryTextColor()}`
                    }`}
                    onClick={() => setReaderSettings({...readerSettings, direction: 'horizontal'})}
                  >
                    Horizontal
                  </button>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${getSecondaryTextColor()} mb-2`}>Image Fit</label>
                <div className="flex gap-2">
                  <button 
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      readerSettings.fitMode === 'width'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-black-300'
                        : `border-gray-300 dark:border-gray-600 ${getPrimaryTextColor()}`
                    }`}
                    onClick={() => setReaderSettings({...readerSettings, fitMode: 'width'})}
                  >
                    Width
                  </button>
                  <button 
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      readerSettings.fitMode === 'height'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-black-300'
                        : `border-gray-300 dark:border-gray-600 ${getPrimaryTextColor()}`
                    }`}
                    onClick={() => setReaderSettings({...readerSettings, fitMode: 'height'})}
                  >
                    Height
                  </button>
                  <button 
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      readerSettings.fitMode === 'original'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-black-300'
                        : `border-gray-300 dark:border-gray-600 ${getPrimaryTextColor()}`
                    }`}
                    onClick={() => setReaderSettings({...readerSettings, fitMode: 'original'})}
                  >
                    Original
                  </button>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${getSecondaryTextColor()} mb-2`}>Background Color</label>
                <div className="flex gap-2">
                  <button 
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      readerSettings.backgroundColor === 'light'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-black-300'
                        : `border-gray-300 dark:border-gray-600 ${getPrimaryTextColor()}`
                    }`}
                    onClick={() => setReaderSettings({...readerSettings, backgroundColor: 'light'})}
                  >
                    Light
                  </button>
                  <button 
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      readerSettings.backgroundColor === 'dark'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : `border-gray-300 dark:border-gray-600 ${getPrimaryTextColor()}`
                    }`}
                    onClick={() => setReaderSettings({...readerSettings, backgroundColor: 'dark'})}
                  >
                    Dark
                  </button>
                  <button 
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      readerSettings.backgroundColor === 'black'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : `border-gray-300 dark:border-gray-600 ${getPrimaryTextColor()}`
                    }`}
                    onClick={() => setReaderSettings({...readerSettings, backgroundColor: 'black'})}
                  >
                    Black
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button 
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
                onClick={() => setShowSettings(false)}
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Chapter Content */}
      <div 
        className={`pt-16 pb-16 ${getContainerClass()} ${getBackgroundColor()}`}
        style={readerSettings.direction === 'horizontal' ? { height: 'calc(100vh - 2rem)' } : {}}
      >
        {/* Chapter Info */}
        <div className={`${getPageContainerClass()} py-4`}>
          <div className="max-w-lg mx-auto px-4 text-center">
            <Link to={`/manga/${titleId}`} className={`inline-flex items-center gap-2 ${getSecondaryTextColor()} hover:opacity-80 mb-4`}>
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {manga.title}</span>
            </Link>
            
            <h1 className={`text-2xl font-bold ${getPrimaryTextColor()} mb-1`}>Chapter {chapter.chapterNumber}</h1>
            <div className={`${getSecondaryTextColor()} text-sm mb-4`}>
              {new Date(chapter.addedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            
            <div className="flex justify-center gap-2 mb-4">
              <button 
                onClick={() => prevChapter && navigate(`/manga/${titleId}/chapter/${prevChapter.id}`)}
                disabled={!prevChapter}
                className={`py-2 px-4 ${getButtonClass(prevChapter)}`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              
              <button 
                onClick={() => nextChapter && navigate(`/manga/${titleId}/chapter/${nextChapter.id}`)}
                disabled={!nextChapter}
                className={`py-2 px-4 ${getButtonClass(nextChapter)}`}
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Chapter Images */}
        {chapter.images.map((image, index) => (
          <div key={index} className={getPageContainerClass()}>
            <img 
              src={image} 
              alt={`Page ${index + 1}`} 
              className={`${getFitMode()} object-contain max-w-full`}
              loading="lazy"
            />
          </div>
        ))}
        
        {/* End of Chapter */}
        <div className={`${getPageContainerClass()} py-8`}>
          <div className="max-w-lg mx-auto px-4 text-center">
            <h2 className={`text-xl font-bold ${getPrimaryTextColor()} mb-4`}>End of Chapter {chapter.chapterNumber}</h2>
            
            <div className="flex justify-center gap-2 mb-6">
              <button 
                onClick={() => prevChapter && navigate(`/manga/${titleId}/chapter/${prevChapter.id}`)}
                disabled={!prevChapter}
                className={`py-2 px-4 ${getButtonClass(prevChapter)}`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              
              <Link 
                to={`/manga/${titleId}`}
                className="py-2 px-4 rounded-lg flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <BookOpen className="w-4 h-4" />
                <span>All Chapters</span>
              </Link>
              
              <button 
                onClick={() => nextChapter && navigate(`/manga/${titleId}/chapter/${nextChapter.id}`)}
                disabled={!nextChapter}
                className={`py-2 px-4 ${getButtonClass(nextChapter)}`}
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className={`${getSecondaryTextColor()} text-sm`}>
              <p>Thanks for reading!</p>
              <p>More chapters coming soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterPage;