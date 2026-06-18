'use client';

import { useState, useEffect } from 'react';

interface FactCheckProps {
  text: string;
  artifactId: string;
}

export default function FactCheck({ text, artifactId }: FactCheckProps) {
  const [annotations, setAnnotations] = useState<any[]>([]);

  useEffect(() => {
    checkFacts();
  }, [text]);

  const checkFacts = async () => {
    const sentences = text.split(/[。！？]/);
    const results = [];

    for (const sentence of sentences) {
      if (sentence.trim().length < 10) continue;

      const response = await fetch('/api/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sentence, artifactId })
      });

      const data = await response.json();
      results.push({ sentence, ...data });
    }

    setAnnotations(results);
  };

  return (
    <div className="mt-2 space-y-1">
      {annotations.filter(item => !item.verified).map((item, i) => (
        <div key={i} className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700">
          ⚠️ {item.label} - {item.source}
        </div>
      ))}
    </div>
  );
}
