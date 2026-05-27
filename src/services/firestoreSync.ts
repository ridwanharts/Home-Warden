import { collection, doc, setDoc, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { MaintenanceZone, InventoryItem, RepairDiagnosis } from '../types';

// Save user profile doc
export async function saveUserDoc(userId: string, email: string, displayName: string, photoURL: string) {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, path), {
      uid: userId,
      email: email,
      displayName: displayName || '',
      photoURL: photoURL || '',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to Maintenance Zones
export function subscribeZones(userId: string, onSuccess: (zones: MaintenanceZone[]) => void) {
  const path = `users/${userId}/zones`;
  const q = collection(db, path);
  return onSnapshot(q, (snapshot) => {
    const list: MaintenanceZone[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as MaintenanceZone);
    });
    onSuccess(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Subscribe to Inventory
export function subscribeInventory(userId: string, onSuccess: (items: InventoryItem[]) => void) {
  const path = `users/${userId}/inventory`;
  const q = collection(db, path);
  return onSnapshot(q, (snapshot) => {
    const list: InventoryItem[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as InventoryItem);
    });
    onSuccess(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Subscribe to History
export function subscribeHistory(userId: string, onSuccess: (history: RepairDiagnosis[]) => void) {
  const path = `users/${userId}/history`;
  const q = collection(db, path);
  return onSnapshot(q, (snapshot) => {
    const list: RepairDiagnosis[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as RepairDiagnosis);
    });
    // Sort by timestamp descending
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    onSuccess(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Remote Save Zone
export async function remoteSaveZone(userId: string, zone: MaintenanceZone) {
  const path = `users/${userId}/zones/${zone.id}`;
  try {
    await setDoc(doc(db, `users/${userId}/zones`, zone.id), zone);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Remote Save Inventory Item
export async function remoteSaveInventoryItem(userId: string, item: InventoryItem) {
  const path = `users/${userId}/inventory/${item.id}`;
  try {
    await setDoc(doc(db, `users/${userId}/inventory`, item.id), item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Remote Save History Entry
export async function remoteSaveHistory(userId: string, entry: RepairDiagnosis) {
  // Generate random id if doesn't exist
  const historyId = Math.random().toString(36).substring(2, 11);
  const path = `users/${userId}/history/${historyId}`;
  try {
    await setDoc(doc(db, `users/${userId}/history`, historyId), entry);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Initial Sync: Push local offline data to Cloud on first Google connection
export async function uploadLocalDataToCloud(userId: string, localZones: MaintenanceZone[], localInventory: InventoryItem[], localHistory: RepairDiagnosis[]) {
  try {
    // 1. Check if user already has data in cloud to avoid overwriting their cloud backups
    const zonesSnap = await getDocs(collection(db, `users/${userId}/zones`));
    const invSnap = await getDocs(collection(db, `users/${userId}/inventory`));
    const histSnap = await getDocs(collection(db, `users/${userId}/history`));

    const pathTemplate = `users/${userId}/batch`;
    const batch = writeBatch(db);
    let dirty = false;

    // Direct push only if cloud has no records
    if (zonesSnap.empty) {
      localZones.forEach((z) => {
        const ref = doc(db, `users/${userId}/zones`, z.id);
        batch.set(ref, z);
        dirty = true;
      });
    }
    
    if (invSnap.empty) {
      localInventory.forEach((item) => {
        const ref = doc(db, `users/${userId}/inventory`, item.id);
        batch.set(ref, item);
        dirty = true;
      });
    }

    if (histSnap.empty) {
      localHistory.forEach((entry) => {
        const id = Math.random().toString(36).substring(2, 11);
        const ref = doc(db, `users/${userId}/history`, id);
        batch.set(ref, entry);
        dirty = true;
      });
    }

    if (dirty) {
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/batch-upload`);
  }
}
