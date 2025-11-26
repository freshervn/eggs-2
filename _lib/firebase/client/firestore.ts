import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";

// Generic types for Firestore operations
export interface FirestoreDocument {
  id?: string;
  [key: string]: unknown;
}

/**
 * Remove undefined values from an object (Firestore doesn't accept undefined)
 */
const removeUndefinedValues = <T extends Record<string, unknown>>(
  obj: T
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
};

/**
 * Get a single document by ID
 */
export const getDocument = async <T extends FirestoreDocument>(
  collectionName: string,
  documentId: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

/**
 * Get all documents from a collection
 */
export const getDocuments = async <T extends FirestoreDocument>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  try {
    const collectionRef = collection(db, collectionName);
    const q =
      constraints.length > 0
        ? query(collectionRef, ...constraints)
        : query(collectionRef);

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as T)
    );
  } catch (error) {
    console.error("Error getting documents:", error);
    throw error;
  }
};

/**
 * Add a new document to a collection
 * Verifies the document was actually created before returning the ID
 */
export const addDocument = async <T extends FirestoreDocument>(
  collectionName: string,
  data: Omit<T, "id">
): Promise<string> => {
  try {
    // Remove undefined values before sending to Firestore
    const cleanData = removeUndefinedValues({
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });    
    const collectionRef = collection(db, collectionName);
    console.log(collectionRef.path)
    const docRef = await addDoc(collectionRef, cleanData);

    // Verify the document was actually created
    const verifyDoc = await getDoc(docRef);
    if (!verifyDoc.exists()) {
      throw new Error(
        `Document was not created in collection "${collectionName}" despite addDoc success`
      );
    }
    console.log(docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("Error adding document:", error);
    throw error;
  }
};

/**
 * Update an existing document
 */
export const updateDocument = async <T extends FirestoreDocument>(
  collectionName: string,
  documentId: string,
  data: Partial<Omit<T, "id">>
): Promise<void> => {
  try {
    // Remove undefined values before sending to Firestore
    const cleanData = removeUndefinedValues({
      ...data,
      updatedAt: Timestamp.now(),
    });

    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (
  collectionName: string,
  documentId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// Helper functions for common queries
export const queryHelpers = {
  where,
  orderBy,
  limit,
};
