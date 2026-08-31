import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth, realtimeDb } from '../firebase';
import { ref, onValue, off, set, get, child } from 'firebase/database';
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

export default function SearchScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [friends, setFriends] = useState({});
  const [sentRequests, setSentRequests] = useState({});
  const [incomingRequests, setIncomingRequests] = useState({});
  const [loading, setLoading] = useState(true);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUid) return;

    const loadData = () => {
      const usersRef = ref(realtimeDb, 'Users');
      const friendsRef = ref(realtimeDb, `Friends/${currentUid}`);
      const sentRef = ref(realtimeDb, `FriendRequests/${currentUid}`);
      const inRef = ref(realtimeDb, `FriendRequests`);

      onValue(usersRef, (snap) => {
        const users = [];
        snap.forEach((child) => {
          const d = child.val();
          if (d.id !== currentUid) users.push({ id: child.key, ...d });
        });
        setAllUsers(users);
        setLoading(false);
      });

      onValue(friendsRef, (snap) => {
        const f = {};
        if (snap.exists()) snap.forEach((c) => { f[c.key] = true; });
        setFriends(f);
      });

      onValue(sentRef, (snap) => {
        const s = {};
        if (snap.exists()) snap.forEach((c) => { s[c.key] = c.val().status; });
        setSentRequests(s);
      });

      onValue(inRef, (snap) => {
        const inc = {};
        if (snap.exists()) {
          snap.forEach((senderChild) => {
            const senderUid = senderChild.key;
            senderChild.forEach((req) => {
              if (req.val().to === currentUid && req.val().status === 'pending') {
                inc[senderUid] = req.val().status;
              }
            });
          });
        }
        setIncomingRequests(inc);
      });

      return () => {
        off(usersRef);
        off(friendsRef);
        off(sentRef);
        off(inRef);
      };
    };

    const cleanup = loadData();
    return cleanup;
  }, [currentUid]);

  const sendFriendRequest = async (otherUid) => {
    try {
      const reqRef = ref(realtimeDb, `FriendRequests/${currentUid}/${otherUid}`);
      await set(reqRef, {
        from: currentUid,
        to: otherUid,
        status: 'pending',
        timestamp: Date.now().toString(),
      });
      Alert.alert('Request Sent', 'Friend request has been sent.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const showMsg = (title, msg) => {
    try { Alert.alert(title, msg); } catch (_) {}
    try { window.alert(`${title}: ${msg}`); } catch (_) {}
  };

  const acceptRequest = async (otherUid) => {
    try {
      const otherUser = allUsers.find(u => u.id === otherUid);
      const currentUserSnap = await get(child(ref(realtimeDb), `Users/${currentUid}`));
      const currentData = currentUserSnap.val() || {};

      await set(ref(realtimeDb, `Friends/${currentUid}/${otherUid}`), { id: otherUid, username: otherUser?.username || '', useremail: otherUser?.useremail || '' });
      await set(ref(realtimeDb, `Friends/${otherUid}/${currentUid}`), { id: currentUid, username: currentData.username || '', useremail: currentData.useremail || '' });
      await set(ref(realtimeDb, `FriendRequests/${otherUid}/${currentUid}`), null);
      setIncomingRequests(prev => { const n = { ...prev }; delete n[otherUid]; return n; });
      showMsg('Accepted', 'You are now friends.');
    } catch (err) {
      showMsg('Error', (err && err.message) || 'Accept failed');
    }
  };

  const rejectRequest = async (otherUid) => {
    try {
      await set(ref(realtimeDb, `FriendRequests/${otherUid}/${currentUid}`), null);
      setIncomingRequests(prev => { const n = { ...prev }; delete n[otherUid]; return n; });
      showMsg('Rejected', 'Friend request rejected.');
    } catch (err) {
      showMsg('Error', err.message || 'Reject failed');
    }
  };

  const removeFriend = async (otherUid) => {
    const confirmed = window.confirm ? window.confirm('Remove friend?') : true;
    if (!confirmed) return;
    try {
      await set(ref(realtimeDb, `Friends/${currentUid}/${otherUid}`), null);
      await set(ref(realtimeDb, `Friends/${otherUid}/${currentUid}`), null);
      setFriends(prev => { const n = { ...prev }; delete n[otherUid]; return n; });
    } catch (err) {
      showMsg('Error', err.message || 'Remove failed');
    }
  };

  const startChat = (otherUid) => {
    if (!friends[otherUid]) {
      showMsg('Not Friends', 'Add as friend first to start chatting.');
      return;
    }
    const user = allUsers.find(u => u.id === otherUid);
    const roomName = user?.username || user?.useremail || otherUid;
    navigation.navigate('Chat', { roomId: otherUid, roomName });
  };

  const filteredUsers = searchText.trim()
    ? allUsers.filter(u => {
        const email = (u.useremail || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const term = searchText.toLowerCase();
        return email.includes(term) || username.includes(term);
      })
    : allUsers;

  const renderItem = ({ item }) => {
    const isFriend = friends[item.id];
    const hasSentRequest = sentRequests[item.id] === 'pending';
    const hasIncoming = incomingRequests[item.id] === 'pending';

    return (
      <View style={styles.userItem}>
        <TouchableOpacity
          style={styles.userInfoTouch}
          onPress={() => {
            if (isFriend) startChat(item.id);
            else if (hasIncoming) acceptRequest(item.id);
            else if (!hasSentRequest) sendFriendRequest(item.id);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.username || item.useremail) }]}>
            <Text style={styles.avatarText}>{(item.username || item.useremail || '?').charAt(0).toUpperCase()}</Text>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'online' ? '#4CAF50' : '#555' }]} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.username || 'Unknown'}</Text>
            <Text style={styles.userEmail}>
              {item.status === 'online' ? 'Online' : item.lastSeen ? `Last seen ${formatLastSeen(item.lastSeen)}` : item.country || item.useremail || ''}
            </Text>
          </View>
        </TouchableOpacity>

        {isFriend ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => startChat(item.id)}>
              <Icon name="chat" size={20} color="#f57c00" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => removeFriend(item.id)}>
              <Icon name="account-remove" size={20} color="#ff5252" />
            </TouchableOpacity>
          </View>
        ) : hasIncoming ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.smallBtnGreen} onPress={() => acceptRequest(item.id)}>
              <Icon name="check" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallBtnRed} onPress={() => rejectRequest(item.id)}>
              <Icon name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : hasSentRequest ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={() => sendFriendRequest(item.id)}>
            <Icon name="account-plus" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f57c00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={22} color="#888" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Icon name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.countText}>{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</Text>

      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Icon name="account-search-outline" size={50} color="#555" />
            </View>
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubText}>Try a different name or email</Text>
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
  countText: { color: '#888', fontSize: 12, paddingHorizontal: 20, marginBottom: 4 },
  userItem: {
    flexDirection: 'row', backgroundColor: '#2C2C2C', padding: 12,
    borderRadius: 14, alignItems: 'center', marginBottom: 10,
  },
  userInfoTouch: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  statusDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2.5, borderColor: '#2C2C2C', position: 'absolute', bottom: -2, right: -2 },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  userEmail: { color: '#aaa', fontSize: 12, marginTop: 1 },
  actionRow: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3A3A3A', justifyContent: 'center', alignItems: 'center' },
  smallBtnGreen: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  smallBtnRed: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#ff5252', justifyContent: 'center', alignItems: 'center' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f57c00', justifyContent: 'center', alignItems: 'center' },
  pendingBadge: { backgroundColor: '#3A3A3A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  pendingText: { color: '#888', fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2C2C2C', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  emptySubText: { color: '#888', fontSize: 14, marginTop: 6 },
});

