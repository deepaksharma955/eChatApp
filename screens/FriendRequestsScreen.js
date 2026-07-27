import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth, realtimeDb } from '../firebase';
import { ref, onValue, off, set, get, child } from 'firebase/database';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function FriendRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUid) return;
    const reqRef = ref(realtimeDb, 'FriendRequests');
    onValue(reqRef, async (snap) => {
      const list = [];
      if (snap.exists()) {
        const promises = [];
        snap.forEach((senderChild) => {
          const senderUid = senderChild.key;
          senderChild.forEach((reqChild) => {
            const data = reqChild.val();
            if (data.to === currentUid && data.status === 'pending') {
              const p = get(child(ref(realtimeDb), `Users/${senderUid}`)).then(userSnap => {
                const u = userSnap.val() || {};
                list.push({ id: senderUid, username: u.username || 'Unknown', useremail: u.useremail || '', direction: 'incoming', ...data });
              });
              promises.push(p);
            }
          });
        });

        snap.forEach((senderChild) => {
          if (senderChild.key === currentUid) {
            senderChild.forEach((reqChild) => {
              const data = reqChild.val();
              if (data.status === 'pending') {
                const otherUid = data.to;
                if (!list.find(r => r.id === otherUid && r.direction === 'incoming')) {
                  const p = get(child(ref(realtimeDb), `Users/${otherUid}`)).then(userSnap => {
                    const u = userSnap.val() || {};
                    list.push({ id: otherUid, username: u.username || 'Unknown', useremail: u.useremail || '', direction: 'outgoing', ...data });
                  });
                  promises.push(p);
                }
              }
            });
          }
        });
        await Promise.all(promises);
      }
      setRequests(list);
      setLoading(false);
    });
    return () => off(reqRef);
  }, [currentUid]);

  const showMsg = (title, msg) => {
    try { Alert.alert(title, msg); } catch (_) {}
    try { window.alert(`${title}: ${msg}`); } catch (_) {}
  };

  const accept = async (otherUid, otherUser) => {
    setAcceptingId(otherUid);
    try {
      const me = await get(child(ref(realtimeDb), `Users/${currentUid}`));
      const myData = me.val() || {};
      await set(ref(realtimeDb, `Friends/${currentUid}/${otherUid}`), { id: otherUid, username: otherUser.username || '', useremail: otherUser.useremail || '' });
      await set(ref(realtimeDb, `Friends/${otherUid}/${currentUid}`), { id: currentUid, username: myData.username || '', useremail: myData.useremail || '' });
      await set(ref(realtimeDb, `FriendRequests/${otherUid}/${currentUid}`), null);
      setRequests(prev => prev.filter(r => !(r.id === otherUid && r.direction === 'incoming')));
      showMsg('Accepted', `You are now friends with ${otherUser.username || otherUid}`);
    } catch (err) { showMsg('Error', err.message || 'Accept failed'); }
    setAcceptingId(null);
  };

  const reject = async (otherUid) => {
    try {
      await set(ref(realtimeDb, `FriendRequests/${otherUid}/${currentUid}`), null);
      setRequests(prev => prev.filter(r => !(r.id === otherUid && r.direction === 'incoming')));
      showMsg('Rejected', 'Friend request rejected');
    }
    catch (err) { showMsg('Error', err.message || 'Reject failed'); }
  };

  const cancel = async (otherUid) => {
    try { await set(ref(realtimeDb, `FriendRequests/${currentUid}/${otherUid}`), null); }
    catch (err) { showMsg('Error', err.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f57c00" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={item => item.id + item.direction}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bell-off-outline" size={50} color="#555" />
            <Text style={styles.emptyText}>No friend requests</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(item.username || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.username}</Text>
              <Text style={styles.email}>{item.useremail}</Text>
              <Text style={styles.dir}>{item.direction === 'incoming' ? 'Wants to be friends' : 'Request sent'}</Text>
            </View>
            {item.direction === 'incoming' ? (
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.acceptBtn, acceptingId === item.id && { opacity: 0.5 }]} onPress={() => accept(item.id, item)} disabled={acceptingId === item.id}>
                  <Icon name={acceptingId === item.id ? "clock" : "check"} size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => reject(item.id)}>
                  <Icon name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => cancel(item.id)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  center: { flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' },
  card: { flexDirection: 'row', backgroundColor: '#2C2C2C', padding: 14, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f57c00', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 15, fontWeight: '600' },
  email: { color: '#aaa', fontSize: 12, marginTop: 1 },
  dir: { color: '#888', fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6 },
  acceptBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ff5252', justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#3A3A3A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  cancelText: { color: '#888', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 12 },
});

