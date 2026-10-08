export interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function extractTocFromMdx(source: string): TocItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(source)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const id = generateId(title);
    
    toc.push({
      id,
      title,
      level
    });
  }

  return toc;
}

function generateId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}
