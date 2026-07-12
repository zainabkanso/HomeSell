const admin = require("firebase-admin");

let initialized = false;

const initializeFirebase = () => {
  if (initialized) {
    return admin;
  }

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!storageBucket) {
    throw new Error(
      "FIREBASE_STORAGE_BUCKET is missing from environment variables.",
    );
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT,
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket,
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket,
    });
  } else {
    throw new Error(
      "Firebase credentials missing. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.",
    );
  }

  initialized = true;
  return admin;
};

const getBucket = () => {
  initializeFirebase();
  return admin.storage().bucket();
};

module.exports = {
  initializeFirebase,
  getBucket,
  admin,
};
