// Firebase Configuration Template
// Copy this file to src/config/firebase.ts and fill in your actual Firebase values

export const firebaseConfig = {
  apiKey: "your_api_key_here",
  authDomain: "your_project_id.firebaseapp.com",
  projectId: "your_project_id_here",
  storageBucket: "your_project_id.appspot.com",
  messagingSenderId: "your_sender_id_here",
  appId: "your_app_id_here",
  measurementId: "your_measurement_id_here"
};

// Optional: Firebase Emulator Configuration (for local development)
export const emulatorConfig = {
  useEmulator: false,
  authHost: "localhost:9099",
  firestoreHost: "localhost:8080",
  storageHost: "localhost:9199"
};
