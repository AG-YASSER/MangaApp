const baseDate = new Date()

const flags = {
  japan: '🇯🇵',
  korea: '🇰🇷',
  china: '🇨🇳',
}

const genres = [
  'DRAMA',
  'COMEDY',
  'ACTION',
  'FANTASY',
  'ADVENTURE',
  'THRILLER',
  'SLICE OF LIFE',
  'SUPERNATURAL',
  'MUSIC',
  'ROMANCE',
  'SCHOOL LIFE',
  'HISTORICAL',
  'HORROR',
  'MYSTERY',
  'PSYCHOLOGICAL',
  'SCI-FI',
  'CRIME',
  'SPORTS',
  'LONG STRIP',
  'WEB COMIC',
  'POLICE',
  'TRAGEDY',
  'DEMONS',
  'MONSTERS',
  'SURVIVAL',
  'REINCARNATION',
  'LOLI',
  'SUGGESTIVE',
  'ADAPTATION',
]

const statuses = ['Completed', 'Ongoing', 'Hiatus']

const authors = [
  'Takeshi Obata',
  'Naoko Takeuchi',
  'Eiichiro Oda',
  'Yusuke Murata',
  'ONE',
  'Hajime Isayama',
  'Rumiko Takahashi',
  'CLAMP',
  'Kentarou Miura',
]

const titles = []

for (let i = 1; i <= 20; i++) {
  const randomGenres = Array.from(
    new Set(
      Array.from(
        { length: 4 },
        () => genres[Math.floor(Math.random() * genres.length)],
      ),
    ),
  )

  const randomAuthors = Array.from(
    new Set(
      Array.from(
        { length: 1 + Math.floor(Math.random() * 2) },
        () => authors[Math.floor(Math.random() * authors.length)],
      ),
    ),
  )

  const chaptersCount = 10 + Math.floor(Math.random() * 90)
  const totalViews = chaptersCount * (100 + Math.floor(Math.random() * 900))

  titles.push({
    id: i,
    title: `Manga ${i}`,
    originalTitle: `オリジナル ${i}`,
    description: `Description for Manga ${i}`,
    cover: `cover${(i % 3) + 1}.jpg`,
    country: Object.keys(flags)[i % 3],
    flag: flags[Object.keys(flags)[i % 3]],
    rating: parseFloat((6 + Math.random() * 3).toFixed(2)),
    authors: randomAuthors,
    likes: Math.floor(500 + Math.random() * 5000),
    comments: Math.floor(Math.random() * 300),
    totalViews,
    status: statuses[i % statuses.length],
    genres: randomGenres,
    colorTag: i % 5 === 0 ? 'FULL COLOR' : undefined,
    chapterCount: chaptersCount,
    createdAt: new Date(baseDate.getTime() - i * 86400000 * 3).toISOString(),
  })
}

export default titles
