import { readSession } from "@/_lib/auth/session";
import {
  ChatPresenceRecord,
  ChatTypingUser,
  getPresenceRef,
  getRoomMessagesCollection,
  getRoomRef,
  getRoomTypingCollection,
  mapMessage,
  mapPresenceRecord,
  mapRoom,
  mapTypingUser,
  PRIVATE_CHAT_MESSAGE_LIMIT,
  PRIVATE_CHAT_PRESENCE_TTL_MS,
  PRIVATE_CHAT_TYPING_TTL_MS,
} from "@/_lib/chat/rooms";
import { createSseEncoder, SSE_HEADERS } from "@/_lib/chat/sse";
import { NextRequest, NextResponse } from "next/server";

const getAuthorizedRoom = async (roomId: string, username: string) => {
  const roomSnapshot = await getRoomRef(roomId).get();
  const room = mapRoom(roomSnapshot);

  if (!room) {
    return { room: null, error: "Room not found.", status: 404 };
  }

  if (!room.participantUsernames.includes(username)) {
    return { room: null, error: "Forbidden", status: 403 };
  }

  return { room, error: null, status: 200 };
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await context.params;
  const authorizedRoom = await getAuthorizedRoom(roomId, session.username);

  if (!authorizedRoom.room) {
    return NextResponse.json(
      { error: authorizedRoom.error },
      { status: authorizedRoom.status }
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = createSseEncoder(controller);
      let closed = false;
      let messages = [] as ReturnType<typeof mapMessage>[];
      let typingUsers = [] as ChatTypingUser[];
      let presence = null as ChatPresenceRecord | null;
      const otherUsername =
        authorizedRoom.room.participantUsernames.find(
          (username) => username !== session.username
        ) ?? "";

      const publish = () => {
        if (!closed) {
          send({
            messages,
            typingUsers,
            room: authorizedRoom.room,
            presence,
          });
        }
      };

      const cleanup = () => {
        if (closed) {
          return;
        }

        closed = true;
        unsubscribeMessages();
        unsubscribeTyping();
        unsubscribePresence();
        clearInterval(heartbeat);
        controller.close();
      };

      const unsubscribeMessages = getRoomMessagesCollection(roomId)
        .orderBy("createdAt", "desc")
        .limit(PRIVATE_CHAT_MESSAGE_LIMIT)
        .onSnapshot(
          (snapshot) => {
            messages = snapshot.docs.map(mapMessage).reverse();
            publish();
          },
          (error) => {
            if (!closed) {
              send({
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to stream messages.",
              });
            }
            cleanup();
          }
        );

      const unsubscribeTyping = getRoomTypingCollection(roomId).onSnapshot(
        (snapshot) => {
          typingUsers = snapshot.docs
            .map(mapTypingUser)
            .filter(
              (user) =>
                user.username !== session.username &&
                Date.now() - user.updatedAt <= PRIVATE_CHAT_TYPING_TTL_MS
            );
          publish();
        },
        (error) => {
          if (!closed) {
            send({
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to stream typing state.",
            });
          }
          cleanup();
        }
      );

      const unsubscribePresence = otherUsername
        ? getPresenceRef(otherUsername).onSnapshot(
            (snapshot) => {
              const nextPresence = mapPresenceRecord(snapshot);

              presence = nextPresence
                ? {
                    ...nextPresence,
                    isOnline:
                      nextPresence.isOnline &&
                      Date.now() - nextPresence.updatedAt <=
                        PRIVATE_CHAT_PRESENCE_TTL_MS,
                  }
                : null;
              publish();
            },
            (error) => {
              if (!closed) {
                send({
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to stream presence.",
                });
              }
              cleanup();
            }
          )
        : () => {};

      const heartbeat = setInterval(() => {
        if (!closed) {
          send({ type: "heartbeat" });
        }
      }, 15000);

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: SSE_HEADERS,
  });
}
