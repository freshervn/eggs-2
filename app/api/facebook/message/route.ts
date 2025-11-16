import { NextRequest, NextResponse } from "next/server";

// Facebook Profile ID extracted from the URL
const FACEBOOK_PROFILE_ID = "61583914557523";
const FACEBOOK_GRAPH_API_URL = "https://graph.facebook.com/v21.0";

interface MessageRequest {
  message: string;
  recipientId?: string; // Optional: override default profile ID
}

/**
 * POST /api/facebook/message
 * Send a message to Facebook profile
 * 
 * Note: Facebook Messenger API requires:
 * - A Facebook Page (not personal profile)
 * - App setup with proper permissions
 * - Page Access Token
 * - Recipient must have interacted with your page first
 * 
 * For personal profiles, this endpoint will generate a messenger link
 */
export async function POST(request: NextRequest) {
  try {
    const body: MessageRequest = await request.json();

    // Validate required fields
    if (!body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const recipientId = body.recipientId || FACEBOOK_PROFILE_ID;
    const message = body.message.trim();

    // Check if Facebook Page Access Token is configured
    const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    // If we have the required credentials, try to send via Messenger API
    // Note: Messenger API requires PSID (Page-Scoped ID), not profile ID
    // The recipient must have interacted with your page first to get their PSID
    if (pageAccessToken && pageId) {
      try {
        // In production, you would:
        // 1. Store PSID mappings in your database (when users interact with your page)
        // 2. Look up the PSID from the recipientId/profile ID
        // 3. Use the PSID to send the message
        
        // For now, we'll check if there's a PSID mapping in environment or database
        // This is a placeholder - you'll need to implement PSID lookup
        const psid = process.env[`FACEBOOK_PSID_${recipientId}`] || null;
        
        if (psid) {
          const messengerResponse = await fetch(
            `${FACEBOOK_GRAPH_API_URL}/me/messages`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${pageAccessToken}`,
              },
              body: JSON.stringify({
                recipient: { id: psid },
                message: { text: message },
                messaging_type: "MESSAGE_TAG",
                tag: "CONFIRMED_EVENT_UPDATE", // Or other appropriate tag
              }),
            }
          );

          if (messengerResponse.ok) {
            const result = await messengerResponse.json();
            return NextResponse.json(
              {
                success: true,
                message: "Message sent successfully via Messenger API",
                messageId: result.message_id,
              },
              { status: 200 }
            );
          } else {
            const error = await messengerResponse.json();
            console.error("Facebook Messenger API error:", error);
            // Fall through to messenger link generation
          }
        } else {
          console.log(
            `PSID not found for recipient ${recipientId}. Using messenger link fallback.`
          );
          // Fall through to messenger link generation
        }
      } catch (apiError) {
        console.error("Error calling Facebook Messenger API:", apiError);
        // Fall through to messenger link generation
      }
    }

    // Fallback: Generate a messenger link
    // This opens Facebook Messenger with a pre-filled message
    const messengerLink = `https://m.me/${recipientId}?text=${encodeURIComponent(message)}`;
    const webMessengerLink = `https://www.facebook.com/messages/t/${recipientId}`;

    return NextResponse.json(
      {
        success: true,
        message: "Messenger link generated (Messenger API not configured or unavailable)",
        messengerLink,
        webMessengerLink,
        recipientId,
        note: "Use the messengerLink to open Messenger with the pre-filled message. For API integration, configure FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID environment variables.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending Facebook message:", error);
    return NextResponse.json(
      {
        error: "Failed to send message",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/facebook/message
 * Get messenger link for the configured Facebook profile
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get("recipientId") || FACEBOOK_PROFILE_ID;
    const message = searchParams.get("message") || "";

    const messengerLink = message
      ? `https://m.me/${recipientId}?text=${encodeURIComponent(message)}`
      : `https://m.me/${recipientId}`;
    
    const webMessengerLink = `https://www.facebook.com/messages/t/${recipientId}`;

    return NextResponse.json(
      {
        success: true,
        recipientId,
        messengerLink,
        webMessengerLink,
        profileUrl: `https://www.facebook.com/profile.php?id=${recipientId}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting messenger link:", error);
    return NextResponse.json(
      {
        error: "Failed to get messenger link",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


