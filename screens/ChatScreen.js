import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { GiftedChat, Bubble, Send, InputToolbar, Day } from 'react-native-gifted-chat';
import { ref, onValue, off, push, set, update } from 'firebase/database';
import { auth, realtimeDb } from '../firebase';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function ChatScreen({ route, navigation }) {
  const [messages, setMessages] = useState([]);
  const { roomId: otherUid, roomName } = route.params || {};
  const currentUid = auth.currentUser?.uid;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: roomName || 'Chat',
    });
  }, [navigation, roomName]);

  useEffect(() => {
    if (!currentUid || !otherUid) return;

    const chatsRef = ref(realtimeDb, 'Chats');
    const handleData = (snapshot) => {
      const msgs = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnap) => {
          const data = childSnap.val();
          const isRelevant =
            (data.sender === currentUid && data.receiver === otherUid) ||
            (data.sender === otherUid && data.receiver === currentUid);
          if (isRelevant) {
            msgs.push({
              _id: childSnap.key,
              text: data.message || '',
              createdAt: data.time ? new Date(parseInt(data.time)) : new Date(),
              user: {
                _id: data.sender,
              },
            });
          }
        });
      }
      msgs.sort((a, b) => b.createdAt - a.createdAt);
      setMessages(msgs);
    };

    onValue(chatsRef, handleData);
    return () => off(chatsRef, 'value', handleData);
  }, [currentUid, otherUid]);

  const onSend = useCallback((newMessages = []) => {
    if (!currentUid || !otherUid) return;
    const msg = newMessages[0];
    const chatRef = push(ref(realtimeDb, 'Chats'));
    set(chatRef, {
      sender: currentUid,
      receiver: otherUid,
      message: msg.text,
      time: Date.now().toString(),
      isseen: false,
    });
    update(ref(realtimeDb, `Chatlist/${currentUid}/${otherUid}`), { id: otherUid });
    update(ref(realtimeDb, `Chatlist/${otherUid}/${currentUid}`), { id: currentUid });
  }, [currentUid, otherUid]);

  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: '#f57c00',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 4,
          paddingHorizontal: 2,
        },
        left: {
          backgroundColor: '#2C2C2C',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 18,
          paddingHorizontal: 2,
        },
      }}
      textStyle={{
        right: { color: '#fff', fontSize: 16, lineHeight: 20 },
        left: { color: '#fff', fontSize: 16, lineHeight: 20 },
      }}
      timeTextStyle={{
        right: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
        left: { color: '#888', fontSize: 11 },
      }}
      tickStyle={{ color: '#fff' }}
    />
  );

  const renderSend = (props) => (
    <Send {...props} containerStyle={{ justifyContent: 'center', marginRight: 8, marginBottom: 6 }}>
      <View style={styles.sendButton}>
        <Icon name="send" size={20} color="#fff" />
      </View>
    </Send>
  );

  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={{
        backgroundColor: '#2C2C2C',
        borderTopWidth: 0,
        borderRadius: 24,
        marginHorizontal: 12,
        marginBottom: 8,
        paddingLeft: 8,
      }}
      primaryStyle={{ alignItems: 'center' }}
    />
  );

  const renderDay = (props) => (
    <Day {...props} textStyle={{ color: '#888', fontSize: 12, fontWeight: '500' }} />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <GiftedChat
        messages={messages}
        onSend={m => onSend(m)}
        user={{ _id: currentUid }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderInputToolbar={renderInputToolbar}
        renderDay={renderDay}
        alwaysShowSend
        showAvatarForEveryMessage={false}
        showUserAvatar={false}
        messagesContainerStyle={{ backgroundColor: '#1E1E1E' }}
        textInputProps={{
          style: {
            color: '#fff',
            fontSize: 16,
            lineHeight: 20,
            paddingVertical: 10,
          },
          placeholder: 'Type a message...',
          placeholderTextColor: '#888',
        }}
        minInputToolbarHeight={60}
        maxComposerHeight={120}
        bottomOffset={Platform.OS === 'android' ? 20 : 0}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f57c00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f57c00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

