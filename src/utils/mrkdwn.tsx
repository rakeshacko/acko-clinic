import React from "react";

// Tiny Slack-ish mrkdwn renderer: supports *bold*, _italic_, `code`,
// @mentions, #channels, and ~strike~. Good enough for the prototype.

export function Mrkdwn({ text }: { text: string }): JSX.Element {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|~[^~\n]+~|@[\w.-]+|#[\w.-]+|<https?:[^>]+>)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("*") && tok.endsWith("*")) {
      parts.push(
        <strong key={key++} className="font-bold">
          {tok.slice(1, -1)}
        </strong>
      );
    } else if (tok.startsWith("_") && tok.endsWith("_")) {
      parts.push(
        <em key={key++} className="italic">
          {tok.slice(1, -1)}
        </em>
      );
    } else if (tok.startsWith("`") && tok.endsWith("`")) {
      parts.push(
        <code key={key++} className="font-mono text-[13px] bg-[#F4F4F4] text-[#E01E5A] rounded px-1 py-[1px] border border-[#DDD]">
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("~") && tok.endsWith("~")) {
      parts.push(
        <span key={key++} className="line-through">
          {tok.slice(1, -1)}
        </span>
      );
    } else if (tok.startsWith("@")) {
      parts.push(
        <span key={key++} className="bg-[#1264A3]/10 text-[#1264A3] rounded px-[3px] font-medium">
          {tok}
        </span>
      );
    } else if (tok.startsWith("#")) {
      parts.push(
        <span key={key++} className="bg-[#1264A3]/10 text-[#1264A3] rounded px-[3px] font-medium">
          {tok}
        </span>
      );
    } else if (tok.startsWith("<http")) {
      const url = tok.slice(1, -1);
      parts.push(
        <a key={key++} href={url} target="_blank" rel="noreferrer" className="text-[#1264A3] hover:underline">
          {url}
        </a>
      );
    } else {
      parts.push(tok);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  // Render newlines as <br/>
  return (
    <>
      {parts.map((p, i) =>
        typeof p === "string"
          ? p.split("\n").map((line, j, arr) => (
              <React.Fragment key={`${i}-${j}`}>
                {line}
                {j < arr.length - 1 ? <br /> : null}
              </React.Fragment>
            ))
          : p
      )}
    </>
  );
}
