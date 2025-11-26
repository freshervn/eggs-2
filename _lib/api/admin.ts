/**
 * Add a notification recipient ID to the database
 * @param {string} id - The Facebook sender/user ID to be notified
 * @returns {Promise<void>}
 */
export const addNotificationId = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error("id is required");
  }

  // Lazy import to avoid issues if used only on the server
  const { admin } = await import("@/_lib/firebase/Admin");
  const db = admin.firestore();
  // Check if the ID already exists in the collection; if so, return early
  const snapshot = await db
    .collection("Notification_ID")
    .where("id", "==", id)
    .get();
  if (!snapshot.empty) {
    // ID already exists, do not add again
    return;
  }

  await db.collection("Notification_ID").add({ id });
};
