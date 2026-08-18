import { readGitlabFile } from "@/_lib/gitlab/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const blobId = searchParams.get("blobId") ?? undefined;

  if (!path?.trim()) {
    return NextResponse.json({ error: "path is required." }, { status: 400 });
  }

  try {
    const result = await readGitlabFile(path, blobId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to read GitLab file.",
      },
      { status: 500 },
    );
  }
}
