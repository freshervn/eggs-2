"use client";

import type { GitlabFilePreview, GitlabTreeEntry } from "@/_lib/gitlab/types";
import { useCallback, useEffect, useMemo, useState } from "react";

type GitlabStatus = {
  host: string;
  projectPath: string;
  srsRoot: string;
  ref: string;
  hasToken: boolean;
  hasLocalRepo: boolean;
  repoPath?: string;
  ready: boolean;
};

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GitlabSrsBrowser() {
  const [status, setStatus] = useState<GitlabStatus | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [entries, setEntries] = useState<GitlabTreeEntry[]>([]);
  const [preview, setPreview] = useState<GitlabFilePreview | null>(null);
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breadcrumbs = useMemo(() => {
    if (!status || !currentPath) return [];
    const root = status.srsRoot;
    if (!currentPath.startsWith(root)) {
      return currentPath.split("/").filter(Boolean);
    }
    if (currentPath === root) return [];
    return currentPath.slice(root.length + 1).split("/").filter(Boolean);
  }, [currentPath, status]);

  const loadTree = useCallback(async (path: string) => {
    setLoadingTree(true);
    setError(null);
    setPreview(null);

    try {
      const query = path ? `?path=${encodeURIComponent(path)}` : "";
      const response = await fetch(`/api/gitlab/tree${query}`);
      const data = (await response.json()) as {
        entries?: GitlabTreeEntry[];
        path?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Không tải được thư mục SRS.");
      }

      setCurrentPath(data.path ?? path);
      setEntries(data.entries ?? []);
    } catch (loadError) {
      setEntries([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không tải được thư mục SRS.",
      );
    } finally {
      setLoadingTree(false);
    }
  }, []);

  const loadFile = useCallback(async (path: string, blobId?: string) => {
    setLoadingFile(true);
    setError(null);

    try {
      const query = new URLSearchParams({ path });
      if (blobId) query.set("blobId", blobId);
      const response = await fetch(`/api/gitlab/file?${query}`);
      const data = (await response.json()) as GitlabFilePreview & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Không đọc được file.");
      }

      setPreview(data);
    } catch (loadError) {
      setPreview(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không đọc được file.",
      );
    } finally {
      setLoadingFile(false);
    }
  }, []);

  useEffect(() => {
    void fetch("/api/gitlab/status")
      .then((response) => response.json())
      .then((data: GitlabStatus) => {
        setStatus(data);
        if (data.ready) {
          void loadTree(data.srsRoot);
        } else {
          setLoadingTree(false);
        }
      })
      .catch(() => {
        setLoadingTree(false);
        setError("Không kiểm tra được cấu hình GitLab.");
      });
  }, [loadTree]);

  function openEntry(entry: GitlabTreeEntry) {
    if (entry.type === "tree") {
      void loadTree(entry.path);
      return;
    }
    void loadFile(entry.path, entry.blobId);
  }

  function goToBreadcrumb(index: number) {
    if (!status) return;
    if (index < 0) {
      void loadTree(status.srsRoot);
      return;
    }
    const parts = breadcrumbs.slice(0, index + 1);
    void loadTree([status.srsRoot, ...parts].join("/"));
  }

  if (!status) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
        Đang kiểm tra GitLab…
      </p>
    );
  }

  if (!status.ready) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 shadow-sm">
        <p className="font-medium">Chưa kết nối GitLab SRS</p>
        <p className="mt-2 text-xs leading-relaxed">
          Thêm vào <code className="rounded bg-white px-1">.env.local</code>:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-xl bg-white p-3 text-[11px] leading-relaxed text-slate-800">
{`GITLAB_TOKEN=your_personal_access_token
# hoặc clone repo local:
GITLAB_REPO_PATH=/path/to/it.das.vps.v6ioffice_doc
# alias:
GITLAB_LOCAL_PATH=/path/to/it.das.vps.v6ioffice_doc`}
        </pre>
        <p className="mt-2 text-xs text-amber-900">
          Repo: {status.projectPath} · SRS: {status.srsRoot}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-sm font-medium text-slate-900">SRS · GitLab</p>
        <p className="mt-1 text-xs text-slate-500">
          {status.projectPath}
          {status.hasLocalRepo ? " · local repo" : ""}
          {status.hasToken && !status.hasLocalRepo ? " · GitLab API" : ""}
          {status.hasToken && status.hasLocalRepo ? " · API backup" : ""}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1 text-xs text-slate-600">
          <button
            type="button"
            onClick={() => goToBreadcrumb(-1)}
            className="rounded-md px-2 py-1 hover:bg-slate-100"
          >
            SRS
          </button>
          {breadcrumbs.map((part, index) => (
            <span key={`${part}-${index}`} className="flex items-center gap-1">
              <span className="text-slate-300">/</span>
              <button
                type="button"
                onClick={() => goToBreadcrumb(index)}
                className="rounded-md px-2 py-1 hover:bg-slate-100"
              >
                {part}
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loadingTree ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Đang tải thư mục…
          </p>
        ) : entries.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Thư mục trống.
          </p>
        ) : (
          <ul className="max-h-[40dvh] divide-y divide-slate-100 overflow-y-auto">
            {entries.map((entry) => (
              <li key={entry.path}>
                <button
                  type="button"
                  onClick={() => openEntry(entry)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="text-sm font-medium text-slate-900">
                      {entry.type === "tree" ? "📁 " : "📄 "}
                      {entry.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-medium text-slate-400">
                    {entry.type === "tree" ? "folder" : "file"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : null}

      {loadingFile ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
          Đang đọc file…
        </p>
      ) : preview ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">{preview.name}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              <a
                href={preview.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#FC6D26] hover:underline"
              >
                Mở trên GitLab →
              </a>
              {preview.size ? (
                <span className="text-slate-500">{formatSize(preview.size)}</span>
              ) : null}
              <span className="text-slate-400">{preview.source}</span>
            </div>
          </div>

          {preview.previewType === "unsupported" ? (
            <p className="px-4 py-6 text-sm text-slate-500">
              Không preview được loại file này. Dùng link GitLab để tải.
            </p>
          ) : (
            <pre className="max-h-[45dvh] overflow-auto whitespace-pre-wrap px-4 py-4 text-xs leading-relaxed text-slate-800">
              {preview.text || "(File trống)"}
            </pre>
          )}
        </div>
      ) : null}
    </div>
  );
}
