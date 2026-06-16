import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "./client";

export type AuthUser = User;

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const cred = await signInWithEmailAndPassword(auth(), email.trim(), password);
  return cred.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth());
}

export function onAuth(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth(), callback);
}
