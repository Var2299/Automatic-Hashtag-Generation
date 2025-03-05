import { NextResponse } from "next/server";
import nlp from "compromise";
import keyword_extractor from "keyword-extractor";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid text input" },
        { status: 400 }
      );
    }

    const hashtags = generateAdvancedHashtags(text);
    return NextResponse.json({ hashtags }, { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to create a hashtag from an array of words.
 * It filters out stop words, short words, and non-alphabetic tokens.
 * If the hashtag is too long, it truncates it while keeping its meaning.
 */
function createHashtag(
  words: string[],
  minLength: number = 3,
  maxWords: number = 2,
  maxAllowedLength: number = 20
): string | null {
  const stopWords = new Set([
    "the", "and", "or", "a", "an", "of", "in", "to", "is", "are", "was",
    "this", "that", "with", "for", "on", "at", "by", "i", "you", "we",
    "love", "just", "amazing", "new", "watching", "eating", "thing",
    "stuff", "today", "something", "someone", "everything"
  ]);

  // Filter out stop words, numbers, and non-alphabetic words
  const filtered = words.filter(
    (word) =>
      /^[a-zA-Z]+$/.test(word) &&
      !stopWords.has(word.toLowerCase()) &&
      word.length > 1 // Avoid single-character words
  );
  if (filtered.length === 0) return null;

  // Limit the number of words for a balanced hashtag
  const limitedWords = filtered.slice(0, maxWords);

  // Convert to title case and join words
  let hashtag =
    "#" +
    limitedWords
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");

  // Ensure the hashtag is within the maximum allowed length
  if (hashtag.length - 1 > maxAllowedLength) {
    hashtag = "#" + filtered[0]; // Use only the first key term
  }

  return hashtag.length - 1 < minLength ? null : hashtag;
}

/**
 * Generates high-quality hashtags by combining:
 * 1. Noun phrase extraction via compromise.
 * 2. Keyword extraction via keyword-extractor.
 *
 * Filters out generic terms, sorts by relevance, and returns the top 10.
 */
function generateAdvancedHashtags(text: string, minLength = 3): string[] {
  const hashtagsSet = new Set<string>();

  // --- Method 1: Noun Phrase Extraction ---
  const doc = nlp(text);
  const nounPhrases = doc.nouns().out("array") as string[];
  nounPhrases.forEach((phrase) => {
    const words = phrase.split(/\s+/);
    const hashtag = createHashtag(words, minLength);
    if (hashtag) {
      hashtagsSet.add(hashtag);
    }
  });

  // --- Method 2: Keyword Extraction ---
  const extractionResult = keyword_extractor.extract(text, {
    language: "english",
    remove_digits: true,
    return_changed_case: false,
    remove_duplicates: false,
  });

  extractionResult.forEach((word) => {
    const cleanWord = word.replace(/[^\w\s]/gi, "");
    const hashtag = createHashtag([cleanWord], minLength);
    if (hashtag) {
      hashtagsSet.add(hashtag);
    }
  });

  // Convert set to array, sort by length (shorter first), and limit to top 10
  const hashtagsArray = Array.from(hashtagsSet);
  hashtagsArray.sort((a, b) => a.length - b.length);
  return hashtagsArray.slice(0, 10);
}
