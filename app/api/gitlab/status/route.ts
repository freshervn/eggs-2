import { getGitlabStatus } from "@/_lib/gitlab/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getGitlabStatus());
}
