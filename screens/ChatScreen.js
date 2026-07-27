import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { View, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Pressable, Modal, ScrollView, Image, TextInput, ActivityIndicator } from 'react-native';
import { GiftedChat, Bubble, Send, InputToolbar, Day } from 'react-native-gifted-chat';
import { ref, onValue, off, push, set, update, runTransaction, get } from 'firebase/database';
import { auth, realtimeDb } from '../firebase';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const showMsg = (title, msg) => {
  Alert.alert(title, msg);
  try { window.alert(msg); } catch (_) {}
};

const EMOJIS = ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘','😗','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤔','🤐','😐','😑','😶','😏','😒','🙄','😬','🤥','😴','😮','🤤','😪','😵','🤯','😳','🥺','😟','😡','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾','❤️','🧡','💛','💚','💙','💜','🖤','💔','💕','💞','💗','💖','💘','💝','💟','👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✌️','🤞','🤟','🤘','👌','💪','🖕','✋','🤚','🖐','👋','🤙','💅','🤳','💄','👶','🧒','👦','👧','🧑','👨','👩','🧓','👴','👵','👲','👳','👮','🕵️','💂','👷','🤴','👸','👰','🤵','🎅','🤶','🙇','💁','🙅','🙆','🙋','🤦','🤷','💆','💇','🚶','🏃','💃','🕺','👯','🧖','🧘','🛀','🛌','👭','👫','👬','💏','💑','👪','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🐘','🦏','🐪','🐫','🦒','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🐐','🦌','🐕','🐩','🐈','🐓','🦃','🕊','🐇','🐁','🐀','🐿','🦔','🐾','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🌱','🌿','☘️','🍀','🎍','🍃','🍂','🍁','🍄','🌺','🌻','🌹','🥀','🌷','🌼','🌸','💐','🌾','🌊','💧','💦','☔️','⛱','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','⭐️','🌟','✨','⚡️','☄️','💥','🔥','🌪','🌈','☀️','🌤','⛅️','🌥','☁️','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄️','🌬','💨','💫','🎉','🎊','🎈','🎁','🎀','🎗','🏆','🏅','🥇','🥈','🥉','⚽️','🏀','🏈','⚾️','🎾','🏐','🏉','🎱','🏓','🏸','🥊','🥋','🎯','⛳️','🎣','🥏','🎠','🎡','🎢','🚂','🚃','🚄','🚅','🚇','🚌','🚍','🚎','🚐','🚑','🚒','🚓','🚔','🚕','🚖','🚗','🚘','🚙','🚚','🚛','🚜','🏎','🏍','🚲','🛴','🛵','🚏','🛤','🛣','⛽️','🚨','🚥','🚦','🛑','🚧','⚓️','⛵️','🛶','🚤','🛳','⛴','🚢','✈️','🛩','🛫','🛬','🚁','🚟','🚠','🚡','🛰','🚀','🛸','🏠','🏡','🏘','🏚','🏗','🏢','🏭','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏯','🏰','💒','🗼','🗽','⛪️','🕌','🕍','🕋','⛩','🛕','🕋','⛲️','⛺️','🌁','🌃','🏙','🌄','🌅','🌆','🌇','🌉','🗾','🏔','⛰','🌋','🗻','🏕','🏖','🏜','🏝','🏞','📱','💻','⌨️','🖥','🖨','🖱','🖲','🕹','🗜','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽','🎞','📞','☎️','📟','📠','📺','📻','🎙','🎚','🎛','🧭','⏱','⏲','⏰','🕰','⌛️','⏳','📡','🔋','🔌','💡','🔦','🕯','🗑','🛢','💸','💵','💴','💶','💷','💰','💳','💎','⚖️','🔧','🔩','⚙️','🗜','🔨','⛏','🪓','🔫','🏹','🛡','🔗','⛓','🧲','🔬','🔭','📡','💉','💊','🚬','⚰️','⚱️','🗿','🛎','🧸','🎈','🎏','🎀','🎁','🎊','🎉','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒','🗓','📆','📅','📇','🗃','🗳','🗄','📋','📁','📂','🗂','🗞','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇','📐','📏','🧮','📌','📍','✂️','🖊','🖋','✒️','🖌','🖍','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓'];

