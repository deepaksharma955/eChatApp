import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useGoogleAuth, isGoogleAuthConfigured } from '../utils/useGoogleAuth';

function GoogleSignInButton({ onNavigate }) {
  const { signInWithGoogle, loading: googleLoading, error: googleError, request } = useGoogleAuth();
  const [errorMsg, setErrorMsg] = useState('');

  const onGoogleLogin = () => {
    setErrorMsg('');
    if (!request) {
      setErrorMsg('Google sign-in is not configured yet.');
      return;
    }
    signInWithGoogle();
  };

  return (
    <>
      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={18} color="#fff" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : googleError ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={18} color="#fff" />
          <Text style={styles.errorText}>{googleError}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.googleButton} onPress={onGoogleLogin} activeOpacity={0.8} disabled={googleLoading}>
        {googleLoading ? (
          <ActivityIndicator size="small" color="#1E1E1E" />
        ) : (
          <Icon name="google" size={22} color="#1E1E1E" />
        )}
        <Text style={styles.googleButtonText}>{googleLoading ? 'Signing in...' : 'Continue with Google'}</Text>
      </TouchableOpacity>
    </>
  );
}

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onHandleLogin = () => {
    setErrorMsg('');
    if (email !== '' && password !== '') {
      signInWithEmailAndPassword(auth, email, password)
        .then(() => console.log('Login success'))
        .catch((err) => setErrorMsg(err.message));
    } else {
      setErrorMsg('Please enter email and password.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Image source={require('../assets/ediscusslogo.png')} style={{ width: 80, height: 80, marginBottom: 8 }} resizeMode="contain" />
        <Text style={styles.appName}>eDiscuss</Text>
      </View>

      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={18} color="#fff" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <View style={styles.inputContainer}>
        <Icon name="email-outline" size={22} color="#888" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={text => setEmail(text)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock-outline" size={22} color="#888" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={!showPassword}
          textContentType="password"
          value={password}
          onChangeText={text => setPassword(text)}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
          <Icon name={showPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotRow}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onHandleLogin} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      {isGoogleAuthConfigured && (
        <>
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>
          <GoogleSignInButton />
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.footerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f57c00',
    marginTop: 8,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: '#ff5252',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    height: 54,
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  eyeButton: {
    padding: 4,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    color: '#f57c00',
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#f57c00',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#f57c00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontWeight: '700',
    color: '#fff',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3A3A3A',
  },
  orText: {
    color: '#888',
    fontSize: 13,
    marginHorizontal: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    height: 54,
    borderRadius: 14,
  },
  googleButtonText: {
    color: '#1E1E1E',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  footerLink: {
    color: '#f57c00',
    fontWeight: '700',
    fontSize: 14,
  },
});
