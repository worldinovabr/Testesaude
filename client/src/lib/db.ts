import { TestResult, Reminder, UserPreferences, AnyTestResult } from './types';

const DB_NAME = 'SensoryCheckup';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Store para resultados de testes
      if (!database.objectStoreNames.contains('testResults')) {
        const testStore = database.createObjectStore('testResults', { keyPath: 'id' });
        testStore.createIndex('type', 'type', { unique: false });
        testStore.createIndex('timestamp', 'timestamp', { unique: false });
        testStore.createIndex('typeTimestamp', ['type', 'timestamp'], { unique: false });
      }

      // Store para lembretes
      if (!database.objectStoreNames.contains('reminders')) {
        database.createObjectStore('reminders', { keyPath: 'id' });
      }

      // Store para preferências do usuário
      if (!database.objectStoreNames.contains('preferences')) {
        database.createObjectStore('preferences', { keyPath: 'key' });
      }
    };
  });
}

export async function getDB(): Promise<IDBDatabase> {
  if (!db) {
    db = await initDB();
  }
  return db;
}

// ===== Test Results =====

export async function saveTestResult(result: AnyTestResult): Promise<string> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['testResults'], 'readwrite');
    const store = transaction.objectStore('testResults');
    const request = store.add(result);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as string);
  });
}

export async function getAllTestResults(): Promise<AnyTestResult[]> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['testResults'], 'readonly');
    const store = transaction.objectStore('testResults');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as AnyTestResult[]);
  });
}

export async function getTestResultsByType(type: string): Promise<AnyTestResult[]> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['testResults'], 'readonly');
    const store = transaction.objectStore('testResults');
    const index = store.index('type');
    const request = index.getAll(type);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as AnyTestResult[]);
  });
}

export async function getTestResultsByTypeAndDate(
  type: string,
  startDate: number,
  endDate: number
): Promise<AnyTestResult[]> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['testResults'], 'readonly');
    const store = transaction.objectStore('testResults');
    const index = store.index('typeTimestamp');
    const range = IDBKeyRange.bound([type, startDate], [type, endDate]);
    const request = index.getAll(range);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as AnyTestResult[]);
  });
}

export async function deleteTestResult(id: string): Promise<void> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['testResults'], 'readwrite');
    const store = transaction.objectStore('testResults');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ===== Reminders =====

export async function saveReminder(reminder: Reminder): Promise<string> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['reminders'], 'readwrite');
    const store = transaction.objectStore('reminders');
    const request = store.put(reminder);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as string);
  });
}

export async function getAllReminders(): Promise<Reminder[]> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['reminders'], 'readonly');
    const store = transaction.objectStore('reminders');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as Reminder[]);
  });
}

export async function deleteReminder(id: string): Promise<void> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['reminders'], 'readwrite');
    const store = transaction.objectStore('reminders');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ===== Preferences =====

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['preferences'], 'readwrite');
    const store = transaction.objectStore('preferences');

    Object.entries(prefs).forEach(([key, value]) => {
      store.put({ key, value });
    });

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}

export async function getPreferences(): Promise<Partial<UserPreferences>> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['preferences'], 'readonly');
    const store = transaction.objectStore('preferences');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const prefs: Partial<UserPreferences> = {};
      (request.result as Array<{ key: string; value: any }>).forEach(({ key, value }) => {
        (prefs as any)[key] = value;
      });
      resolve(prefs);
    };
  });
}

export async function clearAllData(): Promise<void> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['testResults', 'reminders', 'preferences'], 'readwrite');

    transaction.objectStore('testResults').clear();
    transaction.objectStore('reminders').clear();
    transaction.objectStore('preferences').clear();

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}
