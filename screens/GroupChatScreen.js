import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Text, Alert } from 'react-native';
import { GiftedChat, Bubble, Send, InputToolbar, Day } from 'react-native-gifted-chat';
import { ref, onValue, off, push, set, get } from 'firebase/database';
import { auth, realtimeDb } from '../firebase';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function GroupChatScreen({ route, navigation }) {
  const [messages, setMessages] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const { groupId } = route.params || {};
  const currentUid = auth.currentUser?.uid;

  useLayoutEffect(() => {
    if (!groupId) return;
    get(ref(realtimeDb, `Groups/${groupId}`)).then((snap) => {
      if (snap.exists()) {
        const d = snap.val();
        setGroupName(d.name || 'Group');
        setInviteCode(d.inviteCode || '');
        setMemberCount(d.members ? Object.keys(d.members).length : 0);
      }
    });
  }, [groupId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: groupName || 'Group Chat',
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 16 }} onPress={showMenu}>
          <Icon name="dots-vertical" size={24} color="#f57c00" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, groupName]);

  const showMenu = () => {
    Alert.alert(groupName || 'Group', `${memberCount} members\nCode: ${inviteCode || 'N/A'}`, [
      { text: 'Add Members', onPress: () => navigation.navigate('AddMember', { groupId }) },
      { text: `Invite Code: ${inviteCode || 'N/A'}`, onPress: () => {
        if (inviteCode) {
          Alert.alert('Invite Code', `Share this code: ${inviteCode}`);
        }
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  useEffect(() => {
    if (!groupId) return;
    const msgRef = ref(realtimeDb, `GroupMessages/${groupId}`);
    const handleData = (snapshot) => {
      const msgs = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const data = child.val();
          msgs.push({
            _id: child.key,
            text: data.text || '',
            createdAt: data.time ? new Date(parseInt(data.time)) : new Date(),
            user: { _id: data.sender, name: data.senderName || 'Unknown' },
          });
        });
      }
      msgs.sort((a, b) => b.createdAt - a.createdAt);
      setMessages(msgs);
    };
    onValue(msgRef, handleData);
    return () => off(msgRef, 'value', handleData);
  }, [groupId]);

  const onSend = useCallback((newMessages = []) => {
    if (!groupId || !currentUid) return;
    const msg = newMessages[0];
    const msgRef = push(ref(realtimeDb, `GroupMessages/${groupId}`));
    set(msgRef, {
      sender: currentUid,
      senderName: auth.currentUser?.email?.split('@')[0] || 'User',
      text: msg.text,
      time: Date.now().toString(),
    });
  }, [groupId, currentUid]);

  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: { backgroundColor: '#f57c00', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
        left: { backgroundColor: '#2C2C2C', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 4, borderBottomRightRadius: 18 },
      }}
      textStyle={{ right: { color: '#fff', fontSize: 16 }, left: { color: '#fff', fontSize: 16 } }}
      timeTextStyle={{ right: { color: 'rgba(255,255,255,0.6)', fontSize: 11 }, left: { color: '#888', fontSize: 11 } }}
    />
  );

  const renderSend = (props) => (
    <Send {...props} containerStyle={{ justifyContent: 'center', marginRight: 8, marginBottom: 6 }}>
      <View style={styles.sendBtn}>
        <Icon name="send" size={20} color="#fff" />
      </View>
    </Send>
  );

  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={{ backgroundColor: '#2C2C2C', borderTopWidth: 0, borderRadius: 24, marginHorizontal: 12, marginBottom: 8, paddingLeft: 8 }}
    />
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <GiftedChat
        messages={messages}
        onSend={m => onSend(m)}
        user={{ _id: currentUid }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderInputToolbar={renderInputToolbar}
        alwaysShowSend
        showAvatarForEveryMessage={false}
        messagesContainerStyle={{ backgroundColor: '#1E1E1E' }}
        textInputProps={{
          style: { color: '#fff', fontSize: 16, paddingVertical: 10 },
          placeholder: 'Type a message...',
          placeholderTextColor: '#888',
        }}
        bottomOffset={Platform.OS === 'android' ? 20 : 0}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f57c00', justifyContent: 'center', alignItems: 'center', elevation: 4 },
});
