import React, { useLayoutEffect, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth, realtimeDb } from '../firebase';
import { ref, onValue, off, get } from 'firebase/database';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const AVATAR_COLORS = ['#f57c00', '#e91e63', '#9c27b0', '#3f51b5', '#009688', '#4caf50', '#ff5722', '#795348'];

function formatLastSeen(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - parseInt(timestamp);
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(parseInt(timestamp)).toLocaleDateString();
}

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function HomeScreen({ navigation }) {
  const [chatItems, setChatItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUid = auth.currentUser?.uid;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity style={{ marginLeft: 16 }} onPress={() => navigation.toggleDrawer()}>
          <Icon name="menu" size={26} color="#f57c00" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 16 }} onPress={() => navigation.navigate('Search')}>
          <Icon name="account-search" size={26} color="#f57c00" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const prevUnread = useRef({});

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    chatItems.forEach(item => {
      if (item.unreadCount > (prevUnread.current[item.id] || 0) && item.type === 'chat') {
        try {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(item.name, { body: `${item.unreadCount} new message${item.unreadCount > 1 ? 's' : ''}` });
          }
        } catch (_) {}
      }
      prevUnread.current[item.id] = item.unreadCount || 0;
    });
  }, [chatItems]);

  useFocusEffect(useCallback(() => {
    if (!currentUid) return;
    setLoading(true);

    const chatlistRef = ref(realtimeDb, `Chatlist/${currentUid}`);
    const onChatData = async (snapshot) => {
      const items = [];
      if (snapshot.exists()) {
        const promises = [];
        snapshot.forEach((childSnap) => {
          const otherUid = childSnap.key;
          const chatData = childSnap.val() || {};
          const unreadCount = chatData.unreadCount || 0;
          const p = get(ref(realtimeDb, `Users/${otherUid}`)).then(us => {
            if (us.exists()) {
              const d = us.val();
              items.push({ id: otherUid, name: d.username || 'Unknown', sub: d.useremail || '', status: d.status || 'offline', lastSeen: d.lastSeen || '', country: d.country || '', unreadCount, type: 'chat' });
            }
          });
          promises.push(p);
        });
        await Promise.all(promises);
      }

      const groupsRef = ref(realtimeDb, 'Groups');
      const gSnap = await get(groupsRef);
      if (gSnap.exists()) {
        gSnap.forEach((childSnap) => {
          const d = childSnap.val();
          if (d.members && d.members[currentUid]) {
            items.push({ id: childSnap.key, name: d.name || 'Group', sub: 'Group', type: 'group' });
          }
        });
      }

      setChatItems([...items]);
      setLoading(false);
    };

    onValue(chatlistRef, onChatData);
    return () => off(chatlistRef, 'value', onChatData);
  }, [currentUid]));

  const onPress = (item) => {
    if (item.type === 'group') {
      navigation.navigate('GroupChat', { groupId: item.id });
    } else {
      navigation.navigate('Chat', { roomId: item.id, roomName: item.name });
    }
  };

  const renderItem = ({ item }) => {
    const isGroup = item.type === 'group';
    const unread = item.unreadCount || 0;
    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => onPress(item)} activeOpacity={0.7}>
        <View style={[styles.avatar, { backgroundColor: isGroup ? '#9c27b0' : getAvatarColor(item.name) }]}>
          {isGroup ? (
            <Icon name="account-group" size={22} color="#fff" />
          ) : (
            <>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              <View style={[styles.statusDot, { backgroundColor: item.status === 'online' ? '#4CAF50' : '#555' }]} />
            </>
          )}
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatPreview}>
            {item.status === 'online' ? 'Online' : item.lastSeen ? `Last seen ${formatLastSeen(item.lastSeen)}` : item.sub}
          </Text>
        </View>
        {unread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
          </View>
        ) : null}
        <Icon name="chevron-right" size={20} color="#555" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f57c00" />
        </View>
      ) : (
        <FlatList
          data={chatItems}
          keyExtractor={item => item.id + (item.type || '')}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Icon name="chat-sleep-outline" size={50} color="#555" />
              </View>
              <Text style={styles.emptyText}>No chats yet</Text>
              <Text style={styles.emptySubText}>Tap the search icon to find people</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2C', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginRight: 14, position: 'relative' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  statusDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#1E1E1E', position: 'absolute', bottom: -2, right: -2 },
  chatInfo: { flex: 1 },
  chatName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 3 },
  chatPreview: { color: '#888', fontSize: 13 },
  badge: {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#f57c00',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginRight: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 120 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#2C2C2C', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  emptySubText: { color: '#888', fontSize: 14, marginTop: 8 },
});
