import { useState, useEffect, useMemo } from 'react';
import * as Application from 'expo-application';
import * as WebBrowser from 'expo-web-browser';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, realtimeDb } from '../firebase';
import { GOOGLE_AUTH } from '../googleAuth';

WebBrowser.maybeCompleteAuthSession();

export const isGoogleAuthConfigured = !!(
  GOOGLE_AUTH.clientId || GOOGLE_AUTH.webClientId || GOOGLE_AUTH.androidClientId || GOOGLE_AUTH.iosClientId
);

export function useGoogleAuth() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clientConfig = useMemo(() => {
    const config = {};
    if (GOOGLE_AUTH.clientId) config.clientId = GOOGLE_AUTH.clientId;
    if (GOOGLE_AUTH.webClientId) config.webClientId = GOOGLE_AUTH.webClientId;
    if (GOOGLE_AUTH.androidClientId) config.androidClientId = GOOGLE_AUTH.androidClientId;
    if (GOOGLE_AUTH.iosClientId) config.iosClientId = GOOGLE_AUTH.iosClientId;
    return config;
  }, []);

  const [request, response, promptAsync] = useIdTokenAuthRequest(
    {
      ...clientConfig,
      scopes: ['profile', 'email'],
      selectAccount: true,
    },
    { native: `${Application.applicationId}:/oauthredirect` }
  );

  useEffect(() => {
    if (response?.type === 'success') {
      setLoading(true);
      setError('');
      const idToken = response.authentication?.idToken || response.params?.id_token;
      const accessToken = response.authentication?.accessToken || response.params?.access_token;
      if (!idToken) {
        setLoading(false);
        setError('Google sign-in did not return an ID token.');
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      signInWithCredential(auth, credential)
        .then(async (userCred) => {
          const user = userCred.user;
          const uid = user.uid;
          const existing = await get(ref(realtimeDb, `Users/${uid}`)).catch(() => null);
          if (!existing || !existing.exists()) {
            const name = user.displayName || (user.email || 'User').split('@')[0];
            await set(ref(realtimeDb, `Users/${uid}`), {
              id: uid,
              useremail: user.email || '',
              username: name,
              search: name.toLowerCase(),
              status: 'online',
              bio: '',
              imageURL: user.photoURL || 'default',
              country: '',
              age: '',
              gender: '',
              englishLevel: '',
              interests: '',
              profileImage: user.photoURL || '',
              provider: 'google',
              disclaimerAccepted: true,
              disclaimerAcceptedAt: Date.now(),
            });
          }
        })
        .catch((err) => setError(err.message || 'Google sign-in failed.'))
        .finally(() => setLoading(false));
    } else if (response?.type === 'error') {
      setError(response.error?.message || 'Google sign-in failed.');
    }
  }, [response]);

  const signInWithGoogle = async () => {
    setError('');
    if (!request) {
      setError('Google sign-in is not ready yet. Please try again.');
      return;
    }
    const result = await promptAsync();
    if (result?.type === 'dismiss' || result?.type === 'cancel') {
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading, error, request, configured: Object.keys(clientConfig).length > 0 };
}
