import { readSession } from "@/_lib/auth/session";
import { listPublicUsers } from "@/_lib/auth/users";
import { NextRequest, NextResponse } from "next/server";

const SEARCH_RESULT_LIMIT = 10;

export async function GET(request: NextRequest) {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (search.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const users = await listPublicUsers();
    const filteredUsers = users
      .filter((user) => user.username !== session.username)
      .filter((user) => {
        const username = user.username.toLowerCase();
        const displayName = user.displayName.toLowerCase();

        return username.includes(search) || displayName.includes(search);
      })
      .slice(0, SEARCH_RESULT_LIMIT);

    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to search users.",
      },
      { status: 500 }
    );
  }
}
