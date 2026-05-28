import { collection, doc, setDoc, onSnapshot, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { MaintenanceZone, InventoryItem, RepairDiagnosis, HouseRoom } from '../types';

// Utility helper to recursively remove undefined properties from objects
// Firestore SDK fails and crashes when given any explicit "undefined" values
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefined(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

// Save user profile doc
export async function saveUserDoc(userId: string, email: string, displayName: string, photoURL: string) {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, path), cleanUndefined({
      uid: userId,
      email: email,
      displayName: displayName || '',
      photoURL: photoURL || '',
      createdAt: new Date().toISOString()
    }));
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
    await setDoc(doc(db, `users/${userId}/zones`, zone.id), cleanUndefined(zone));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Remote Save Inventory Item
export async function remoteSaveInventoryItem(userId: string, item: InventoryItem) {
  const path = `users/${userId}/inventory/${item.id}`;
  try {
    await setDoc(doc(db, `users/${userId}/inventory`, item.id), cleanUndefined(item));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to Rooms
export function subscribeRooms(userId: string, onSuccess: (rooms: HouseRoom[]) => void) {
  const path = `users/${userId}/rooms`;
  const q = collection(db, path);
  return onSnapshot(q, (snapshot) => {
    const list: HouseRoom[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as HouseRoom);
    });
    // Sort by createdAt ascending or name ascending
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    onSuccess(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Remote Save Room
export async function remoteSaveRoom(userId: string, room: HouseRoom) {
  const path = `users/${userId}/rooms/${room.id}`;
  try {
    await setDoc(doc(db, `users/${userId}/rooms`, room.id), cleanUndefined(room));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Remote Delete Room
export async function remoteDeleteRoom(userId: string, roomId: string) {
  const path = `users/${userId}/rooms/${roomId}`;
  try {
    await deleteDoc(doc(db, `users/${userId}/rooms`, roomId));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Remote Delete Inventory Item
export async function remoteDeleteInventoryItem(userId: string, itemId: string) {
  const path = `users/${userId}/inventory/${itemId}`;
  try {
    await deleteDoc(doc(db, `users/${userId}/inventory`, itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Remote Delete Maintenance Zone
export async function remoteDeleteZone(userId: string, zoneId: string) {
  const path = `users/${userId}/zones/${zoneId}`;
  try {
    await deleteDoc(doc(db, `users/${userId}/zones`, zoneId));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Remote Save History Entry
export async function remoteSaveHistory(userId: string, entry: RepairDiagnosis) {
  const path = `users/${userId}/history/${entry.id}`;
  try {
    await setDoc(doc(db, `users/${userId}/history`, entry.id), cleanUndefined(entry));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Remote Delete History Entry
export async function remoteDeleteHistory(userId: string, entryId: string) {
  const path = `users/${userId}/history/${entryId}`;
  try {
    await deleteDoc(doc(db, `users/${userId}/history`, entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Initial Sync: Push local offline data to Cloud on first Google connection with active merging
export async function uploadLocalDataToCloud(
  userId: string, 
  localZones: MaintenanceZone[], 
  localInventory: InventoryItem[], 
  localHistory: RepairDiagnosis[],
  localRooms: HouseRoom[]
) {
  try {
    // 1. Fetch current cloud state to merge smart data properly
    const zonesSnap = await getDocs(collection(db, `users/${userId}/zones`));
    const invSnap = await getDocs(collection(db, `users/${userId}/inventory`));
    const histSnap = await getDocs(collection(db, `users/${userId}/history`));
    const roomsSnap = await getDocs(collection(db, `users/${userId}/rooms`));

    const batch = writeBatch(db);
    let dirty = false;

    // A. Merge Zones: Last Write Wins based on lastMaintained
    const cloudZonesMap = new Map(zonesSnap.docs.map(docSnap => [docSnap.id, docSnap.data() as MaintenanceZone]));
    localZones.forEach((z) => {
      if (!cloudZonesMap.has(z.id)) {
        const ref = doc(db, `users/${userId}/zones`, z.id);
        batch.set(ref, cleanUndefined(z));
        dirty = true;
      } else {
        const cloudZ = cloudZonesMap.get(z.id)!;
        const localTime = new Date(z.lastMaintained || 0).getTime();
        const cloudTime = new Date(cloudZ.lastMaintained || 0).getTime();
        if (localTime > cloudTime) {
          const ref = doc(db, `users/${userId}/zones`, z.id);
          batch.set(ref, cleanUndefined(z));
          dirty = true;
        }
      }
    });

    // B. Merge Inventory: Last Write Wins based on lastUpdated
    const cloudInventoryMap = new Map(invSnap.docs.map(docSnap => [docSnap.id, docSnap.data() as InventoryItem]));
    localInventory.forEach((item) => {
      if (!cloudInventoryMap.has(item.id)) {
        const ref = doc(db, `users/${userId}/inventory`, item.id);
        batch.set(ref, cleanUndefined(item));
        dirty = true;
      } else {
        const cloudItem = cloudInventoryMap.get(item.id)!;
        const localTime = new Date(item.lastUpdated || 0).getTime();
        const cloudTime = new Date(cloudItem.lastUpdated || 0).getTime();
        if (localTime > cloudTime) {
          const ref = doc(db, `users/${userId}/inventory`, item.id);
          batch.set(ref, cleanUndefined(item));
          dirty = true;
        }
      }
    });

    // C. Merge History: Add missing entries
    const cloudHistoryIds = new Set(histSnap.docs.map(docSnap => docSnap.id));
    localHistory.forEach((entry) => {
      if (!cloudHistoryIds.has(entry.id)) {
        const ref = doc(db, `users/${userId}/history`, entry.id);
        batch.set(ref, cleanUndefined(entry));
        dirty = true;
      }
    });

    // D. Merge Rooms & inner Items list
    const cloudRoomsMap = new Map(roomsSnap.docs.map(docSnap => [docSnap.id, docSnap.data() as HouseRoom]));
    localRooms.forEach((r) => {
      if (!cloudRoomsMap.has(r.id)) {
        const ref = doc(db, `users/${userId}/rooms`, r.id);
        batch.set(ref, cleanUndefined(r));
        dirty = true;
      } else {
        // Room exists in both - merge union of room items cleanly so offline-added items are kept
        const cloudRoom = cloudRoomsMap.get(r.id)!;
        const cloudItemIds = new Set((cloudRoom.items || []).map(item => item.id));
        const mergedItems = [...(cloudRoom.items || [])];
        let itemsAdded = false;

        (r.items || []).forEach((localItem) => {
          if (!cloudItemIds.has(localItem.id)) {
            mergedItems.push(localItem);
            itemsAdded = true;
          }
        });

        if (itemsAdded) {
          const ref = doc(db, `users/${userId}/rooms`, r.id);
          batch.set(ref, cleanUndefined({
            ...cloudRoom,
            items: mergedItems
          }));
          dirty = true;
        }
      }
    });

    if (dirty) {
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/batch-upload`);
  }
}
