import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
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

  const DEFAULT_ROOMS = [
    { id: 'room_general', name: 'General Chat', topic: 'general', description: 'Welcome! Talk about anything.', isChatRoom: true },
    { id: 'room_travel', name: 'Travel Lovers', topic: 'travel', description: 'Share travel experiences.', isChatRoom: true },
    { id: 'room_food', name: 'Foodies', topic: 'food', description: 'All about food and cooking.', isChatRoom: true },
    { id: 'room_music', name: 'Music Fans', topic: 'music', description: 'Discuss your favorite music.', isChatRoom: true },
    { id: 'room_movies', name: 'Movie Buffs', topic: 'movies', description: 'Talk about films and series.', isChatRoom: true },
    { id: 'room_sports', name: 'Sports Talk', topic: 'sports', description: 'All sports discussions.', isChatRoom: true },
    { id: 'room_tech', name: 'Technology', topic: 'tech', description: 'Latest in tech and gadgets.', isChatRoom: true },
    { id: 'room_business', name: 'Business', topic: 'business', description: 'Business news and discussion.', isChatRoom: true },
    { id: 'room_culture', name: 'Culture', topic: 'culture', description: 'Art, culture, and society.', isChatRoom: true },
    { id: 'room_daily', name: 'Daily Life', topic: 'daily', description: 'Everyday life conversations.', isChatRoom: true },
  ];

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
      const merged = [...DEFAULT_ROOMS];
      items.forEach(fbItem => {
        const idx = merged.findIndex(r => r.id === fbItem.id);
        if (idx >= 0) merged[idx] = fbItem;
        else merged.push(fbItem);
      });
      setRooms(merged);
      setLoading(false);
    }).catch(() => {
      setRooms(DEFAULT_ROOMS);
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
    const groupRef = ref(realtimeDb, `Groups/${room.id}`);
    const snap = await get(groupRef);
    const existingData = snap.exists() ? snap.val() : {};
    const members = existingData.members || {};
    if (!members[currentUid]) {
      members[currentUid] = true;
      await update(groupRef, {
        members,
        name: existingData.name || room.name,
        description: existingData.description || room.description,
        topic: existingData.topic || room.topic,
        isChatRoom: true,
      });
      await update(ref(realtimeDb, `Users/${currentUid}/joinedRooms/${room.id}`), { name: room.name, joinedAt: Date.now() });
      setJoinedRooms(prev => [...prev, room.id]);
    } else if (!existingData.name) {
      await update(groupRef, { name: room.name, description: existingData.description || room.description, topic: existingData.topic || room.topic, isChatRoom: true });
    }
    navigation.navigate('GroupChat', { groupId: room.id });
  };

  const filteredRooms = selectedTopic ? rooms.filter(r => r.topic === selectedTopic) : rooms;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Choose your interest</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsScroller} contentContainerStyle={styles.topicsRow}>
        {TOPICS.map(item => (
          <TouchableOpacity key={item.id} style={[styles.topicBtn, selectedTopic === item.id && { backgroundColor: item.color + '30', borderColor: item.color }]} onPress={() => setSelectedTopic(selectedTopic === item.id ? null : item.id)}>
            <Text style={[styles.topicBtnText, selectedTopic === item.id && { color: item.color }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#f57c00" style={{ marginTop: 10 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.roomList} showsVerticalScrollIndicator={false}>
          {filteredRooms.length === 0 ? (
            <Text style={styles.emptyText}>No rooms for this topic</Text>
          ) : filteredRooms.map(item => {
            const topic = TOPICS.find(t => t.id === item.topic);
            const isJoined = joinedRooms.includes(item.id);
            const memberCount = item.members ? Object.keys(item.members).length : (item.memberCount || 0);
            return (
              <TouchableOpacity key={item.id} style={[styles.roomCard, isJoined && { backgroundColor: (topic?.color || '#f57c00') + '20', borderColor: topic?.color || '#f57c00' }]} onPress={() => joinRoom(item)} activeOpacity={0.7}>
                <Icon name={topic?.icon || 'chat'} size={14} color={topic?.color || '#f57c00'} />
                <Text style={styles.roomName}>{item.name}</Text>
                <View style={{ flex: 1 }} />
                {memberCount > 0 ? (
                  <View style={styles.roomMetaWrap}>
                    <Icon name="account-group" size={12} color="#666" />
                    <Text style={styles.roomMeta}>{memberCount}</Text>
                  </View>
                ) : null}
                <Icon name={isJoined ? 'check-circle' : 'chevron-right'} size={16} color={isJoined ? '#4CAF50' : '#555'} style={styles.roomChevron} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  heading: { color: '#fff', fontSize: 20, fontWeight: '700', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0 },
  topicsScroller: { flexGrow: 0 },
  topicsRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 4, gap: 8 },
  topicBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#3A3A3A', backgroundColor: '#2C2C2C' },
  topicBtnText: { color: '#aaa', fontSize: 12, fontWeight: '500' },
  roomList: { flexDirection: 'column', paddingHorizontal: 12, paddingTop: 0, paddingBottom: 40, gap: 6 },
  roomCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3A3A3A', gap: 8, marginBottom: 4 },
  roomIconWrap: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  roomName: { color: '#fff', fontSize: 13, fontWeight: '500' },
  roomMetaWrap: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  roomMeta: { color: '#666', fontSize: 11, marginLeft: 2 },
  roomChevron: { marginLeft: 2 },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 40 },
});
