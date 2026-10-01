/** Server-owned rollout scope. A visitor or model cannot enable this path. */
export function sharedCrawlEnabled(propertyId: string) {
  return process.env.AIFROGI_CRAWL_ANSWER_V1 === 'enabled' &&
    (process.env.AIFROGI_CRAWL_ANSWER_PROPERTY_IDS || '').split(',').map(v => v.trim()).includes(propertyId);
}

/** Chunks are exact contiguous source bytes, ending at paragraph/sentence boundaries. */
export function sectionChunks(text: string, limit = 1400) {
  const chunks: string[] = []; let start = 0;
  while (start < text.length) {
    let end = Math.min(text.length, start + limit);
    if (end < text.length) {
      const window = text.slice(start, end);
      const paragraph = window.lastIndexOf('\n');
      const sentence = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '));
      const boundary = paragraph >= limit / 3 ? paragraph + 1 : sentence >= limit / 3 ? sentence + 1 : -1;
      if (boundary > 0) end = start + boundary;
    }
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    start = end;
  }
  return chunks;
}
