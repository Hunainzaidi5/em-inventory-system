import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  setDoc,
  writeBatch,
  WriteBatch
} from 'firebase/firestore';
import { db } from './firebase';

export class FirebaseService {
  // Generic CRUD operations
  static async create<T extends DocumentData>(
    collectionName: string, 
    data: T
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  static async upsert<T extends DocumentData>(
    collectionName: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, { ...data, updatedAt: new Date() }, { merge: true });
    } catch (error) {
      console.error('Error upserting document:', error);
      throw error;
    }
  }

  static async getById<T>(
    collectionName: string, 
    id: string
  ): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  static async update<T extends DocumentData>(
    collectionName: string, 
    id: string, 
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  static async delete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  static async query<T>(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  }

  // Pagination helper
  static async queryWithPagination<T>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
    pageSize: number = 10,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<{ data: T[]; lastDoc: QueryDocumentSnapshot | null }> {
    try {
      let q = query(
        collection(db, collectionName),
        ...constraints,
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

      return { data, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error querying with pagination:', error);
      throw error;
    }
  }

  // Real-time listeners (for future use)
  static async subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    constraints: QueryConstraint[] = []
  ) {
    // This would be implemented with onSnapshot for real-time updates
    // For now, we'll use the basic query method
    return this.query<T>(collectionName, constraints).then(callback);
  }

  // Batch operations
  static getBatch() {
    return writeBatch(db);
  }

  static getDocRef(collectionName: string, id: string) {
    return doc(db, collectionName, id);
  }
}
