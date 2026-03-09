export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

export const createSseEncoder = (
  controller: ReadableStreamDefaultController<Uint8Array>
) => {
  const encoder = new TextEncoder();

  return (data: unknown) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };
};
