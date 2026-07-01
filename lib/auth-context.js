"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  collectionGroup, 
  limit 
} from "firebase/firestore";
import { db } from "./firebase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [error, setError] = useState(null);

  // On mount, check if a session is stored
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gc_session");
      if (saved) {
        const session = JSON.parse(saved);
        setUser(session.user);
        setCompany(session.company);
        setCompanyId(session.companyId);
      }
    } catch (e) {
      console.error("Failed to restore session:", e);
    }
    setLoading(false);
  }, []);

  const signInWithEmail = async (email) => {
    setError(null);
    setLoading(true);
    try {
      const emailLower = email.toLowerCase().trim();

      // 1. Try to find company where this user is the OwnerEmail
      const compRef = collection(db, "companies");
      const ownerQuery = query(compRef, where("OwnerEmail", "==", emailLower));
      let ownerSnap = await getDocs(ownerQuery);

      // Also try original casing
      if (ownerSnap.empty) {
        const ownerQuery2 = query(compRef, where("OwnerEmail", "==", email.trim()));
        ownerSnap = await getDocs(ownerQuery2);
      }

      if (!ownerSnap.empty) {
        const doc = ownerSnap.docs[0];
        const companyData = doc.data();
        const userData = { email: emailLower, role: "Owner", name: companyData.OwnerName || "Owner" };
        
        setUser(userData);
        setCompany(companyData);
        setCompanyId(doc.id);
        localStorage.setItem("gc_session", JSON.stringify({
          user: userData,
          company: companyData,
          companyId: doc.id
        }));
        setLoading(false);
        return;
      }

      // 2. Try collectionGroup query on users subcollection to find membership
      const usersRef = collectionGroup(db, "users");
      const memberQuery = query(usersRef, where("Email", "==", emailLower), limit(1));
      let memberSnap = await getDocs(memberQuery);

      // Also try original casing
      if (memberSnap.empty) {
        const memberQuery2 = query(usersRef, where("Email", "==", email.trim()), limit(1));
        memberSnap = await getDocs(memberQuery2);
      }

      if (!memberSnap.empty) {
        const userDoc = memberSnap.docs[0];
        const userData = userDoc.data();
        // The parent of userDoc is the 'users' collection, and its parent is the company doc
        const companyRef = userDoc.ref.parent.parent;
        if (companyRef) {
          const compSnap = await getDocs(query(compRef, where("CompanyId", "==", companyRef.id)));
          if (!compSnap.empty) {
            const companyData = compSnap.docs[0].data();
            const sessionUser = { 
              email: emailLower, 
              role: userData.Role || "Staff", 
              name: userData.FullName || userData.Username || "User" 
            };
            
            setUser(sessionUser);
            setCompany(companyData);
            setCompanyId(companyRef.id);
            localStorage.setItem("gc_session", JSON.stringify({
              user: sessionUser,
              company: companyData,
              companyId: companyRef.id
            }));
            setLoading(false);
            return;
          }
        }
      }

      // 3. Last resort: search all companies and check all users subcollections
      const allCompaniesSnap = await getDocs(compRef);
      for (const compDoc of allCompaniesSnap.docs) {
        const compData = compDoc.data();
        
        // Check if OwnerEmail matches (case insensitive)
        if (compData.OwnerEmail && compData.OwnerEmail.toLowerCase() === emailLower) {
          const userData = { email: emailLower, role: "Owner", name: compData.OwnerName || "Owner" };
          setUser(userData);
          setCompany(compData);
          setCompanyId(compDoc.id);
          localStorage.setItem("gc_session", JSON.stringify({
            user: userData,
            company: compData,
            companyId: compDoc.id
          }));
          setLoading(false);
          return;
        }

        // Check users subcollection
        const usersCol = collection(db, "companies", compDoc.id, "users");
        const usersSnap = await getDocs(usersCol);
        for (const uDoc of usersSnap.docs) {
          const uData = uDoc.data();
          if (uData.Email && uData.Email.toLowerCase() === emailLower) {
            const sessionUser = { 
              email: emailLower, 
              role: uData.Role || "Staff", 
              name: uData.FullName || uData.Username || "User" 
            };
            setUser(sessionUser);
            setCompany(compData);
            setCompanyId(compDoc.id);
            localStorage.setItem("gc_session", JSON.stringify({
              user: sessionUser,
              company: compData,
              companyId: compDoc.id
            }));
            setLoading(false);
            return;
          }
        }
      }

      setError("No company registration found for this email address. Make sure you have synced your desktop software at least once.");
      setLoading(false);
    } catch (err) {
      console.error("Error during sign-in:", err);
      setError("Failed to verify business account. Error: " + err.message);
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    setCompanyId(null);
    setError(null);
    localStorage.removeItem("gc_session");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      company, 
      companyId, 
      error, 
      signInWithEmail, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
