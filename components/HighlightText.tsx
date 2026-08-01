/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface HighlightTextProps {
  text: string;
  highlight: string;
  className?: string;
}

export default function HighlightText({ text, highlight, className = '' }: HighlightTextProps) {
  const query = highlight ? highlight.trim() : '';

  if (!query || !text) {
    return <span className={className}>{text}</span>;
  }

  // Escape special characters for safe regex creation
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={index}
            className="bg-amber-500/35 text-amber-300 font-semibold px-0.5 rounded border-b border-amber-500/60 transition-colors"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
