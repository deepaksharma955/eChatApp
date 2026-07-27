import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Text, Alert, Pressable, ScrollView, Image, TextInput, ActivityIndicator } from 'react-native';
import { GiftedChat, Bubble, Send, InputToolbar, Day } from 'react-native-gifted-chat';
import { ref, onValue, off, push, set, get, update } from 'firebase/database';
import { auth, realtimeDb } from '../firebase';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const showMsg = (title, msg) => {
  Alert.alert(title, msg);
  try { window.alert(msg); } catch (_) {}
};

const EMOJIS = ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘','😗','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤔','🤐','😐','😑','😶','😏','😒','🙄','😬','🤥','😴','😮','🤤','😪','😵','🤯','😳','🥺','😟','😡','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾','❤️','🧡','💛','💚','💙','💜','🖤','💔','💕','💞','💗','💖','💘','💝','💟','👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✌️','🤞','🤟','🤘','👌','💪','🖕','✋','🤚','🖐','👋','🤙','💅','🤳','💄','👶','🧒','👦','👧','🧑','👨','👩','🧓','👴','👵','👲','👳','👮','🕵️','💂','👷','🤴','👸','👰','🤵','🎅','🤶','🙇','💁','🙅','🙆','🙋','🤦','🤷','💆','💇','🚶','🏃','💃','🕺','👯','🧖','🧘','🛀','🛌','👭','👫','👬','💏','💑','👪','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🐘','🦏','🐪','🐫','🦒','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🐐','🦌','🐕','🐩','🐈','🐓','🦃','🕊','🐇','🐁','🐀','🐿','🦔','🐾','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🌱','🌿','☘️','🍀','🎍','🍃','🍂','🍁','🍄','🌺','🌻','🌹','🥀','🌷','🌼','🌸','💐','🌾','🌊','💧','💦','☔️','⛱','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','⭐️','🌟','✨','⚡️','☄️','💥','🔥','🌪','🌈','☀️','🌤','⛅️','🌥','☁️','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄️','🌬','💨','💫','🎉','🎊','🎈','🎁','🎀','🎗','🏆','🏅','🥇','🥈','🥉','⚽️','🏀','🏈','⚾️','🎾','🏐','🏉','🎱','🏓','🏸','🥊','🥋','🎯','⛳️','🎣','🥏','🎠','🎡','🎢','🚂','🚃','🚄','🚅','🚇','🚌','🚍','🚎','🚐','🚑','🚒','🚓','🚔','🚕','🚖','🚗','🚘','🚙','🚚','🚛','🚜','🏎','🏍','🚲','🛴','🛵','🚏','🛤','🛣','⛽️','🚨','🚥','🚦','🛑','🚧','⚓️','⛵️','🛶','🚤','🛳','⛴','🚢','✈️','🛩','🛫','🛬','🚁','🚟','🚠','🚡','🛰','🚀','🛸','🏠','🏡'];

