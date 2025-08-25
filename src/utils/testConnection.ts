import app from '@/lib/firebase';

interface TestResult {
  service: string;
  status: 'success' | 'error';
  message: string;
  error?: any;
}

export async function testAuthConnection(): Promise<TestResult> {
  try {
    // Lazy-load to avoid bundling errors in analysis tools without firebase deps
    const { getAuth } = await import(/* @vite-ignore */ 'firebase/auth');
    const auth = getAuth(app);
    await auth.signOut(); // Ensure we're signed out for the test
    return {
      service: 'Authentication',
      status: 'success',
      message: 'Successfully connected to Firebase Authentication',
    };
  } catch (error) {
    return {
      service: 'Authentication',
      status: 'error',
      message: 'Failed to connect to Firebase Authentication',
      error,
    };
  }
}

export async function testFirestoreConnection(): Promise<TestResult> {
  try {
    const { getFirestore, doc, getDoc } = await import(/* @vite-ignore */ 'firebase/firestore');
    const db = getFirestore(app);
    // Try to read a document that should exist
    const docRef = doc(db, 'systemSettings', 'main');
    await getDoc(docRef);
    
    return {
      service: 'Firestore',
      status: 'success',
      message: 'Successfully connected to Firestore',
    };
  } catch (error) {
    return {
      service: 'Firestore',
      status: 'error',
      message: 'Failed to connect to Firestore',
      error,
    };
  }
}

export async function testStorageConnection(): Promise<TestResult> {
  try {
    const { getStorage, ref, getMetadata } = await import(/* @vite-ignore */ 'firebase/storage');
    const storage = getStorage(app);
    // Try to get metadata of the root reference
    const storageRef = ref(storage, '/');
    await getMetadata(storageRef);
    
    return {
      service: 'Storage',
      status: 'success',
      message: 'Successfully connected to Firebase Storage',
    };
  } catch (error) {
    return {
      service: 'Storage',
      status: 'error',
      message: 'Failed to connect to Firebase Storage',
      error,
    };
  }
}

export async function runAllTests(): Promise<TestResult[]> {
  console.log('🧪 Running Firebase connection tests...');
  
  const results = await Promise.all([
    testAuthConnection(),
    testFirestoreConnection(),
    testStorageConnection(),
  ]);

  // Log results
  results.forEach(result => {
    const emoji = result.status === 'success' ? '✅' : '❌';
    console.log(`${emoji} ${result.service}: ${result.message}`);
    if (result.error) {
      console.error('Error details:', result.error);
    }
  });

  return results;
}

// Run tests if this file is executed directly (Node-only)
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  const argv1 = (process as any).argv?.[1] ?? '';
  const isDirectExecution = typeof import.meta !== 'undefined' && (import.meta as any).url && (import.meta as any).url.endsWith(argv1);
  if (isDirectExecution) {
    runAllTests().catch(console.error);
  }
}
