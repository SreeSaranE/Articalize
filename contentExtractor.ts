import { parseDocument } from "htmlparser2";
import { DomUtils } from "htmlparser2";

export const extractMainContent = (html: string): {
  title: string;
  content: string;
  excerpt: string;
} => {
  try {
    // Parse with htmlparser2 (lenient, ignores invalid HTML5 attributes)
    const doc = parseDocument(html);

    // Extract title
    let title = "Untitled Article";
    const titleNodes = DomUtils.find((el) => el.name === "title", doc.children, true, 1);
    if (titleNodes.length > 0) {
      title = DomUtils.textContent(titleNodes[0]).trim() || title;
    }

    // Extract <article> or <main> content
    let mainContent = "";
    const articleNodes = DomUtils.find(
      (el) => el.name === "article" || el.name === "main",
      doc.children,
      true,
      1
    );

    if (articleNodes.length > 0) {
      mainContent = DomUtils.textContent(articleNodes[0]);
    } else {
      // Fallback: extract all text
      mainContent = DomUtils.textContent(doc);
    }

    // Clean up whitespace
    let content = mainContent.replace(/\s+/g, " ").trim();

    // If content is too short, fallback to your original regex extraction
    if (content.length < 100) {
      content = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove styles
        .replace(/<[^>]+>/g, " ") // Remove all tags
        .replace(/\s+/g, " ") // Collapse whitespace
        .trim();
    }

    // Create excerpt (first 150 chars of meaningful content)
    const excerpt = content.substring(0, 150) + (content.length > 150 ? "..." : "");

    return {
      title,
      content,
      excerpt,
    };
  } catch (error) {
    console.error("Error extracting content:", error);

    // Absolute fallback: regex-only
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch?.[1] || "Untitled Article";
    const content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const excerpt = content.substring(0, 150) + (content.length > 150 ? "..." : "");

    return { title, content, excerpt };
  }
};
