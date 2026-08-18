import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type GitlabConfig = {
  host: string;
  projectPath: string;
  srsRoot: string;
  ref: string;
  token?: string;
  repoPath?: string;
};

const DEFAULT_HOST = "https://scm.devops.vnpt.vn";
const DEFAULT_PROJECT = "it.das.vps.v6ioffice/it.das.vps.v6ioffice_doc";
const DEFAULT_SRS_ROOT = "WORKING/20.Development/20.Requirement/20.SRS";

function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function readEnvFromFiles(): Record<string, string> {
  const merged: Record<string, string> = {};
  const paths = [
    join(process.cwd(), ".env.local"),
    join(process.cwd(), ".env"),
  ];

  for (const path of paths) {
    if (!existsSync(path)) continue;
    Object.assign(merged, parseEnvFile(readFileSync(path, "utf8")));
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (value) merged[key] = value;
  }

  return merged;
}

function defaultRepoPaths(): string[] {
  return [
    join(homedir(), "Documents", "it.das.vps.v6ioffice_doc"),
    join(homedir(), "Documents", "GitHub", "it.das.vps.v6ioffice_doc"),
    join(homedir(), "Projects", "it.das.vps.v6ioffice_doc"),
    join(homedir(), "it.das.vps.v6ioffice_doc"),
  ];
}

export function loadGitlabConfig(): GitlabConfig {
  const env = readEnvFromFiles();
  const host = (env.GITLAB_HOST ?? DEFAULT_HOST).replace(/\/$/, "");
  const projectPath = env.GITLAB_PROJECT ?? DEFAULT_PROJECT;
  const srsRoot = env.GITLAB_SRS_ROOT ?? DEFAULT_SRS_ROOT;
  const ref = env.GITLAB_REF ?? "master";
  const token = env.GITLAB_TOKEN?.trim() || undefined;

  let repoPath = env.GITLAB_REPO_PATH?.trim() || env.GITLAB_LOCAL_PATH?.trim() || undefined;
  if (repoPath && !existsSync(repoPath)) {
    repoPath = undefined;
  }
  if (!repoPath) {
    repoPath = defaultRepoPaths().find((path) => existsSync(join(path, ".git")));
  }

  return { host, projectPath, srsRoot, ref, token, repoPath };
}

export function encodeProjectPath(projectPath: string): string {
  return encodeURIComponent(projectPath);
}

export function blobWebUrl(
  config: GitlabConfig,
  filePath: string,
): string {
  const encodedPath = filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${config.host}/${config.projectPath}/-/blob/${config.ref}/${encodedPath}`;
}

export function treeWebUrl(config: GitlabConfig, dirPath: string): string {
  const encodedPath = dirPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${config.host}/${config.projectPath}/-/tree/${config.ref}/${encodedPath}`;
}

export function hasGitlabAccess(config: GitlabConfig): boolean {
  return Boolean(config.token || config.repoPath);
}
