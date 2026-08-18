export type GitlabTreeEntry = {
  name: string;
  path: string;
  type: "tree" | "blob";
  blobId?: string;
  webUrl: string;
};

export type GitlabFilePreview = {
  name: string;
  path: string;
  webUrl: string;
  previewType: "text" | "docx" | "unsupported";
  text?: string;
  size?: number;
  source: "local" | "api";
};

export type GitlabTreeResult = {
  path: string;
  entries: GitlabTreeEntry[];
  srsRoot: string;
  source: "local" | "api";
  webUrl: string;
};
