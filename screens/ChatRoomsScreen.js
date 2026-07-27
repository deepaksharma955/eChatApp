import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { auth, realtimeDb } from '../firebase';
import { ref, get, update } from 'firebase/database';

const TOPICS = [
  { id: 'general', label: 'General', icon: 'chat', color: '#4CAF50' },
  { id: 'travel', label: 'Travel', icon: 'airplane', color: '#2196F3' },
  { id: 'food', label: 'Food & Cooking', icon: 'food', color: '#FF9800' },
  { id: 'music', label: 'Music', icon: 'music', color: '#E91E63' },
  { id: 'movies', label: 'Movies & TV', icon: 'movie', color: '#9C27B0' },
  { id: 'sports', label: 'Sports', icon: 'basketball', color: '#FF5722' },
  { id: 'tech', label: 'Technology', icon: 'laptop', color: '#00BCD4' },
  { id: 'business', label: 'Business', icon: 'briefcase', color: '#3F51B5' },
  { id: 'culture', label: 'Culture', icon: 'earth', color: '#009688' },
  { id: 'daily', label: 'Daily Life', icon: 'calendar', color: '#795548' },
];

export default function ChatRoomsScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [joinedRooms, setJoinedRooms] = useState([]);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    setLoading(true);
    const groupsRef = ref(realtimeDb, 'Groups');
    get(groupsRef).then(snap => {
      const items = [];
      if (snap.exists()) {
        snap.forEach(child => {
          const d = child.val();
          if (d.isChatRoom) {
            items.push({ id: child.key, ...d });
          }
        });
      }
      if (items.length === 0) {
        items.push(
          { id: 'room_general', name: 'General Chat', topic: 'general', memberCount: 0, description: 'Welcome! Talk about anything.', isChatRoom: true },
          { id: 'room_travel', name: 'Travel Lovers', topic: 'travel', memberCount: 0, description: 'Share travel experiences.', isChatRoom: true },
          { id: 'room_food', name: 'Foodies', topic: 'food', memberCount: 0, description: 'All about food and cooking.', isChatRoom: true },
          { id: 'room_music', name: 'Music Fans', topic: 'music', memberCount: 0, description: 'Discuss your favorite music.', isChatRoom: true },
          { id: 'room_movies', name: 'Movie Buffs', topic: 'movies', memberCount: 0, description: 'Talk about films and series.', isChatRoom: true },
          { id: 'room_sports', name: 'Sports Talk', topic: 'sports', memberCount: 0, description: 'All sports discussions.', isChatRoom: true },
        );
      }
      setRooms(items);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!currentUid) return;
    get(ref(realtimeDb, `Users/${currentUid}/joinedRooms`)).then(snap => {
      if (snap.exists()) setJoinedRooms(Object.keys(snap.val()));
    });
  }, [currentUid]);

  const joinRoom = async (room) => {
    if (!currentUid) return;
    const membersRef = ref(realtimeDb, `Groups/${room.id}/members`);
    const snap = await get(membersRef);
    const members = snap.exists() ? snap.val() : {};
    if (!members[currentUid]) {
      members[currentUid] = true;
      await update(ref(realtimeDb, `Groups/${room.id}`), { members });
      await update(ref(realtimeDb, `Users/${currentUid}/joinedRooms/${room.id}`), { name: room.name, joinedAt: Date.now() });
      setJoinedRooms(prev => [...prev, room.id]);
    }
    navigation.navigate('GroupChat', { groupId: room.id });
  };

  const filteredRooms = selectedTopic ? rooms.filter(r => r.topic === selectedTopic) : rooms;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Choose your interest</Text>
      <FlatList
        horizontal
        data={TOPICS}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.topicsRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.topicChip, selectedTopic === item.id && { backgroundColor: item.color + '30', borderColor: item.color }]}
            onPress={() => setSelectedTopic(selectedTopic === item.id ? null : item.id)}
          >
            <Icon name={item.icon} size={16} color={selectedTopic === item.id ? item.color : '#aaa'} />
            <Text style={[styles.topicChipText, selectedTopic === item.id && { color: item.color }]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#f57c00" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.roomList}
          ListEmptyComponent={<Text style={styles.emptyText}>No rooms for this topic</Text>}
          renderItem={({ item }) => {
            const topic = TOPICS.find(t => t.id === item.topic);
            const isJoined = joinedRooms.includes(item.id);
            return (
              <TouchableOpacity style={styles.roomCard} onPress={() => joinRoom(item)} activeOpacity={0.7}>
                <View style={[styles.roomIcon, { backgroundColor: (topic?.color || '#f57c00') + '20' }]}>
                  <Icon name={topic?.icon || 'chat'} size={24} color={topic?.color || '#f57c00'} />
                </View>
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{item.name}</Text>
                  <Text style={styles.roomDesc}>{item.description}</Text>
                  <Text style={styles.roomMeta}>{item.memberCount || 0} members {isJoined ? '· Joined' : ''}</Text>
                </View>
                <Icon name={isJoined ? 'check-circle' : 'chevron-right'} size={20} color={isJoined ? '#4CAF50' : '#555'} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  heading: { color: '#fff', fontSize: 20, fontWeight: '700', padding: 16, paddingBottom: 8 },
  topicsRow: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  topicChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#3A3A3A', gap: 6 },
  topicChipText: { color: '#aaa', fontSize: 13, fontWeight: '500' },
  roomList: { padding: 16, paddingTop: 4 },
  roomCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#3A3A3A' },
  roomIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  roomInfo: { flex: 1 },
  roomName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 3 },
  roomDesc: { color: '#888', fontSize: 13, marginBottom: 3 },
  roomMeta: { color: '#666', fontSize: 12 },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 40 },
});
