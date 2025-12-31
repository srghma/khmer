export type Page = [number, string];

/**
 * Extracts page data from content by splitting on page markers and extracting page numbers
 * Handles formats: "### Страница xxx", "### Page xxx", "### **Page 307**"
 */
export const extractPageData = (content: string): Page[] => {
  const parts = content
    .split(/(### (?:\*\*)?(?:Страница|Page) \d+(?:\*\*)?)/i)
    .filter(Boolean);

  const pages: Page[] = [];
  for (let i = 0; i < parts.length; i++) {
    const marker = parts[i];
    if (/### (?:\*\*)?(?:Страница|Page) \d+(?:\*\*)?/i.test(marker)) {
      const match = marker.match(/\d+/);
      const pageNumber = match ? parseInt(match[0], 10) : null;
      if (pageNumber !== null) {
        const pageContent = parts[i + 1] ? parts[i + 1].trim() : "";
        pages.push([pageNumber, pageContent]);
        i++; // Skip the content next to the page marker
      }
    }
  }
  return pages;
};
