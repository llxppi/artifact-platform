"use client";

import { useState, useEffect } from "react";

export default function FavoriteButton({ artifactId }: { artifactId: string }) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, []);

  const checkFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch("/api/favorites", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const favorites = await res.json();
    setIsFavorite(favorites.some((f: any) => f.artifactId === artifactId));
  };

  const toggleFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("请先登录");
      return;
    }

    const method = isFavorite ? "DELETE" : "POST";
    await fetch("/api/favorites", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ artifactId })
    });

    setIsFavorite(!isFavorite);
  };

  return (
    <button
      onClick={toggleFavorite}
      className="p-2 hover:bg-surface-container-highest/50 rounded-full transition-colors"
    >
      <span className={`material-symbols-outlined ${isFavorite ? 'text-secondary' : 'text-outline'}`}>
        {isFavorite ? 'favorite' : 'favorite_border'}
      </span>
    </button>
  );
}
