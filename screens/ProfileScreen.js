import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { auth, realtimeDb } from '../firebase';
import { ref, onValue, off, update } from 'firebase/database';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const currentUid = auth.currentUser?.uid;
  const email = auth.currentUser?.email || '';

  useEffect(() => {
    if (!currentUid) return;
    const userRef = ref(realtimeDb, `Users/${currentUid}`);
    const handleData = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUsername(data.username || '');
        setBio(data.bio || '');
      }
      setLoading(false);
    };
    onValue(userRef, handleData, () => setLoading(false));
    return () => off(userRef, 'value', handleData);
  }, [currentUid]);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await update(ref(realtimeDb, `Users/${currentUid}`), {
        username: username.trim(),
        search: username.trim().toLowerCase(),
        bio: bio.trim(),
      });
      Alert.alert('Success', 'Profile updated.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f57c00" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Icon name="account" size={50} color="#fff" />
        </View>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Username</Text>
        <View style={styles.inputContainer}>
          <Icon name="account-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Your username"
            placeholderTextColor="#888"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Bio</Text>
        <View style={styles.inputContainer}>
          <Icon name="card-text-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell something about yourself"
            placeholderTextColor="#888"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputContainer}>
          <Icon name="email-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: '#666' }]}
            value={email}
            editable={false}
          />
        </View>
        <Text style={styles.hint}>Email cannot be changed</Text>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon name="check" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f57c00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  email: {
    color: '#888',
    fontSize: 14,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2C2C2C',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  inputIcon: {
    marginTop: 14,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    height: 48,
  },
  bioInput: {
    height: 80,
    paddingTop: 14,
    paddingBottom: 14,
  },
  hint: {
    color: '#666',
    fontSize: 11,
    marginTop: 6,
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#f57c00',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#f57c00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontWeight: '700',
    color: '#fff',
    fontSize: 16,
  },
});

