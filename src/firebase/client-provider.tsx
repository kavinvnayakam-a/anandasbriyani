'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { FirebaseOptions } from 'firebase/app';

interface FirebaseClientProviderProps {
  children: ReactNode;
  config?: FirebaseOptions; // Accept config from server
}

export function FirebaseClientProvider({ children, config }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Pass the server-fetched config into the initializer
    return initializeFirebase(config);
  }, [config]); 

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}