export default function GroupChatScreen({ route, navigation }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [inputText, setInputText] = useState('');
  const { groupId } = route.params || {};
  const currentUid = auth.currentUser?.uid;
  const inputRef = useRef(null);

  useLayoutEffect(() => {
    if (!groupId) return;
    get(ref(realtimeDb, `Groups/${groupId}`)).then((snap) => {
      if (snap.exists()) {
        const d = snap.val();
        setGroupName(d.name || 'Group');
        let code = d.inviteCode;
        if (!code) {
          code = Math.random().toString(36).substring(2, 8).toUpperCase();
          update(ref(realtimeDb, `Groups/${groupId}`), { inviteCode: code }).catch(() => {});
        }
        setInviteCode(code);
        setMemberCount(d.members ? Object.keys(d.members).length : 0);
      }
    });
  }, [groupId]);

  const copyInviteCode = () => {
    const code = inviteCode || 'N/A';
    try {
      navigator.clipboard.writeText(code);
      showMsg('Copied', `Invite code: ${code}`);
    } catch (_) {
      try { window.prompt('Copy this invite code:', code); } catch (__) {}
    }
  };

  const shareInvite = async () => {
    const code = inviteCode || 'N/A';
    const text = `Join "${groupName}" on eChat!\nInvite code: ${code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: groupName, text });
      } else {
        copyInviteCode();
      }
    } catch (_) {
      copyInviteCode();
    }
  };

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
    try {
      Alert.alert(groupName || 'Group', `${memberCount} members\nCode: ${inviteCode || 'N/A'}`, [
        { text: 'Copy Code', onPress: copyInviteCode },
        { text: 'Share', onPress: shareInvite },
        { text: 'Add Members', onPress: () => navigation.navigate('AddMember', { groupId }) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (_) {
      const action = window.confirm(`${groupName}\nMembers: ${memberCount}\nCode: ${inviteCode}\n\nCopy code?`);
      if (action) copyInviteCode();
    }
  };

  useEffect(() => {
    if (!groupId) return;
    const msgRef = ref(realtimeDb, `GroupMessages/${groupId}`);
    const handleData = (snapshot) => {
      const msgs = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const data = child.val();
          const msg = {
            _id: child.key,
            text: data.text || '',
            createdAt: data.time ? new Date(parseInt(data.time)) : new Date(),
            user: { _id: data.sender, name: data.senderName || 'Unknown' },
          };
          if (data.type === 'image') {
            msg.image = data.image;
          }
          if (data.type === 'file') {
            msg.file = { name: data.fileName, mimeType: data.fileType, data: data.fileData };
          }
          msgs.push(msg);
        });
      }
      msgs.sort((a, b) => b.createdAt - a.createdAt);
      setMessages(msgs);
      if (loading) setLoading(false);
    };
    onValue(msgRef, handleData);
    return () => off(msgRef, 'value', handleData);
  }, [groupId]);

  const sendMessage = useCallback(async (text, extra = {}) => {
    if (!groupId || !currentUid) return;
    try {
      const blockSnap = await get(ref(realtimeDb, `BlockedUsers/${currentUid}`));
      if (blockSnap.exists()) {
        try { Alert.alert('Blocked', 'You have been blocked from sending messages.'); } catch (_) { window.alert('You have been blocked from sending messages.'); }
        return;
      }
    } catch (_) {}
    const senderName = auth.currentUser?.email?.split('@')[0] || 'User';
    const msgRef = push(ref(realtimeDb, `GroupMessages/${groupId}`));
    set(msgRef, {
      sender: currentUid,
      senderName: senderName,
      text: text,
      time: Date.now().toString(),
      ...extra,
    }).catch((err) => {
      console.error('Firebase write failed:', err);
    });
  }, [groupId, currentUid]);

  const onSend = useCallback((newMessages = []) => {
    const msg = newMessages[0];
    if (!msg || !msg.text) return;
    sendMessage(msg.text);
  }, [sendMessage]);

  const insertEmoji = (emoji) => {
    setInputText(prev => prev + emoji);
    try {
      const input = document.querySelector('textarea, input[type="text"]');
      if (input) {
        const start = input.selectionStart || input.value.length;
        const end = input.selectionEnd || input.value.length;
        input.value = input.value.substring(0, start) + emoji + input.value.substring(end);
        input.selectionStart = input.selectionEnd = start + emoji.length;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (_) {}
  };

  const pickFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx,.txt,.zip';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 7 * 1024 * 1024) {
        showMsg('File too large (max 7MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        if (file.type.startsWith('image/')) {
          sendMessage('📷 Image', { type: 'image', image: dataUrl, fileName: file.name });
        } else {
          sendMessage('📎 File', { type: 'file', fileData: dataUrl, fileName: file.name, fileType: file.type });
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const renderBubble = (props) => {
    const { currentMessage } = props;
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: { backgroundColor: '#f57c00', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 2, maxWidth: 280 },
          left: { backgroundColor: '#2C2C2C', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 4, borderBottomRightRadius: 18, paddingHorizontal: 2, maxWidth: 280 },
        }}
        textStyle={{ right: { color: '#fff', fontSize: 16, lineHeight: 20 }, left: { color: '#fff', fontSize: 16, lineHeight: 20 } }}
        timeTextStyle={{ right: { color: 'rgba(255,255,255,0.6)', fontSize: 11 }, left: { color: '#888', fontSize: 11 } }}
      />
    );
  };

  const renderActions = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, marginBottom: 6 }}>
      <TouchableOpacity onPress={() => setShowEmoji(!showEmoji)} style={styles.actionBtn}>
        <Icon name="emoticon-happy" size={22} color="#888" />
      </TouchableOpacity>
      <TouchableOpacity onPress={pickFile} style={styles.actionBtn}>
        <Icon name="paperclip" size={22} color="#888" />
      </TouchableOpacity>
    </View>
  );

  const renderSend = (props) => (
    <Send {...props} containerStyle={{ justifyContent: 'center', marginRight: 6, marginBottom: 6 }}>
      <View style={styles.sendBtn}>
        <Icon name="send" size={20} color="#fff" />
      </View>
    </Send>
  );

  const renderInputToolbar = (props) => (
    <View style={{ paddingBottom: Platform.OS === 'web' ? 30 : 40 }}>
      {showEmoji ? (
        <View style={styles.emojiContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiScroll}>
            {EMOJIS.map((e, i) => (
              <TouchableOpacity key={i} onPress={() => insertEmoji(e)} style={styles.emojiItem}>
                <Text style={{ fontSize: 24 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: '#2C2C2C',
          borderTopWidth: 0,
          borderRadius: 24,
          marginHorizontal: 12,
          marginBottom: 8,
          paddingLeft: 4,
        }}
        primaryStyle={{ alignItems: 'center' }}
      />
    </View>
  );

  const renderMessageImage = (props) => {
    const { currentMessage } = props;
    if (!currentMessage || currentMessage.file) return null;
    return (
      <View style={{ padding: 4 }}>
        <Image source={{ uri: currentMessage.image }} style={{ width: 200, height: 200, borderRadius: 12 }} resizeMode="cover" />
      </View>
    );
  };

  const renderCustomView = (props) => {
    const { currentMessage } = props;
    if (!currentMessage || !currentMessage.file) return null;
    return (
      <TouchableOpacity onPress={() => {
        if (currentMessage.file.data) {
          const binary = atob(currentMessage.file.data.split(',')[1]);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: currentMessage.file.mimeType || 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = currentMessage.file.name || 'download';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        }
      }} style={{ padding: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', margin: 4, borderRadius: 10 }}>
        <Icon name="file-document-outline" size={36} color="#aaa" />
        <Text style={{ color: '#aaa', fontSize: 12, marginTop: 4, textAlign: 'center' }}>{currentMessage.file.name || 'File'}</Text>
        <Text style={{ color: '#f57c00', fontSize: 11, marginTop: 4 }}>Tap to download</Text>
      </TouchableOpacity>
    );
  };

  const renderDay = (props) => (
    <Day {...props} textStyle={{ color: '#888', fontSize: 12, fontWeight: '500' }} />
  );

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#f57c00" />
        </View>
      )}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : Platform.OS === 'android' ? 80 : 0}>
        <View style={styles.inviteBanner}>
          <Icon name="link-variant" size={16} color="#f57c00" />
          <Text style={styles.inviteText}>Invite code: <Text style={{ fontWeight: '700', color: '#f57c00' }}>{inviteCode}</Text></Text>
          <TouchableOpacity onPress={copyInviteCode} style={styles.inviteCopyBtn}>
            <Icon name="content-copy" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={shareInvite} style={styles.inviteShareBtn}>
            <Icon name="share-variant" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <GiftedChat
        messages={messages}
        onSend={m => onSend(m)}
        user={{ _id: currentUid }}
        onInputTextChanged={setInputText}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderActions={renderActions}
        renderInputToolbar={renderInputToolbar}
        renderMessageImage={renderMessageImage}
        renderCustomView={renderCustomView}
        renderDay={renderDay}
        alwaysShowSend
        showAvatarForEveryMessage={false}
        showUserAvatar={false}
        messagesContainerStyle={{ backgroundColor: '#1E1E1E' }}
        textInputProps={{
          style: { color: '#fff', fontSize: 16, lineHeight: 20, paddingVertical: 10 },
          placeholder: 'Type a message...',
          placeholderTextColor: '#888',
        }}
        minInputToolbarHeight={60}
        maxComposerHeight={120}
        bottomOffset={Platform.OS === 'web' ? 30 : 30}
      />
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E1E', zIndex: 10 },
  inviteBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C',
    paddingVertical: 8, paddingHorizontal: 14, marginHorizontal: 12, marginTop: 4, marginBottom: 2,
    borderRadius: 10,
  },
  inviteText: { color: '#aaa', fontSize: 13, flex: 1, marginLeft: 8 },
  inviteCopyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#3A3A3A', justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  inviteShareBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f57c00', justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f57c00', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  actionBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginRight: 2 },
  emojiContainer: { backgroundColor: '#222', borderTopWidth: 1, borderTopColor: '#333', paddingVertical: 6 },
  emojiScroll: { paddingHorizontal: 8 },
  emojiItem: { paddingHorizontal: 6, paddingVertical: 2 },
});
