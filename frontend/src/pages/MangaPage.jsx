import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  BookOpenText,
  Tags,
  User,
  CircleCheck,
  Star,
  Clock,
  Calendar,
  Heart,
  Share2,
  Bookmark,
  ChevronDown,
  Globe,
  Eye,
  MessageCircle
} from 'lucide-react';
import titles from '../data/titles';
import chapters from '../data/chapters';

const MangaPage = () => {
  const { id } = useParams();
  const manga = titles.find((m) => m.id === parseInt(id));
  const [activeTab, setActiveTab] = useState('chapters');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const mangaChapters = chapters
    .filter((c) => c.titleId === manga?.id)
    .sort((a, b) => b.chapterNumber - a.chapterNumber);
  
  const chaptersByVolume = mangaChapters.reduce((acc, chapter) => {
    const volume = chapter.volume || 'Chapters';
    if (!acc[volume]) acc[volume] = [];
    acc[volume].push(chapter);
    return acc;
  }, {});

  const rating = manga?.ratings ? 
    (manga.ratings.reduce((sum, r) => sum + r, 0) / manga.ratings.length).toFixed(1) : 
    '4.8';
  
  const formattedDate = manga?.releaseDate ? 
    new Date(manga.releaseDate).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long'
    }) : 'Unknown';
  
  useEffect(() => {
    window.scrollTo(0, 0);
    const bookmarks = JSON.parse(localStorage.getItem('mangaBookmarks') || '[]');
    setIsBookmarked(bookmarks.includes(parseInt(id)));
  }, [id]);
  
  if (!manga) return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-900">
      <div className="text-gray-800 dark:text-white p-6 text-xl">Manga not found.</div>
    </div>
  );
  
  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('mangaBookmarks') || '[]');
    if (isBookmarked) {
      const newBookmarks = bookmarks.filter(bmId => bmId !== manga.id);
      localStorage.setItem('mangaBookmarks', JSON.stringify(newBookmarks));
    } else {
      bookmarks.push(manga.id);
      localStorage.setItem('mangaBookmarks', JSON.stringify(bookmarks));
    }
    setIsBookmarked(!isBookmarked);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 pb-20">
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(/assets/images/covers/${manga.cover})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent" />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full max-w-[200px] md:max-w-[280px] mx-auto md:mx-0 shrink-0">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
              <img
                src={`/assets/images/covers/${manga.cover}`}
                alt={manga.title}
                className="w-full h-auto object-cover"
              />
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button 
                onClick={toggleBookmark}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition ${
                  isBookmarked ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Bookmark 
                  className={`w-5 h-5 ${isBookmarked ? 'fill-white' : 'fill-transparent'}`} 
                />
                <span className="text-xs mt-1">Bookmark</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition">
                <Heart className="w-5 h-5" />
                <span className="text-xs mt-1">Like</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition">
                <Share2 className="w-5 h-5" />
                <span className="text-xs mt-1">Share</span>
              </button>
            </div>
            
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-lg">{rating}</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{manga.ratings?.length || '8.2k'} reviews</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    manga.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
                  }`}>
                    {manga.status || 'Ongoing'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Released</span>
                  <span>{formattedDate}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Chapters</span>
                  <span>{mangaChapters.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Views</span>
                  <span>{manga.views || '1.2M'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 space-y-6 mt-6 md:mt-0">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                {manga.title}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {manga.originalTitle && <span className="italic">{manga.originalTitle}</span>}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">By:</span>
                {manga.authors.map((author, idx) => (
                  <span key={idx} className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm">
                    {author}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {manga.genres.map((genre, idx) => (
                  <span 
                    key={idx} 
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1 rounded-full text-sm cursor-pointer transition"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-md">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {showFullDescription 
                  ? manga.description 
                  : `${manga.description.substring(0, 300)}${manga.description.length > 300 ? '...' : ''}`
                }
              </p>
              {manga.description.length > 300 && (
                <button 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="flex items-center mt-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                >
                  {showFullDescription ? 'Show Less' : 'Read More'}
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showFullDescription ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Country of Origin</span>
                  <span className="font-medium">{manga.country || 'Japan'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Last Updated</span>
                  <span className="font-medium">{manga.updatedAt || '2 days ago'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <Eye className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Age Rating</span>
                  <span className="font-medium">{manga.ageRating || '16+'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Reading Direction</span>
                  <span className="font-medium">{manga.readingDirection || 'Right to Left'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-10">
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex">
              {['chapters', 'related', 'comments'].map(tab => (
                <button
                  key={tab}
                  className={`py-3 px-4 font-medium text-sm border-b-2 transition focus:outline-none ${
                    activeTab === tab 
                      ? 'border-indigo-500 text-gray-900 dark:text-white' 
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {activeTab === 'chapters' && (
            <div className="space-y-6 mb-16">
              {Object.entries(chaptersByVolume).map(([volume, volumeChapters]) => (
                <div key={volume} className="space-y-3">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <BookOpenText className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    {volume === 'Chapters' ? 'Chapters' : `Volume ${volume}`}
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-normal">({volumeChapters.length})</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {volumeChapters.map((ch) => (
                      <Link
                        key={ch.id}
                        to={`/manga/${manga.id}/chapter/${ch.id}`}
                        className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 p-4 rounded-xl flex justify-between items-center border border-gray-200 dark:border-gray-700 shadow-sm transition group"
                      >
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 dark:text-white">Chapter {ch.chapterNumber}</div>
                          {ch.title && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{ch.title}</div>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'related' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-16">
              {[1, 2, 3, 4, 5, 6].map((_, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm transition">
                  <div className="aspect-w-3 aspect-h-4 bg-gray-100 dark:bg-gray-700">
                    <div className="w-full h-40 bg-gray-100 dark:bg-gray-700"></div>
                  </div>
                  <div className="p-3">
                    <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'comments' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md mb-16">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Join the conversation</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to post comments and interact with other readers</p>
                <button className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition">
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MangaPage;