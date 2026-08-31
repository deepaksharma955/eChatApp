import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { auth, realtimeDb } from '../firebase';
import { ref, onValue, off, get, set, onChildAdded, remove } from 'firebase/database';
import { createPeerConnection, getUserMedia, createOffer, createAnswer, isCallingSupported, createSessionDescription, createIceCandidate } from '../utils/webrtc';

export default function VideoCallScreen() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [callPartner, setCallPartner] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [callStatus, setCallStatus] = useState('');
  const currentUid = auth.currentUser?.uid;
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const callIdRef = useRef(null);

  useEffect(() => {
    if (!currentUid) return;
    const friendsRef = ref(realtimeDb, `Users/${currentUid}/friends`);
    const handleFriends = async (snap) => {
      const items = [];
      if (snap.exists()) {
        const ids = Object.keys(snap.val());
        const promises = ids.map(uid => get(ref(realtimeDb, `Users/${uid}`)).then(u => {
          if (u.exists()) {
            const d = u.val();
            items.push({ uid, name: d.username || 'Unknown', status: d.status || 'offline' });
          }
        }));
        await Promise.all(promises);
      }
      setFriends(items);
      setLoading(false);
    };
    onValue(friendsRef, handleFriends);
    return () => off(friendsRef, 'value', handleFriends);
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid) return;
    const incomingRef = ref(realtimeDb, `CallSignaling/${currentUid}/incoming`);
    const unsub = onChildAdded(incomingRef, (snap) => {
      const data = snap.val();
      if (data && (data.type === 'video-offer' || data.type === 'offer')) {
        setIncomingCall({ callerId: snap.key, ...data });
        callIdRef.current = snap.key;
      }
    });
    return () => unsub();
  }, [currentUid]);

  const startCall = async (friend) => {
    const callId = `${currentUid}_${friend.uid}_${Date.now()}`;
    callIdRef.current = callId;
    setIsCalling(true);
    setCallPartner(friend);
    setCallStatus('Calling...');

    try {
      const stream = await getUserMedia(true, true);
      localStreamRef.current = stream;
      const { pc } = await createPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          set(ref(realtimeDb, `CallSignaling/${friend.uid}/incoming/${callId}/candidate`), e.candidate.toJSON());
        }
      };

      pc.ontrack = () => {};

      const offer = await createOffer(pc);
      await set(ref(realtimeDb, `CallSignaling/${friend.uid}/incoming/${callId}`), {
        type: 'video-offer',
        caller: currentUid,
        callerName: auth.currentUser?.email?.split('@')[0] || 'Someone',
        sdp: { type: offer.type, sdp: offer.sdp },
        timestamp: Date.now(),
      });

      setCallStatus('Ringing...');
      listenForAnswer(pc, callId, friend.uid);
    } catch (e) {
      setCallStatus(`Error: ${e.message}`);
      setIsCalling(false);
    }
  };

  const listenForAnswer = (pc, callId, peerId) => {
    const answerRef = ref(realtimeDb, `CallSignaling/${currentUid}/incoming/${callId}`);
    const unsub = onChildAdded(answerRef, async (snap) => {
      const data = snap.val();
      if (data && (data.type === 'answer' || data.type === 'video-answer')) {
        try {
          const desc = await createSessionDescription(data.sdp);
          await pc.setRemoteDescription(desc);
          setCallStatus('Connected');
          setInCall(true);
          setIsCalling(false);
        } catch {}
        unsub();
        listenForCandidates(pc, callId, peerId);
      }
    });
  };

  const listenForCandidates = (pc, callId, peerId) => {
    const candRef = ref(realtimeDb, `CallSignaling/${peerId}/incoming/${callId}/candidate`);
    const unsub = onChildAdded(candRef, async (snap) => {
      const cand = snap.val();
      if (cand && pc.remoteDescription) {
        const ice = await createIceCandidate(cand);
        pc.addIceCandidate(ice).catch(() => {});
      }
    });
    setTimeout(() => unsub(), 30000);
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    const callId = callIdRef.current;
    setIsCalling(true);
    setCallPartner({ uid: incomingCall.caller, name: incomingCall.callerName });
    setCallStatus('Connecting...');

    try {
      const stream = await getUserMedia(true, true);
      localStreamRef.current = stream;
      const { pc } = await createPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          set(ref(realtimeDb, `CallSignaling/${incomingCall.caller}/incoming/${callId}/candidate`), e.candidate.toJSON());
        }
      };

      pc.ontrack = () => {};

      const desc = await createSessionDescription(incomingCall.sdp);
      await pc.setRemoteDescription(desc);
      const answer = await createAnswer(pc);
      await set(ref(realtimeDb, `CallSignaling/${incomingCall.caller}/incoming/${callId}`), {
        type: 'video-answer',
        sdp: { type: answer.type, sdp: answer.sdp },
      });

      setInCall(true);
      setCallStatus('Connected');
      setIncomingCall(null);
      remove(ref(realtimeDb, `CallSignaling/${currentUid}/incoming/${callId}`));
      listenForCandidates(pc, callId, incomingCall.caller);
    } catch (e) {
      setCallStatus(`Error: ${e.message}`);
    }
    setIsCalling(false);
  };

  const endCall = () => {
    if (pcRef.current) pcRef.current.close();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    pcRef.current = null;
    localStreamRef.current = null;
    if (callIdRef.current && callPartner) {
      remove(ref(realtimeDb, `CallSignaling/${callPartner.uid}/incoming/${callIdRef.current}`));
      remove(ref(realtimeDb, `CallSignaling/${currentUid}/incoming/${callIdRef.current}`));
    }
    setInCall(false);
    setIsCalling(false);
    setCallPartner(null);
    setCallStatus('');
  };

  const rejectCall = () => {
    if (callIdRef.current) {
      remove(ref(realtimeDb, `CallSignaling/${currentUid}/incoming/${callIdRef.current}`));
    }
    setIncomingCall(null);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !videoOn; });
      setVideoOn(!videoOn);
    }
  };

  if (!isCallingSupported()) {
    return <View style={styles.center}><Text style={styles.emptyText}>WebRTC not supported on this device</Text></View>;
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#f57c00" /></View>;
  }

  if (inCall || isCalling || callPartner) {
    return (
      <View style={styles.callContainer}>
        <View style={styles.videoGrid}>
          <View style={styles.remoteVideo}>
            <Text style={styles.videoLabel}>{callPartner?.name}</Text>
          </View>
          <View style={styles.localVideo}>
            <Text style={styles.videoLabel}>You</Text>
          </View>
        </View>
        <View style={styles.callStatusBar}>
          <Text style={styles.callStatusText}>{callStatus}</Text>
        </View>
        <View style={styles.callControls}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => setMuted(!muted)}>
            <Icon name={muted ? 'microphone-off' : 'microphone'} size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={toggleVideo}>
            <Icon name={videoOn ? 'video' : 'video-off'} size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
            <Icon name="phone-hangup" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {incomingCall && (
        <View style={styles.incomingBanner}>
          <View style={styles.incomingInfo}>
            <Icon name="video" size={24} color="#fff" />
            <Text style={styles.incomingText}>{incomingCall.callerName} is video calling...</Text>
          </View>
          <View style={styles.incomingActions}>
            <TouchableOpacity style={styles.acceptBtn} onPress={answerCall}>
              <Icon name="video" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={rejectCall}>
              <Icon name="phone-hangup" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Online Friends</Text>
      <FlatList
        data={friends.filter(f => f.status === 'online')}
        keyExtractor={item => item.uid}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No friends online</Text>}
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
            <View style={styles.friendAvatar}>
              <Text style={styles.friendAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{item.name}</Text>
              <Text style={styles.friendStatus}>Online</Text>
            </View>
            <TouchableOpacity style={styles.videoBtn} onPress={() => startCall(item)}>
              <Icon name="video" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E', padding: 16 },
  center: { flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { color: '#aaa', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  friendItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#3A3A3A' },
  friendAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#f57c00', justifyContent: 'center', alignItems: 'center', marginRight: 14, position: 'relative' },
  friendAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  onlineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', position: 'absolute', bottom: -1, right: -1, borderWidth: 2, borderColor: '#2C2C2C' },
  friendInfo: { flex: 1 },
  friendName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  friendStatus: { color: '#888', fontSize: 12, marginTop: 2 },
  videoBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F44336', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 20 },
  callContainer: { flex: 1, backgroundColor: '#111' },
  videoGrid: { flex: 1, position: 'relative' },
  remoteVideo: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  localVideo: { position: 'absolute', top: 40, right: 16, width: 120, height: 160, backgroundColor: '#1E1E1E', borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#f57c00' },
  videoLabel: { position: 'absolute', bottom: 8, left: 8, color: '#fff', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  callStatusBar: { alignItems: 'center', paddingVertical: 8, backgroundColor: '#1A1A1A' },
  callStatusText: { color: '#888', fontSize: 13 },
  callControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 24, backgroundColor: '#1A1A1A', gap: 20 },
  controlBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#2C2C2C', justifyContent: 'center', alignItems: 'center' },
  endCallBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F44336', justifyContent: 'center', alignItems: 'center' },
  incomingBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f57c00' },
  incomingInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  incomingText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  incomingActions: { flexDirection: 'row', gap: 10 },
  acceptBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F44336', justifyContent: 'center', alignItems: 'center' },
});
