import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export type BookingStatus = 'pending' | 'accepted' | 'en_route' | 'arrived' | 'complete';

export interface Booking {
  id?: string;
  type: 'ride' | 'package';
  status: BookingStatus;
  fromAddress: string;
  toAddress: string;
  miles: number;
  minutes: number;
  total: number;
  payMethod: string;
  customerName: string;
  customerPhone: string;
  createdAt: Timestamp;
}

// Customer creates a booking
export async function createBooking(data: Omit<Booking, 'id' | 'createdAt' | 'status'>) {
  const ref = await addDoc(collection(db, 'bookings'), {
    ...data,
    status: 'pending',
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

// Driver updates booking status
export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  await updateDoc(doc(db, 'bookings', bookingId), { status });
}

// Driver listens for new pending bookings in real time
export function listenForPendingBookings(callback: (bookings: Booking[]) => void) {
  const q = query(
    collection(db, 'bookings'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
    callback(bookings);
  });
}

// Customer listens for their booking status in real time
export function listenToBooking(bookingId: string, callback: (booking: Booking) => void) {
  return onSnapshot(doc(db, 'bookings', bookingId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() } as Booking);
  });
}
// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const { messaging } = await import('./firebase');
    const { getToken } = await import('firebase/messaging');
    const m = await messaging();
    if (!m) return null;

    const token = await getToken(m, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    return token;
  } catch (err) {
    console.error('Notification permission error:', err);
    return null;
  }
}