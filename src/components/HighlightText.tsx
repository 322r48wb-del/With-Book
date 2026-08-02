/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

interface HighlightTextProps {
  text?: string;
  highlight?: string;
}

export default function HighlightText({ text = '', highlight = '' }: HighlightTextProps) {
  // text が存在しない、または文字列でない場合のガード
  if (!text) {
    return null;
  }

  // highlight が存在しない、または空文字・空白のみの場合はそのままテキストを返す
  if (!highlight || typeof highlight !== 'string' || !highlight.trim()) {
    return <span>{text}</span>;
  }

  try {
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-amber-500/35 text-amber-300 font-semibold border-b border-amber-500/60 rounded px-0.5">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  } catch (e) {
    // 万が一正規表現などでエラーが出てもアプリを止めないガード
    return <span>{text}</span>;
  }
}
