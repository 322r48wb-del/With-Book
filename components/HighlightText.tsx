import React from 'react';

interface HighlightTextProps {
  text?: string;
  highlight?: string;
}

export default function HighlightText({ text = '', highlight = '' }: HighlightTextProps) {
  const safeText = text || '';
  const safeHighlight = highlight ? highlight.trim() : '';

  if (!safeHighlight || safeText.length === 0) {
    return <>{safeText}</>;
  }

  const parts = safeText.split(new RegExp(`(${safeHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === safeHighlight.toLowerCase() ? (
          <mark key={i} className="bg-amber-500/30 text-amber-200 px-0.5 rounded font-medium">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
