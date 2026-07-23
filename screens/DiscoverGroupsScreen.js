import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth, realtimeDb } from '../firebase';
import { ref, onValue, off, set, get } from 'firebase/database';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function DiscoverGroupsScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUid) return;
    const groupsRef = ref(realtimeDb, 'Groups');
    onValue(groupsRef, (snap) => {
      const list = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          const d = child.val();
          const isMember = d.members && d.members[currentUid];
          list.push({
            id: child.key,
            name: d.name || 'Unnamed',
            memberCount: d.members ? Object.keys(d.members).length : 0,
            createdBy: d.createdBy || '',
            isMember: !!isMember,
            inviteCode: d.inviteCode || '',
          });
        });
      }
      setAllGroups(list);
      setLoading(false);
    });
    return () => off(groupsRef);
  }, [currentUid]);

  const joinGroup = async (group) => {
    try {
      const updatedMembers = {};
      const groupSnap = await get(ref(realtimeDb, `Groups/${group.id}`));
      const groupData = groupSnap.val() || {};
      const existingMembers = groupData.members || {};
      Object.keys(existingMembers).forEach(k => { updatedMembers[k] = true; });
      updatedMembers[currentUid] = true;
      await set(ref(realtimeDb, `Groups/${group.id}/members`), updatedMembers);
      Alert.alert('Joined!', `You joined "${group.name}"`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const filtered = searchText.trim()
    ? allGroups.filter(g => g.name.toLowerCase().includes(searchText.toLowerCase()))
    : allGroups;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f57c00" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={22} color="#888" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Icon name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        ) : null}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.groupCard}>
            <View style={styles.groupIcon}>
              <Icon name="account-group" size={28} color="#f57c00" />
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.groupMeta}>{item.memberCount} member{item.memberCount !== 1 ? 's' : ''}</Text>
              {item.isMember && <Text style={styles.memberBadge}>You are a member</Text>}
            </View>
            {!item.isMember ? (
              <TouchableOpacity style={styles.joinBtn} onPress={() => joinGroup(item)}>
                <Icon name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.openBtn} onPress={() => navigation.navigate('GroupChat', { groupId: item.id })}>
                <Icon name="chat" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="account-search-outline" size={50} color="#555" />
            <Text style={styles.emptyText}>No groups found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  center: { flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C',
    margin: 16, borderRadius: 14, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: '#3A3A3A',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#fff', height: '100%' },
  groupCard: {
    flexDirection: 'row', backgroundColor: '#2C2C2C', padding: 14,
    borderRadius: 14, alignItems: 'center', marginBottom: 10,
  },
  groupIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3A3A3A', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupInfo: { flex: 1 },
  groupName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  groupMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  memberBadge: { color: '#4CAF50', fontSize: 11, marginTop: 2 },
  joinBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f57c00', justifyContent: 'center', alignItems: 'center' },
  openBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 12 },
});
