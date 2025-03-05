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

  const filtered = words.filter(
    (word) =>
      /^[a-zA-Z]+$/.test(word) &&
      !stopWords.has(word.toLowerCase()) &&
      word.length > 1 
  );
  if (filtered.length === 0) return null;

  const limitedWords = filtered.slice(0, maxWords);

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


function generateAdvancedHashtags(text: string, minLength = 3): string[] {
  const hashtagsSet = new Set<string>();

  const doc = nlp(text);
  const nounPhrases = doc.nouns().out("array") as string[];
  nounPhrases.forEach((phrase) => {
    const words = phrase.split(/\s+/);
    const hashtag = createHashtag(words, minLength);
    if (hashtag) {
      hashtagsSet.add(hashtag);
    }
  });

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

  const hashtagsArray = Array.from(hashtagsSet);
  hashtagsArray.sort((a, b) => a.length - b.length);
  return hashtagsArray.slice(0, 10);
}
