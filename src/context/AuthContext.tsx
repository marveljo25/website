import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/config";
import { User } from "../types";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  verifyEmail: (email: string) => Promise<void>;
  confirmOTP: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
  addToFavorites: (propertyId: string) => Promise<void>;
  removeFromFavorites: (propertyId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      // for later use
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data() as User);
        } else {
          const newUser: User = {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "",
            photoURL: user.photoURL || undefined,
            role: "user",
            favorites: [],
          };

          await setDoc(userDocRef, newUser);
          setUserData(newUser);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const existingUser = auth.currentUser;
      if (!existingUser) {
        await signOut(auth);
        throw new Error("Unauthorized: This Google account is not registered.");
      } else {
        const newUser: User = {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          photoURL: user.photoURL || undefined,
          role: "user",
          favorites: [],
        };
        await setDoc(userDocRef, newUser);
        setUserData(newUser);
      }
    }
  };

  const verifyEmail = async (email: string) => {
    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true,
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    setVerificationEmail(email);
    window.localStorage.setItem("emailForSignIn", email);
  };

  const confirmOTP = async (otp: string) => {
    if (!verificationEmail) {
      throw new Error("No email to verify");
    }

    if (isSignInWithEmailLink(auth, window.location.href)) {
      try {
        await signInWithEmailLink(
          auth,
          verificationEmail,
          window.location.href
        );
        window.localStorage.removeItem("emailForSignIn");
        setVerificationEmail(null);
      } catch (error) {
        console.error("Error signing in with email link:", error);
        throw error;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const addToFavorites = async (propertyId: string) => {
    if (!currentUser || !userData) return;

    const updatedFavorites = [...userData.favorites, propertyId];

    await setDoc(
      doc(db, "users", currentUser.uid),
      { ...userData, favorites: updatedFavorites },
      { merge: true }
    );

    setUserData({ ...userData, favorites: updatedFavorites });
  };

  const removeFromFavorites = async (propertyId: string) => {
    if (!currentUser || !userData) return;

    const updatedFavorites = userData.favorites.filter(
      (id) => id !== propertyId
    );

    await setDoc(
      doc(db, "users", currentUser.uid),
      { ...userData, favorites: updatedFavorites },
      { merge: true }
    );

    setUserData({ ...userData, favorites: updatedFavorites });
  };

  const value = {
    currentUser,
    userData,
    loading,
    login,
    loginWithGoogle,
    verifyEmail,
    confirmOTP,
    logout,
    addToFavorites,
    removeFromFavorites,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
