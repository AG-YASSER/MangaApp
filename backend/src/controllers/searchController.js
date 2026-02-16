import Manga from "../models/Manga.js";

// GET /api/search - Global search
export const globalSearch = async (req, res) => {
  try {
    const { 
      q, // query
      type = "manga", // manga, users
      page = 1, 
      limit = 20 
    } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        message: "Search query must be at least 2 characters" 
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let results = [];
    let total = 0;

    if (type === "manga") {
      // Search manga
      const query = {
        $text: { $search: q },
        isDeleted: false,
        publicationStatus: "published",
      };

      results = await Manga.find(query, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .select("title slug coverImage description genres rating views")
        .skip(skip)
        .limit(parseInt(limit));

      total = await Manga.countDocuments(query);
    } else if (type === "users" && req.user?.role === "admin") {
      // Search users (admin only)
      const User = mongoose.model("User");
      const query = {
        $or: [
          { username: { $regex: q, $options: "i" } },
          { displayName: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ],
      };

      results = await User.find(query)
        .select("username displayName email avatar role")
        .skip(skip)
        .limit(parseInt(limit));

      total = await User.countDocuments(query);
    }

    res.json({
      success: true,
      results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ message: "Search failed" });
  }
};

// GET /api/search/suggestions - Autocomplete suggestions
export const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    // Get manga title suggestions
    const mangaSuggestions = await Manga.find({
      title: { $regex: q, $options: "i" },
      isDeleted: false,
      publicationStatus: "published",
    })
      .limit(5)
      .select("title slug coverImage");

    // Get genre suggestions if query matches a genre
    const genreList = [
      "action", "adventure", "comedy", "drama", "fantasy", "horror",
      "mystery", "romance", "sci-fi", "slice of life", "sports",
      "supernatural", "thriller", "psychological", "historical",
      "mecha", "music", "shoujo", "shounen", "seinen", "josei",
      "isekai", "game", "harem", "ecchi", "martial arts", "school"
    ];

    const genreSuggestions = genreList
      .filter(genre => genre.includes(q.toLowerCase()))
      .map(genre => ({
        type: "genre",
        name: genre,
      }));

    res.json({
      success: true,
      suggestions: {
        manga: mangaSuggestions,
        genres: genreSuggestions.slice(0, 3),
      },
    });
  } catch (error) {
    console.error("Get search suggestions error:", error);
    res.status(500).json({ message: "Failed to get suggestions" });
  }
};

// GET /api/search/advanced - Advanced search with filters
export const advancedSearch = async (req, res) => {
  try {
    const {
      title,
      author,
      artist,
      genres,
      status,
      minRating,
      yearFrom,
      yearTo,
      sort = "relevance",
      page = 1,
      limit = 20,
    } = req.query;

    const query = {
      isDeleted: false,
      publicationStatus: "published",
    };

    // Title search
    if (title) {
      query.title = { $regex: title, $options: "i" };
    }

    // Author/artist search
    if (author) {
      query.author = { $in: [new RegExp(author, "i")] };
    }
    if (artist) {
      query.artist = { $in: [new RegExp(artist, "i")] };
    }

    // Genres filter (can include or exclude)
    if (genres) {
      const genreArray = genres.split(",");
      query.genres = { $all: genreArray };
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Rating filter
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    // Year range
    if (yearFrom || yearTo) {
      query.yearReleased = {};
      if (yearFrom) query.yearReleased.$gte = parseInt(yearFrom);
      if (yearTo) query.yearReleased.$lte = parseInt(yearTo);
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case "relevance":
        if (title) {
          sortOption = { score: { $meta: "textScore" } };
        } else {
          sortOption = { rating: -1 };
        }
        break;
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "highest_rated":
        sortOption = { rating: -1, totalRatings: -1 };
        break;
      case "most_viewed":
        sortOption = { views: -1 };
        break;
      case "most_chapters":
        sortOption = { totalChapters: -1 };
        break;
      default:
        sortOption = { rating: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let mangaQuery = Manga.find(query);

    // If text search with relevance, include score
    if (title && sort === "relevance") {
      mangaQuery = Manga.find(query, { score: { $meta: "textScore" } });
    }

    const manga = await mangaQuery
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .select("title slug coverImage description summary genres status rating views yearReleased author artist");

    const total = await Manga.countDocuments(query);

    res.json({
      success: true,
      results: manga,
      filters: {
        applied: {
          title,
          author,
          artist,
          genres: genres?.split(","),
          status,
          minRating,
          yearFrom,
          yearTo,
        },
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Advanced search error:", error);
    res.status(500).json({ message: "Search failed" });
  }
};

// GET /api/search/genres - Get all genres with counts
export const getGenresWithCounts = async (req, res) => {
  try {
    const genreCounts = await Manga.aggregate([
      { $match: { isDeleted: false, publicationStatus: "published" } },
      { $unwind: "$genres" },
      {
        $group: {
          _id: "$genres",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Format as array of objects with name and count
    const genres = genreCounts.map(g => ({
      name: g._id,
      count: g.count,
    }));

    res.json({
      success: true,
      genres,
    });
  } catch (error) {
    console.error("Get genres with counts error:", error);
    res.status(500).json({ message: "Failed to load genres" });
  }
};