"use client";
import { useState, FormEvent, useEffect } from "react";

interface HashtagResponse {
  hashtags: string[];
}

export default function Home() {
  const [text, setText] = useState<string>("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setHashtags([]);
    setError("");
  }, [text]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generateHashtags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Something went wrong");
      }

      const data: HashtagResponse = await res.json();
      setHashtags(data.hashtags);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError("Error: " + err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Automatic Hashtag Generator</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Enter your social media post"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          style={{ width: "100%", padding: "8px", fontSize: "16px" }}
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "10px",
            padding: "10px 15px",
            fontSize: "16px",
            backgroundColor: loading ? "#aaa" : "#007bff",
            color: "#fff",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate Hashtags"}
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      {hashtags.length > 0 && (
        <div className="hashtagsContainer">
          <h2>Generated Hashtags:</h2>
          <div className="hashtags">
            {hashtags.map((tag, index) => (
              <span key={index} className="hashtag">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
