import { listGitlabTree } from "@/_lib/gitlab/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") ?? "";

  try {
    const result = await listGitlabTree(path);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to list GitLab SRS folder.",
      },
      { status: 500 },
    );
  }
}
