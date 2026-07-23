import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth, realtimeDb } from '../firebase';
import { ref, onValue, off, set, push } from 'firebase/database';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function CreateGroupScreen({ navigation }) {
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUid) return;
    const friendsRef = ref(realtimeDb, `Friends/${currentUid}`);
    onValue(friendsRef, (snap) => {
      const list = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          const d = child.val();
          list.push({ id: child.key, ...d });
        });
      }
      setFriends(list);
      setLoading(false);
    });
    return () => off(friendsRef);
  }, [currentUid]);

  const toggleSelect = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }
    const memberIds = Object.keys(selected).filter(k => selected[k]);
    if (memberIds.length === 0) {
      Alert.alert('Error', 'Select at least one member.');
      return;
    }
    memberIds.push(currentUid);

    try {
      const groupRef = push(ref(realtimeDb, 'Groups'));
      const members = {};
      memberIds.forEach(uid => { members[uid] = true; });
      await set(groupRef, {
        name: groupName.trim(),
        createdBy: currentUid,
        createdAt: Date.now().toString(),
        members,
      });
      Alert.alert('Success', 'Group created!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f57c00" /></View>;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.nameInput}
        placeholder="Group name"
        placeholderTextColor="#888"
        value={groupName}
        onChangeText={setGroupName}
      />

      <Text style={styles.sectionTitle}>Select Members</Text>

      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isSel = selected[item.id];
          return (
            <TouchableOpacity style={[styles.memberItem, isSel && styles.memberSelected]} onPress={() => toggleSelect(item.id)}>
              <View style={[styles.checkbox, isSel && styles.checkboxActive]}>
                {isSel && <Icon name="check" size={16} color="#fff" />}
              </View>
              <Text style={styles.memberName}>{item.username || item.useremail}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No friends yet</Text>}
      />

      <TouchableOpacity style={styles.createBtn} onPress={createGroup} activeOpacity={0.8}>
        <Icon name="account-group" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.createBtnText}>Create Group</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E', padding: 16 },
  center: { flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' },
  nameInput: {
    backgroundColor: '#2C2C2C', height: 50, borderRadius: 14, paddingHorizontal: 16,
    fontSize: 16, color: '#fff', marginBottom: 20, borderWidth: 1, borderColor: '#3A3A3A',
  },
  sectionTitle: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  memberItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C',
    padding: 14, borderRadius: 12, marginBottom: 8,
  },
  memberSelected: { borderWidth: 1, borderColor: '#f57c00' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#555', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxActive: { backgroundColor: '#f57c00', borderColor: '#f57c00' },
  memberName: { color: '#fff', fontSize: 15, fontWeight: '500' },
  createBtn: {
    flexDirection: 'row', backgroundColor: '#f57c00', height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 16,
    shadowColor: '#f57c00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

