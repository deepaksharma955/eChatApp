import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const showAlert = (title, msg) => {
  try { Alert.alert(title, msg); } catch (_) {}
  try { window.alert(`${title}\n${msg}`); } catch (_) {}
};

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={26} color="#f57c00" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Icon name="lock-reset" size={50} color="#f57c00" />
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {sent ? 'Check your email for the reset link.' : 'Enter your email and we\'ll send you a reset link.'}
        </Text>
      </View>

      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={18} color="#fff" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {sent ? (
        <View style={styles.successContainer}>
          <Icon name="check-circle" size={60} color="#4CAF50" />
          <Text style={styles.successText}>Email Sent</Text>
          <Text style={styles.successSubtext}>Password reset link has been sent to {email}</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
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

          <TouchableOpacity style={styles.button} onPress={handleReset} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Send Reset Link</Text>
          </TouchableOpacity>
        </>
      )}
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtext: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 20,
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
});
