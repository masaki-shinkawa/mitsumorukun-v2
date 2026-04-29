export type HeadingPath = string[];

export type Chunk = {
  headingPath: HeadingPath;
  body: string;
  /** approximate token count (chars / 4) */
  approxTokens: number;
};

const MAX_CHUNK_CHARS = 24000; // ~6000 tokens

function headingLevel(line: string): number | null {
  const m = line.match(/^(#{1,6})\s/);
  return m ? m[1].length : null;
}

export function parseMarkdownChunks(text: string): Chunk[] {
  const lines = text.split("\n");
  const chunks: Chunk[] = [];

  const headingStack: string[] = [];
  let bodyLines: string[] = [];

  function flush() {
    const body = bodyLines.join("\n").trim();
    if (body) {
      chunks.push({
        headingPath: [...headingStack],
        body,
        approxTokens: Math.ceil(body.length / 4),
      });
    }
    bodyLines = [];
  }

  for (const line of lines) {
    const level = headingLevel(line);
    if (level !== null) {
      flush();
      const title = line.replace(/^#{1,6}\s+/, "").trim();
      headingStack.splice(level - 1, headingStack.length, title);
    } else {
      bodyLines.push(line);
    }

    // split oversized chunks mid-body
    const currentBody = bodyLines.join("\n");
    if (currentBody.length > MAX_CHUNK_CHARS) {
      flush();
    }
  }
  flush();

  return chunks;
}

export function chunksToSummaryInput(
  chunks: Chunk[],
  fileName: string,
  uploadedAt: string,
): string {
  return chunks
    .map((c) => {
      const path = c.headingPath.length > 0 ? c.headingPath.join(" > ") : "(no heading)";
      return `[FILE: ${fileName} | UPLOADED: ${uploadedAt} | SECTION: ${path}]\n${c.body}`;
    })
    .join("\n\n---\n\n");
}
