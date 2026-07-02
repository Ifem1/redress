import { ExternalLink, FileText } from "lucide-react";

export function EvidenceLinkList({ urlsJson }: { urlsJson: string }) {
  let urls: string[] = [];
  try {
    urls = JSON.parse(urlsJson || "[]");
  } catch {
    urls = [];
  }

  if (!urls.length) {
    return <p className="text-xs text-[var(--soft-grey)] italic">No evidence links provided.</p>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {urls.map((url, i) => (
        <li key={i}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs mono text-[var(--process-blue)] hover:underline break-all"
          >
            <FileText size={12} className="shrink-0" />
            <span className="truncate">{url}</span>
            <ExternalLink size={10} className="shrink-0" />
          </a>
        </li>
      ))}
    </ul>
  );
}
