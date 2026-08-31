import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth, realtimeDb } from '../firebase';
import { ref, onValue, off, set, get } from 'firebase/database';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function AddMemberScreen({ route, navigation }) {
  const { groupId } = route.params || {};
  const [friends, setFriends] = useState([]);
  const [existingMembers, setExistingMembers] = useState({});
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUid || !groupId) return;

    const friendsRef = ref(realtimeDb, `Friends/${currentUid}`);
    const groupRef = ref(realtimeDb, `Groups/${groupId}`);

    const unsub1 = onValue(friendsRef, (snap) => {
      const list = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          const d = child.val();
          list.push({ id: child.key, ...d });
        });
      }
      setFriends(list);
    });

    const unsub2 = onValue(groupRef, (snap) => {
      if (snap.exists()) {
        const members = snap.val().members || {};
        setExistingMembers(members);
      }
      setLoading(false);
    });

    return () => { off(friendsRef); off(groupRef); };
  }, [currentUid, groupId]);

  const toggleSelect = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addMembers = async () => {
    const toAdd = Object.keys(selected).filter(k => selected[k]);
    if (toAdd.length === 0) {
      Alert.alert('Error', 'Select at least one member.');
      return;
    }
    try {
      const groupRef = ref(realtimeDb, `Groups/${groupId}/members`);
      const currentMembers = { ...existingMembers };
      toAdd.forEach(uid => { currentMembers[uid] = true; });
      const groupSnap = await get(ref(realtimeDb, `Groups/${groupId}`));
      const groupData = groupSnap.val() || {};
      await set(ref(realtimeDb, `Groups/${groupId}`), { ...groupData, members: currentMembers });
      Alert.alert('Success', 'Members added!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const isMember = (uid) => existingMembers[uid] || uid === currentUid;
  const availableFriends = friends.filter(f => !isMember(f.id));

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f57c00" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Friends to Add</Text>
      <FlatList
        data={availableFriends}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
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
        ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No available friends to add</Text>}
      />
      <TouchableOpacity style={styles.addBtn} onPress={addMembers} activeOpacity={0.8}>
        <Icon name="account-plus" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.addBtnText}>Add Members</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E', padding: 16 },
  center: { flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  memberItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C',
    padding: 14, borderRadius: 12, marginBottom: 8,
  },
  memberSelected: { borderWidth: 1, borderColor: '#f57c00' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#555', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxActive: { backgroundColor: '#f57c00', borderColor: '#f57c00' },
  memberName: { color: '#fff', fontSize: 15, fontWeight: '500' },
  addBtn: {
    flexDirection: 'row', backgroundColor: '#f57c00', height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 16,
    shadowColor: '#f57c00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
