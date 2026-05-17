
import { openDB, IDBPDatabase } from 'idb';
import { db, auth } from './firebase';
import { doc, setDoc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  isJournal?: boolean;
  notebookId?: string;
}

export interface Notebook {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  codeMessage: string;
}

export interface VaultItem {
  id: string;
  type: 'text' | 'image' | 'voice' | 'document' | 'location';
  encryptedPayload: string;
  label: string;
  metadata?: {
    tags?: string[];
    mimeType?: string;
    fileName?: string;
  };
  timestamp: number;
}

const DB_NAME = 'quietink-storage';
const DB_VERSION = 2;

export async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('vault')) {
        db.createObjectStore('vault', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('notebooks')) {
        db.createObjectStore('notebooks', { keyPath: 'id' });
      }
    },
  });
}

export const Storage = {
  async saveNote(note: Note) {
    const dbLocal = await getDB();
    await dbLocal.put('notes', note);

    if (auth.currentUser) {
      const path = `users/${auth.currentUser.uid}/notes/${note.id}`;
      try {
        await setDoc(doc(db, path), { ...note, ownerId: auth.currentUser.uid });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    }
  },
  async getNotes(): Promise<Note[]> {
    const dbLocal = await getDB();
    return dbLocal.getAll('notes');
  },
  async deleteNote(id: string) {
    const dbLocal = await getDB();
    await dbLocal.delete('notes', id);

    if (auth.currentUser) {
      const path = `users/${auth.currentUser.uid}/notes/${id}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
      }
    }
  },
  async saveContact(contact: EmergencyContact) {
    const dbLocal = await getDB();
    await dbLocal.put('contacts', contact);

    if (auth.currentUser) {
      const path = `users/${auth.currentUser.uid}/contacts/${contact.id}`;
      try {
        await setDoc(doc(db, path), { ...contact, ownerId: auth.currentUser.uid });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    }
  },
  async getContacts(): Promise<EmergencyContact[]> {
    const dbLocal = await getDB();
    return dbLocal.getAll('contacts');
  },
  async deleteContact(id: string) {
    const dbLocal = await getDB();
    await dbLocal.delete('contacts', id);

    if (auth.currentUser) {
      const path = `users/${auth.currentUser.uid}/contacts/${id}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
      }
    }
  },
  async saveVaultItem(item: VaultItem) {
    const dbLocal = await getDB();
    await dbLocal.put('vault', item);

    if (auth.currentUser) {
      const path = `users/${auth.currentUser.uid}/vault/${item.id}`;
      try {
        await setDoc(doc(db, path), { ...item, ownerId: auth.currentUser.uid });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    }
  },
  async getVaultItems(): Promise<VaultItem[]> {
    const dbLocal = await getDB();
    return dbLocal.getAll('vault');
  },
  async deleteVaultItem(id: string) {
    const dbLocal = await getDB();
    await dbLocal.delete('vault', id);

    if (auth.currentUser) {
      const path = `users/${auth.currentUser.uid}/vault/${id}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
      }
    }
  },

  // --- Notebooks ---
  async saveNotebook(notebook: Notebook) {
    const dbLocal = await getDB();
    await dbLocal.put('notebooks', notebook);

    if (auth.currentUser) {
      const path = `users/${auth.currentUser.uid}/notebooks/${notebook.id}`;
      try {
        await setDoc(doc(db, path), { ...notebook, ownerId: auth.currentUser.uid });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    }
  },
  async getNotebooks(): Promise<Notebook[]> {
    const dbLocal = await getDB();
    return dbLocal.getAll('notebooks');
  },
  async deleteNotebook(id: string) {
    const dbLocal = await getDB();
    await dbLocal.delete('notebooks', id);

    // Move notes from deleted notebook to uncategorized
    const notes = await dbLocal.getAll('notes') as Note[];
    for (const note of notes) {
      if (note.notebookId === id) {
        note.notebookId = undefined;
        await dbLocal.put('notes', note);
      }
    }

    if (auth.currentUser) {
      const path = `users/${auth.currentUser.uid}/notebooks/${id}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
      }
    }
  },

  async saveSetting(key: string, value: any) {
    const dbLocal = await getDB();
    await dbLocal.put('settings', { key, value });
  },
  async getSetting<T>(key: string): Promise<T | undefined> {
    const dbLocal = await getDB();
    const result = await dbLocal.get('settings', key);
    return result?.value;
  },

  /**
   * Syncs all local data to Firestore for the current user.
   */
  async syncToCloud() {
    if (!auth.currentUser) throw new Error("Must be logged in to sync.");
    
    console.log("Starting cloud sync...");
    const notes = await this.getNotes();
    const contacts = await this.getContacts();
    const vault = await this.getVaultItems();

    const notebooks = await this.getNotebooks();

    for (const note of notes) await this.saveNote(note);
    for (const contact of contacts) await this.saveContact(contact);
    for (const item of vault) await this.saveVaultItem(item);
    for (const nb of notebooks) await this.saveNotebook(nb);
    
    console.log("Cloud sync complete.");
  },

  /**
   * Pulls all data from Firestore to local storage.
   */
  async pullFromCloud() {
    if (!auth.currentUser) throw new Error("Must be logged in to pull data.");
    const uid = auth.currentUser.uid;
    const dbLocal = await getDB();

    const fetchCollection = async (collName: string, localStore: string) => {
      const path = `users/${uid}/${collName}`;
      try {
        const q = query(collection(db, path));
        const snapshot = await getDocs(q);
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          delete data.ownerId; // Remove ownerId before local save
          await dbLocal.put(localStore, data);
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, path);
      }
    };

    await fetchCollection('notes', 'notes');
    await fetchCollection('contacts', 'contacts');
    await fetchCollection('vault', 'vault');
    await fetchCollection('notebooks', 'notebooks');
  }
};
