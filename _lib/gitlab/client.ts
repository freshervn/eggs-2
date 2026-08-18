import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  blobWebUrl,
  encodeProjectPath,
  hasGitlabAccess,
  loadGitlabConfig,
  treeWebUrl,
} from "@/_lib/gitlab/config";
import { extractDocxText } from "@/_lib/gitlab/docx";
import type {
  GitlabFilePreview,
  GitlabTreeEntry,
  GitlabTreeResult,
} from "@/_lib/gitlab/types";

type GitlabApiTreeItem = {
  id: string;
  name: string;
  path: string;
  type: "tree" | "blob";
};

type GitlabApiFileMeta = {
  file_name: string;
  file_path: string;
  size: number;
};

const MAX_JSON_FILE_BYTES = 256 * 1024;

async function gitlabFetchJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "PRIVATE-TOKEN": token },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitLab API ${response.status}: ${body.slice(0, 200) || response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

async function gitlabFetchRaw(
  url: string,
  token: string,
): Promise<{ buffer: Buffer; size?: number }> {
  const response = await fetch(url, {
    headers: { "PRIVATE-TOKEN": token },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitLab API ${response.status}: ${body.slice(0, 200) || response.statusText}`,
    );
  }

  const sizeHeader =
    response.headers.get("x-gitlab-size") ??
    response.headers.get("content-length");
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    buffer,
    size: sizeHeader ? Number.parseInt(sizeHeader, 10) : buffer.byteLength,
  };
}

async function fetchGitlabFileBuffer(
  config: ReturnType<typeof loadGitlabConfig>,
  filePath: string,
  blobId?: string,
): Promise<{ buffer: Buffer; size?: number; name: string }> {
  if (!config.token) {
    throw new Error("GITLAB_TOKEN is required when no local repo is available.");
  }

  const name = filePath.split("/").pop() ?? filePath;
  const projectId = encodeProjectPath(config.projectPath);

  if (blobId) {
    const { buffer, size } = await gitlabFetchRaw(
      `${config.host}/api/v4/projects/${projectId}/repository/blobs/${blobId}/raw`,
      config.token,
    );
    return { buffer, size, name };
  }

  const encodedFile = encodeURIComponent(filePath);
  const query = new URLSearchParams({ ref: config.ref });
  const meta = await gitlabFetchJson<GitlabApiFileMeta>(
    `${config.host}/api/v4/projects/${projectId}/repository/files/${encodedFile}?${query}`,
    config.token,
  );

  if (meta.size > MAX_JSON_FILE_BYTES) {
    throw new Error(
      `File quá lớn để tải qua API (${Math.round(meta.size / (1024 * 1024))} MB). Mở lại từ danh sách file hoặc dùng GITLAB_REPO_PATH.`,
    );
  }

  const { buffer, size } = await gitlabFetchRaw(
    `${config.host}/api/v4/projects/${projectId}/repository/files/${encodedFile}/raw?${query}`,
    config.token,
  );

  return {
    buffer,
    size: size ?? meta.size,
    name: meta.file_name,
  };
}

function assertAccess(): ReturnType<typeof loadGitlabConfig> {
  const config = loadGitlabConfig();
  if (!config.token && !config.repoPath) {
    throw new Error(
      "GitLab chưa cấu hình. Thêm GITLAB_TOKEN vào .env.local hoặc clone repo và đặt GITLAB_REPO_PATH.",
    );
  }
  return config;
}

function localRoot(config: ReturnType<typeof loadGitlabConfig>): string {
  if (!config.repoPath) {
    throw new Error("Local GitLab repo path is not configured.");
  }
  return config.repoPath;
}

function resolveLocalPath(repoRoot: string, relativePath: string): string {
  const absolute = join(repoRoot, relativePath);
  const normalized = relative(repoRoot, absolute);
  if (normalized.startsWith("..") || normalized === "..") {
    throw new Error("Invalid path.");
  }
  return absolute;
}

function sortEntries(entries: GitlabTreeEntry[]): GitlabTreeEntry[] {
  return [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
    return a.name.localeCompare(b.name, "vi");
  });
}

function isTextFile(name: string): boolean {
  return /\.(md|txt|json|xml|yml|yaml|csv|log)$/i.test(name);
}

function isDocxFile(name: string): boolean {
  return /\.docx$/i.test(name);
}

export async function listGitlabTree(path: string): Promise<GitlabTreeResult> {
  const config = assertAccess();
  const normalizedPath = path.replace(/^\/+/, "").replace(/\/+$/, "");

  if (config.repoPath) {
    const absolute = resolveLocalPath(localRoot(config), normalizedPath);
    const entries = readdirSync(absolute, { withFileTypes: true }).map(
      (entry) => {
        const entryPath = normalizedPath
          ? `${normalizedPath}/${entry.name}`
          : entry.name;
        return {
          name: entry.name,
          path: entryPath,
          type: entry.isDirectory() ? ("tree" as const) : ("blob" as const),
          webUrl:
            entry.isDirectory()
              ? treeWebUrl(config, entryPath)
              : blobWebUrl(config, entryPath),
        };
      },
    );

    return {
      path: normalizedPath,
      entries: sortEntries(entries),
      srsRoot: config.srsRoot,
      source: "local",
      webUrl: treeWebUrl(config, normalizedPath || config.srsRoot),
    };
  }

  if (!config.token) {
    throw new Error("GITLAB_TOKEN is required when no local repo is available.");
  }

  const projectId = encodeProjectPath(config.projectPath);
  const query = new URLSearchParams({
    ref: config.ref,
    per_page: "100",
  });
  if (normalizedPath) query.set("path", normalizedPath);

  const items = await gitlabFetchJson<GitlabApiTreeItem[]>(
    `${config.host}/api/v4/projects/${projectId}/repository/tree?${query}`,
    config.token,
  );

  const entries = items.map((item) => ({
    name: item.name,
    path: item.path,
    type: item.type,
    blobId: item.type === "blob" ? item.id : undefined,
    webUrl:
      item.type === "tree"
        ? treeWebUrl(config, item.path)
        : blobWebUrl(config, item.path),
  }));

  return {
    path: normalizedPath,
    entries: sortEntries(entries),
    srsRoot: config.srsRoot,
    source: "api",
    webUrl: treeWebUrl(config, normalizedPath || config.srsRoot),
  };
}

async function readLocalFilePreview(
  config: ReturnType<typeof loadGitlabConfig>,
  filePath: string,
): Promise<GitlabFilePreview> {
  const absolute = resolveLocalPath(localRoot(config), filePath);
  const stat = statSync(absolute);
  const name = filePath.split("/").pop() ?? filePath;
  const webUrl = blobWebUrl(config, filePath);

  if (isTextFile(name)) {
    return {
      name,
      path: filePath,
      webUrl,
      previewType: "text",
      text: readFileSync(absolute, "utf8"),
      size: stat.size,
      source: "local",
    };
  }

  if (isDocxFile(name)) {
    const text = await extractDocxText(readFileSync(absolute));
    return {
      name,
      path: filePath,
      webUrl,
      previewType: "docx",
      text,
      size: stat.size,
      source: "local",
    };
  }

  return {
    name,
    path: filePath,
    webUrl,
    previewType: "unsupported",
    size: stat.size,
    source: "local",
  };
}

async function readApiFilePreview(
  config: ReturnType<typeof loadGitlabConfig>,
  filePath: string,
  blobId?: string,
): Promise<GitlabFilePreview> {
  const { buffer, size, name } = await fetchGitlabFileBuffer(
    config,
    filePath,
    blobId,
  );
  const webUrl = blobWebUrl(config, filePath);

  if (isTextFile(name)) {
    return {
      name,
      path: filePath,
      webUrl,
      previewType: "text",
      text: buffer.toString("utf8"),
      size,
      source: "api",
    };
  }

  if (isDocxFile(name)) {
    const text = await extractDocxText(buffer);
    return {
      name,
      path: filePath,
      webUrl,
      previewType: "docx",
      text,
      size,
      source: "api",
    };
  }

  return {
    name,
    path: filePath,
    webUrl,
    previewType: "unsupported",
    size,
    source: "api",
  };
}

export async function readGitlabFile(
  filePath: string,
  blobId?: string,
): Promise<GitlabFilePreview> {
  const config = assertAccess();
  const normalizedPath = filePath.replace(/^\/+/, "");

  if (config.repoPath) {
    return readLocalFilePreview(config, normalizedPath);
  }

  return readApiFilePreview(config, normalizedPath, blobId);
}

export function getGitlabStatus() {
  const config = loadGitlabConfig();
  return {
    host: config.host,
    projectPath: config.projectPath,
    srsRoot: config.srsRoot,
    ref: config.ref,
    hasToken: Boolean(config.token),
    hasLocalRepo: Boolean(config.repoPath),
    repoPath: config.repoPath,
    ready: hasGitlabAccess(config),
  };
}
