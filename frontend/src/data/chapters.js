// src/data/chapters.js
import titles from './titles';

const baseDate = new Date();
const chapters = [];

let chapterId = 1;

for (const title of titles) {
  const numberOfChapters = Math.floor(Math.random() * 5) + 3; // 3-7 chapters per title
  
  for (let i = 0; i < numberOfChapters; i++) {
    const chapterNum = i + 1;
    const publishedAt = new Date(baseDate);
    publishedAt.setDate(baseDate.getDate() - chapterId);

    const addedAt = new Date(publishedAt);
    addedAt.setHours(publishedAt.getHours() + 4);

    const totalImages = 12 + Math.floor(Math.random() * 10); // 12-21 images per chapter
    const images = Array.from(
      { length: totalImages },
      (_, j) => `/assets/images/chapters/${title.id}/ch-${chapterNum}/page-${j + 1}.jpg`
    );

    chapters.push({
      id: chapterId,
      titleId: title.id,
      titleName: title.title,
      chapterNumber: chapterNum,
      cover: title.cover,
      author: title.authors?.[0] || 'Unknown',
      addedAt: addedAt.toISOString(),
      images,
      imageCount: totalImages,
    });

    chapterId++;
  }
}

export default chapters;