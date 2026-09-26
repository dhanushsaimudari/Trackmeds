/**
 * TRACKMEDS — Firestore Cloud Database Service
 * Provides structured query, write, and synchronization capabilities for the NoSQL schema.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Facility,
  InventoryItem,
  RedistributionItem,
  ReplenishmentItem,
  SupplierItem
} from '../types';
import {
  SEED_FACILITIES,
  SEED_INVENTORY,
  SEED_REDISTRIBUTIONS,
  SEED_REPLENISHMENTS,
  SEED_SUPPLIERS
} from './mockData';

export const firestoreService = {
  /**
   * Fetch facilities from Firestore with optional country/district filtering.
   */
  async getFacilities(country = 'All', district = 'All'): Promise<Facility[] | null> {
    try {
      const colRef = collection(db, 'facilities');
      let q = query(colRef);

      if (country !== 'All') {
        q = query(colRef, where('country', '==', country));
      }

      const snap = await getDocs(q);
      if (snap.empty) return null;

      const list: Facility[] = [];
      snap.forEach(d => {
        const data = d.data() as Facility;
        if (district === 'All' || data.district === district) {
          list.push(data);
        }
      });
      return list.length > 0 ? list : null;
    } catch (err) {
      console.warn('Firestore getFacilities error, using local fallback:', err);
      return null;
    }
  },

  /**
   * Fetch inventory items from Firestore.
   */
  async getInventory(params: { facilityId?: string; riskLevel?: string } = {}): Promise<InventoryItem[] | null> {
    try {
      const colRef = collection(db, 'inventory');
      let q = query(colRef);

      if (params.facilityId) {
        q = query(colRef, where('facility_id', '==', params.facilityId));
      }

      const snap = await getDocs(q);
      if (snap.empty) return null;

      const list: InventoryItem[] = [];
      snap.forEach(d => {
        const item = d.data() as InventoryItem;
        if (!params.riskLevel || params.riskLevel === 'All' || item.risk_level === params.riskLevel) {
          list.push(item);
        }
      });
      return list.length > 0 ? list : null;
    } catch (err) {
      console.warn('Firestore getInventory error:', err);
      return null;
    }
  },

  /**
   * Fetch redistribution recommendations from Firestore.
   */
  async getRedistributions(country = 'All'): Promise<RedistributionItem[] | null> {
    try {
      const colRef = collection(db, 'redistributions');
      let q = query(colRef);

      if (country !== 'All') {
        q = query(colRef, where('country', '==', country));
      }

      const snap = await getDocs(q);
      if (snap.empty) return null;

      const list: RedistributionItem[] = [];
      snap.forEach(d => list.push(d.data() as RedistributionItem));
      return list;
    } catch (err) {
      console.warn('Firestore getRedistributions error:', err);
      return null;
    }
  },

  /**
   * Approve a redistribution dispatch order in Firestore.
   */
  async approveRedistribution(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'redistributions', id);
      await updateDoc(docRef, {
        status: 'Approved',
        approved_at: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.warn('Firestore approveRedistribution error:', err);
      return false;
    }
  },

  /**
   * Fetch replenishment purchase orders from Firestore.
   */
  async getReplenishments(country = 'India'): Promise<ReplenishmentItem[] | null> {
    try {
      const colRef = collection(db, 'replenishments');
      const snap = await getDocs(colRef);
      if (snap.empty) return null;

      const list: ReplenishmentItem[] = [];
      snap.forEach(d => {
        const item = d.data() as ReplenishmentItem;
        list.push(item);
      });
      return list;
    } catch (err) {
      console.warn('Firestore getReplenishments error:', err);
      return null;
    }
  },

  /**
   * Approve replenishment purchase order in Firestore.
   */
  async approveReplenishment(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'replenishments', id);
      await updateDoc(docRef, {
        status: 'Approved',
        approved_at: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.warn('Firestore approveReplenishment error:', err);
      return false;
    }
  },

  /**
   * Fetch suppliers from Firestore.
   */
  async getSuppliers(): Promise<SupplierItem[] | null> {
    try {
      const colRef = collection(db, 'suppliers');
      const snap = await getDocs(colRef);
      if (snap.empty) return null;

      const list: SupplierItem[] = [];
      snap.forEach(d => list.push(d.data() as SupplierItem));
      return list;
    } catch (err) {
      console.warn('Firestore getSuppliers error:', err);
      return null;
    }
  },

  /**
   * One-click seed function to push the entire structured dataset to Firestore.
   */
  async seedFirestore(): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Seed Facilities
      for (const fac of SEED_FACILITIES) {
        await setDoc(doc(db, 'facilities', fac.id), {
          ...fac,
          updated_at: new Date().toISOString()
        });
      }

      // 2. Seed Inventory
      for (const inv of SEED_INVENTORY) {
        await setDoc(doc(db, 'inventory', inv.id), {
          ...inv,
          last_updated: new Date().toISOString()
        });
      }

      // 3. Seed Redistributions
      for (const rd of SEED_REDISTRIBUTIONS) {
        await setDoc(doc(db, 'redistributions', rd.id), {
          ...rd,
          updated_at: new Date().toISOString()
        });
      }

      // 4. Seed Replenishments
      for (const rpl of SEED_REPLENISHMENTS) {
        await setDoc(doc(db, 'replenishments', rpl.id), {
          ...rpl,
          updated_at: new Date().toISOString()
        });
      }

      // 5. Seed Suppliers
      for (const sup of SEED_SUPPLIERS) {
        await setDoc(doc(db, 'suppliers', sup.id), {
          ...sup,
          updated_at: new Date().toISOString()
        });
      }

      return {
        success: true,
        message: `Successfully synchronized ${SEED_FACILITIES.length} facilities, ${SEED_INVENTORY.length} inventory items, ${SEED_REDISTRIBUTIONS.length} redistributions, and suppliers to Firestore!`
      };
    } catch (err: any) {
      console.error('Failed to seed Firestore:', err);
      return {
        success: false,
        message: `Firestore sync failed: ${err.message || String(err)}`
      };
    }
  }
};
