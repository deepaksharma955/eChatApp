import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { auth, realtimeDb } from '../firebase';
import { ref, get, set } from 'firebase/database';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function JoinGroupScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const currentUid = auth.currentUser?.uid;

  const joinGroup = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter an invite code.');
      return;
    }
    setLoading(true);
    try {
      const groupsSnap = await get(ref(realtimeDb, 'Groups'));
      let foundGroup = null;
      let foundKey = null;
      if (groupsSnap.exists()) {
        groupsSnap.forEach((child) => {
          const d = child.val();
          if (d.inviteCode === trimmed) {
            foundGroup = d;
            foundKey = child.key;
          }
        });
      }
      if (!foundGroup || !foundKey) {
        Alert.alert('Not Found', 'No group found with that invite code.');
        setLoading(false);
        return;
      }
      if (foundGroup.members && foundGroup.members[currentUid]) {
        Alert.alert('Already Member', 'You are already in this group.');
        setLoading(false);
        return;
      }
      const updatedMembers = { ...(foundGroup.members || {}), [currentUid]: true };
      await set(ref(realtimeDb, `Groups/${foundKey}/members`), updatedMembers);
      Alert.alert('Joined!', `You joined "${foundGroup.name || 'Group'}"`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Icon name="link-variant" size={50} color="#f57c00" />
        </View>
        <Text style={styles.title}>Join Group</Text>
        <Text style={styles.subtitle}>Enter the invite code shared by the group admin</Text>
        <TextInput
          style={styles.codeInput}
          placeholder="Enter invite code"
          placeholderTextColor="#888"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
        />
        <TouchableOpacity style={styles.joinBtn} onPress={joinGroup} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="account-group" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.joinBtnText}>Join Group</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2C2C2C', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
  codeInput: {
    backgroundColor: '#2C2C2C', height: 54, borderRadius: 14, paddingHorizontal: 20,
    fontSize: 22, color: '#fff', textAlign: 'center', letterSpacing: 4,
    borderWidth: 1, borderColor: '#3A3A3A', width: '100%', marginBottom: 24,
  },
  joinBtn: {
    flexDirection: 'row', backgroundColor: '#f57c00', height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, width: '100%',
    shadowColor: '#f57c00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
