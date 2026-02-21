import ChapterCard from './ChapterCard'

function ChapterList({ chapters }) {
  return (
    <div className="sm:bg-[#d3e2fd] sm:dark:bg-[#003554] p-3 shadow-md flex flex-col gap-2">
      {chapters.map((ch, index) => (
        <ChapterCard
          key={index}
          id={ch.id}
          titleId={ch.titleId}
          cover={ch.cover}
          title={ch.titleName}
          chapter={ch.chapterNumber}
          author={ch.author}
          addedAt={ch.addedAt}
        />
      ))}
    </div>
  )
}

export default ChapterList
