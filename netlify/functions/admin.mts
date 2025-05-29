import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config();

const firebaseCredentials = process.env.FIREBASE_CREDENTIALS;
if (!firebaseCredentials) {
  throw new Error("FIREBASE_CREDENTIALS environment variable is missing");
}

// Decode and parse credentials
const decoded = Buffer.from(firebaseCredentials, 'base64').toString('utf-8');
const serviceAccount = JSON.parse(decoded);

// Prevent reinitializing in Netlify's cold starts
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const adminAuth = getAuth();
const db = getFirestore();

export async function handler(event: any) {

  try {
    const { action, userId, email, password, disabled, newRole, performedBy } = JSON.parse(event.body || '{}');
    const token = event.headers.authorization?.split(' ')[1];

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    let result: any = null;
    const timestamp = new Date().toISOString();

    switch (action) {
      case 'deleteUser':
        await adminAuth.deleteUser(userId);
        result = { message: "User deleted" };
        break;

      case 'resetPassword':
        await adminAuth.generatePasswordResetLink(email);
        result = { message: "Password reset email sent" };
        break;

      case 'toggleUserStatus':
        await adminAuth.updateUser(userId, { disabled });
        result = { message: "User status updated" };
        break;

      case 'createUser':
        const userRecord = await adminAuth.createUser({ email, password });
        result = { uid: userRecord.uid };
        break;
      case 'changeUserRole':
        await db.collection('users').doc(userId).update({ role: newRole });
        result = { message: "User role updated" };
        break;

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid action" }),
        };
    }
    const targetUserRecord = await adminAuth.getUser(userId);
    const targetEmail = targetUserRecord.email;
    await db.collection("logs").add({
      action,
      performedBy: performedBy,
      targetUser: targetEmail || userId,
      timestamp,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error("Admin function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