function playSound(type) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'sent') {
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'received') {
      osc.frequency.value = 660;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (_) {}
}

function formatLastSeen(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - parseInt(timestamp);
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(parseInt(timestamp)).toLocaleDateString();
}

export default function ChatScreen({ route, navigation }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userData, setUserData] = useState(null);
  const { roomId: otherUid, roomName } = route.params || {};
  const currentUid = auth.currentUser?.uid;
  const fileInputRef = useRef(null);
  const lastReceivedId = useRef(null);

  useEffect(() => {
    if (!otherUid) return;
    const userRef = ref(realtimeDb, `Users/${otherUid}`);
    const handleData = (snap) => {
      if (snap.exists()) setUserData(snap.val());
    };
    onValue(userRef, handleData);
    return () => off(userRef, 'value', handleData);
  }, [otherUid]);

  const typingSubtitle = isTyping ? 'typing...' : '';
  const statusSubtitle = !isTyping
    ? userData?.status === 'online'
      ? 'Online'
      : userData?.lastSeen
        ? `Last seen ${formatLastSeen(userData.lastSeen)}`
        : ''
    : '';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: roomName || 'Chat',
      headerTitle: () => (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>{roomName || 'Chat'}</Text>
          <Text style={{ color: isTyping ? '#f57c00' : '#888', fontSize: 12 }}>
            {typingSubtitle || statusSubtitle}
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 16 }} onPress={() => setSearchMode(prev => !prev)}>
          <Icon name={searchMode ? 'close' : 'magnify'} size={24} color="#f57c00" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, roomName, isTyping, userData, searchMode]);

  useEffect(() => {
    if (!currentUid || !otherUid) return;
    const typingRef = ref(realtimeDb, `Typing/${currentUid}/${otherUid}`);
    const handleTyping = (snap) => {
      setIsTyping(snap.val() === true);
    };
    onValue(typingRef, handleTyping);
    return () => off(typingRef, 'value', handleTyping);
  }, [currentUid, otherUid]);

  useEffect(() => {
    if (!currentUid || !otherUid) return;

    runTransaction(ref(realtimeDb, `Chatlist/${currentUid}/${otherUid}`), (data) => {
      if (!data) return { id: otherUid, unreadCount: 0 };
      return { ...data, id: otherUid, unreadCount: 0 };
    }).catch(() => {});

    const chatsRef = ref(realtimeDb, 'Chats');
    const handleData = (snapshot) => {
      const msgs = [];
      const unseenKeys = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnap) => {
          const data = childSnap.val();
          const isRelevant =
            (data.sender === currentUid && data.receiver === otherUid) ||
            (data.sender === otherUid && data.receiver === currentUid);
          if (isRelevant) {
            if (data.sender === otherUid && data.receiver === currentUid && !data.isseen) {
              unseenKeys.push(childSnap.key);
            }
            const msg = {
              _id: childSnap.key,
              text: data.message || '',
              createdAt: data.time ? new Date(parseInt(data.time)) : new Date(),
              user: { _id: data.sender },
            };
            if (data.deleted) {
              msg.deleted = true;
            }
            if (data.type === 'image' && !data.deleted) {
              msg.image = data.image;
            }
            if (data.type === 'file' && !data.deleted) {
              msg.file = { name: data.fileName, mimeType: data.fileType, data: data.fileData };
              msg.text = data.fileName || 'File';
            }
            if (currentUid === data.sender) {
              msg.seen = data.isseen === true;
            }
            msgs.push(msg);
          }
        });
      }
      if (unseenKeys.length > 0) {
        const updates = {};
        unseenKeys.forEach(key => { updates[`Chats/${key}/isseen`] = true; });
        update(ref(realtimeDb), updates).catch(() => {});
      }
      msgs.sort((a, b) => b.createdAt - a.createdAt);
      setMessages(msgs);
      if (loading) setLoading(false);
      if (msgs.length > 0 && msgs[0].user._id !== currentUid && msgs[0]._id !== lastReceivedId.current) {
        lastReceivedId.current = msgs[0]._id;
        playSound('received');
      }
    };

    onValue(chatsRef, handleData);
    return () => off(chatsRef, 'value', handleData);
  }, [currentUid, otherUid]);

  const sendMessage = useCallback(async (text, extra = {}) => {
    if (!currentUid || !otherUid) return;
    try {
      const blockSnap = await get(ref(realtimeDb, `BlockedUsers/${currentUid}`));
      if (blockSnap.exists()) {
        try { Alert.alert('Blocked', 'You have been blocked from sending messages.'); } catch (_) { window.alert('You have been blocked from sending messages.'); }
        return;
      }
    } catch (_) {}
    const senderName = auth.currentUser?.email?.split('@')[0] || 'User';
    const chatRef = push(ref(realtimeDb, 'Chats'));
    set(chatRef, {
      sender: currentUid,
      receiver: otherUid,
      senderName: senderName,
      message: text,
      time: Date.now().toString(),
      isseen: false,
      ...extra,
    }).catch((err) => {
      console.error('Firebase write failed:', err);
    });
    update(ref(realtimeDb, `Chatlist/${currentUid}/${otherUid}`), { id: otherUid }).catch(() => {});
    runTransaction(ref(realtimeDb, `Chatlist/${otherUid}/${currentUid}`), (data) => {
      if (!data) return { id: currentUid, unreadCount: 1 };
      return { ...data, id: currentUid, unreadCount: (data.unreadCount || 0) + 1 };
    }).catch(() => {});
    playSound('sent');
  }, [currentUid, otherUid]);

  const onSend = useCallback((newMessages = []) => {
    const msg = newMessages[0];
    if (!msg || !msg.text) return;
    sendMessage(msg.text);
  }, [sendMessage]);

  const deleteMessage = (msgId) => {
    update(ref(realtimeDb, `Chats/${msgId}`), {
      message: 'This message was deleted',
      deleted: true,
      type: null,
      image: null,
      fileData: null,
      fileName: null,
      fileType: null,
    }).catch((err) => console.error('Delete failed:', err));
  };

  const reportMessage = (message) => {
    const reportedUid = message.user?._id;
    const otherUid = reportedUid === currentUid ? route.params?.roomId : reportedUid;
    try {
      Alert.alert('Report Message', 'Why are you reporting this message? (optional)', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => submitReport(message, reportedUid, 'Spam') },
        { text: 'Harassment', onPress: () => submitReport(message, reportedUid, 'Harassment') },
        { text: 'Inappropriate', onPress: () => submitReport(message, reportedUid, 'Inappropriate') },
        { text: 'Other', onPress: () => submitReport(message, reportedUid, 'Other') },
      ]);
    } catch (_) {
      const reason = window.prompt('Reason for report (Spam, Harassment, Inappropriate, Other):', 'Other');
      if (reason) submitReport(message, reportedUid, reason);
    }
  };

  const submitReport = (message, reportedUid, reason) => {
    get(ref(realtimeDb, `Users/${reportedUid}/username`)).then(snap => {
      const reportedName = snap.val() || '';
      const reporterName = auth.currentUser?.email?.split('@')[0] || 'User';
      const reportRef = push(ref(realtimeDb, 'Reports'));
      set(reportRef, {
        reporterUid: currentUid,
        reporterName,
        reportedUid,
        reportedName,
        reason,
        messageId: message._id,
        messageText: message.text,
        timestamp: Date.now(),
        status: 'pending',
      }).catch(err => console.error('Report failed:', err));
    }).catch(() => {});
    try { Alert.alert('Reported', 'Thank you. A moderator will review this.'); } catch (_) { window.alert('Reported. Thank you.'); }
  };

  const confirmDelete = (message) => {
    try {
      Alert.alert('Message', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMessage(message._id) },
        { text: 'Report', onPress: () => reportMessage(message) },
      ]);
    } catch (_) {
      const action = window.confirm('Delete this message?');
      if (action) deleteMessage(message._id);
      else reportMessage(message);
    }
  };

  const handleLongPress = (context, message) => {
    if (message?.user?._id === currentUid) {
      confirmDelete(message);
    } else {
      reportMessage(message);
    }
  };

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

  // typing indicator removed for stability

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

  const renderTicks = (props) => {
    const { currentMessage } = props;
    if (!currentMessage || currentMessage.user._id !== currentUid) return null;
    if (currentMessage.deleted) return null;
    return (
      <Text style={{ fontSize: 12, color: currentMessage.seen ? '#4FC3F7' : 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
        {currentMessage.seen ? '✓✓' : '✓'}
      </Text>
    );
  };

  const renderBubble = (props) => {
    const { currentMessage } = props;
    if (!currentMessage) return null;
    if (currentMessage.deleted) {
      const isMine = currentMessage.user._id === currentUid;
      return (
        <View
          {...(Platform.OS === 'web' ? { onContextMenu: (e) => { e.preventDefault(); currentMessage.user._id === currentUid ? confirmDelete(currentMessage) : reportMessage(currentMessage); } } : {})}
          style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: 280 }}
        >
          <Pressable
            onLongPress={() => { currentMessage.user._id === currentUid ? confirmDelete(currentMessage) : reportMessage(currentMessage); }}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={{
              backgroundColor: isMine ? '#3A3A3A' : '#2C2C2C',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              borderBottomLeftRadius: isMine ? 18 : 4,
              borderBottomRightRadius: isMine ? 4 : 18,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginVertical: 1,
            }}>
              <Text style={{ color: '#666', fontStyle: 'italic', fontSize: 14 }}>This message was deleted</Text>
            </View>
          </Pressable>
        </View>
      );
    }
    const isFile = currentMessage.file;
    return (
      <View
        {...(Platform.OS === 'web' ? { onContextMenu: (e) => { e.preventDefault(); currentMessage.user._id === currentUid ? confirmDelete(currentMessage) : reportMessage(currentMessage); } } : {})}
      >
        <Bubble
          {...props}
          onLongPressMessage={handleLongPress}
          wrapperStyle={{
            right: {
              backgroundColor: '#f57c00',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 4,
              paddingHorizontal: 2,
              maxWidth: 280,
            },
            left: {
              backgroundColor: '#2C2C2C',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 18,
              paddingHorizontal: 2,
              maxWidth: 280,
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
          renderTicks={renderTicks}
          {...(isFile ? { renderMessageImage: () => null } : {})}
        />
      </View>
    );
  };

  const renderSend = (props) => (
    <Send {...props} containerStyle={{ justifyContent: 'center', marginRight: 6, marginBottom: 6 }}>
      <View style={styles.sendButton}>
        <Icon name="send" size={20} color="#fff" />
      </View>
    </Send>
  );

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
    if (!currentMessage || currentMessage.file || currentMessage.deleted) return null;
    return (
      <View style={{ padding: 4 }}>
        <Image source={{ uri: currentMessage.image }} style={{ width: 200, height: 200, borderRadius: 12 }} resizeMode="cover" />
      </View>
    );
  };

  const renderCustomView = (props) => {
    const { currentMessage } = props;
    if (!currentMessage || !currentMessage.file || currentMessage.deleted) return null;
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

  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => !m.deleted && m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : Platform.OS === 'android' ? 80 : 0}
    >
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#f57c00" />
        </View>
      )}
      {searchMode ? (
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
      <GiftedChat
        messages={filteredMessages}
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
        bottomOffset={Platform.OS === 'web' ? 30 : 30}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    zIndex: 10,
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
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  emojiContainer: {
    backgroundColor: '#222',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingVertical: 6,
  },
  emojiScroll: {
    paddingHorizontal: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emojiItem: {
    padding: 4,
    margin: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    margin: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    height: '100%',
  },
});
