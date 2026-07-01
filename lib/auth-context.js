"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  collectionGroup, 
  limit 
} from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [error, setError] = useState(null);

  const signInWithEmail = async (email, password) => {
    setError(null);
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCompany(null);
      setCompanyId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch the company associated with the user
  const fetchUserCompany = async (firebaseUser) => {
    if (!firebaseUser || !firebaseUser.email) return;

    try {
      // 1. Try to find company where this user is the OwnerEmail
      const compRef = collection(db, "companies");
      const ownerQuery = query(compRef, where("OwnerEmail", "==", firebaseUser.email));
      const ownerSnap = await getDocs(ownerQuery);

      if (!ownerSnap.empty) {
        const doc = ownerSnap.documents ? ownerSnap.documents[0] : ownerSnap.docs[0];
        setCompany(doc.data());
        setCompanyId(doc.id);
        return;
      }

      // 2. Try collectionGroup query for users to find any membership
      const usersRef = collectionGroup(db, "users");
      // Search by document ID (which is the uid) or Email
      const memberQuery = query(usersRef, where("Email", "==", firebaseUser.email), limit(1));
      const memberSnap = await getDocs(memberQuery);

      if (!memberSnap.empty) {
        const userDoc = memberSnap.docs[0];
        // The parent of userDoc is the 'users' collection, and its parent is the company doc
        const companyRef = userDoc.ref.parent.parent;
        if (companyRef) {
          const compSnap = await getDocs(query(compRef, where("CompanyId", "==", companyRef.id)));
          if (!compSnap.empty) {
            setCompany(compSnap.docs[0].data());
            setCompanyId(companyRef.id);
            return;
          }
        }
      }

      setError("No company registration found for this email address.");
    } catch (err) {
      console.error("Error fetching company details:", err);
      setError("Failed to verify business account details.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserCompany(currentUser);
      } else {
        setCompany(null);
        setCompanyId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      company, 
      companyId, 
      error, 
      signInWithEmail, 
      signInWithGoogle, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
