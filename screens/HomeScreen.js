import React, { useLayoutEffect, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth, realtimeDb } from '../firebase';
import { ref, onValue, off, get } from 'firebase/database';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SkeletonChat } from '../components/Skeleton';
import { scheduleFriendStatusNotification, scheduleLocalNotification } from '../notifications';
import * as Notifications from 'expo-notifications';

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
  const [onlineCount, setOnlineCount] = useState(0);
  const currentUid = auth.currentUser?.uid;
  const prevStatusRef = useRef({});
  const prevUnread = useRef({});

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity style={{ marginLeft: 16 }} onPress={() => navigation.toggleDrawer()}>
          <Icon name="menu" size={26} color="#f57c00" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
          {onlineCount > 0 && (
            <View style={styles.onlineCountBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineCountText}>{onlineCount}</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('Search')} style={{ marginLeft: onlineCount > 0 ? 12 : 0 }}>
            <Icon name="account-search" size={26} color="#f57c00" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, onlineCount]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    const appState = AppState.currentState;
    chatItems.forEach(item => {
      if (item.unreadCount > (prevUnread.current[item.id] || 0) && item.type === 'chat') {
        if (appState !== 'active') {
          if (Platform.OS !== 'web') {
            scheduleLocalNotification(item.name, `${item.unreadCount} new message${item.unreadCount > 1 ? 's' : ''}`, item.id, false);
          } else {
            try {
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification(item.name, { body: `${item.unreadCount} new message${item.unreadCount > 1 ? 's' : ''}` });
              }
            } catch (_) {}
          }
        }
      }
      prevUnread.current[item.id] = item.unreadCount || 0;
    });
  }, [chatItems]);

  useFocusEffect(useCallback(() => {
    if (!currentUid) return;
    setLoading(true);

    const chatlistRef = ref(realtimeDb, `Chatlist/${currentUid}`);
    const statusUnsubs = [];

    const onChatData = async (snapshot) => {
      const items = [];
      const friendUids = [];
      if (snapshot.exists()) {
        const promises = [];
        snapshot.forEach((childSnap) => {
          const otherUid = childSnap.key;
          const chatData = childSnap.val() || {};
          const unreadCount = chatData.unreadCount || 0;
          friendUids.push(otherUid);
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

      const CHAT_ROOM_NAMES = {
        room_general: 'General Chat', room_travel: 'Travel Lovers',
        room_food: 'Foodies', room_music: 'Music Fans', room_movies: 'Movie Buffs',
        room_sports: 'Sports Talk', room_tech: 'Technology', room_business: 'Business',
        room_culture: 'Culture', room_daily: 'Daily Life',
      };
      const groupsRef = ref(realtimeDb, 'Groups');
      const gSnap = await get(groupsRef);
      if (gSnap.exists()) {
        gSnap.forEach((childSnap) => {
          const d = childSnap.val();
          if (d.members && d.members[currentUid]) {
            items.push({ id: childSnap.key, name: d.name || CHAT_ROOM_NAMES[childSnap.key] || 'Group', sub: d.description || `${Object.keys(d.members || {}).length} members`, type: 'group' });
          }
        });
      }

      setChatItems([...items]);

      statusUnsubs.forEach(u => u());
      statusUnsubs.length = 0;

      let count = 0;
      items.forEach(item => {
        if (item.type === 'chat' && item.status === 'online') count++;
      });
      setOnlineCount(count);

      friendUids.forEach(uid => {
        const userStatusRef = ref(realtimeDb, `Users/${uid}/status`);
        const unsub = onValue(userStatusRef, (snap) => {
          const newStatus = snap.val() || 'offline';
          const prevStatus = prevStatusRef.current[uid];
          prevStatusRef.current[uid] = newStatus;

          if (prevStatus && prevStatus !== newStatus && newStatus === 'online') {
            if (Platform.OS !== 'web') {
              const friend = items.find(i => i.id === uid);
              if (friend) {
                scheduleFriendStatusNotification(friend.name, true);
              }
            }
          }

          setChatItems(prev => {
            let onlineC = 0;
            const updated = prev.map(item => {
              if (item.id === uid && item.type === 'chat') {
                const newItem = { ...item, status: newStatus };
                if (newStatus === 'online') onlineC++;
                return newItem;
              }
              if (item.type === 'chat' && item.status === 'online') onlineC++;
              return item;
            });
            setOnlineCount(onlineC);
            return updated;
          });
        });
        statusUnsubs.push(unsub);
      });

      setLoading(false);
    };

    onValue(chatlistRef, onChatData);
    return () => {
      off(chatlistRef, 'value', onChatData);
      statusUnsubs.forEach(u => u());
    };
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
        <SkeletonChat count={8} style={{ padding: 16 }} />
      ) : (
        <FlatList
          data={chatItems}
          keyExtractor={item => item.id + (item.type || '')}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={
            onlineCount > 0 ? (
              <View style={styles.onlineHeader}>
                <View style={styles.onlineHeaderDot} />
                <Text style={styles.onlineHeaderText}>{onlineCount} friend{onlineCount !== 1 ? 's' : ''} online</Text>
              </View>
            ) : null
          }
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
  onlineHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'rgba(76,175,80,0.1)', borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  onlineHeaderDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', marginRight: 8 },
  onlineHeaderText: { color: '#4CAF50', fontSize: 14, fontWeight: '600' },
  onlineCountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76,175,80,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, gap: 5 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  onlineCountText: { color: '#4CAF50', fontSize: 13, fontWeight: '700' },
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
