import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { View, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Pressable, Modal, ScrollView, Image, TextInput, ActivityIndicator } from 'react-native';
import { GiftedChat, Bubble, Send, InputToolbar, Day } from 'react-native-gifted-chat';
import { ref, onValue, off, push, set, update, runTransaction, get, query, orderByChild, equalTo } from 'firebase/database';
import { auth, realtimeDb } from '../firebase';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

const showMsg = (title, msg) => {
  Alert.alert(title, msg);
  try { window.alert(msg); } catch (_) {}
};

const ActionRow = ({ icon, label, danger, onPress }) => (
  <TouchableOpacity style={styles.actionRowBtn} onPress={onPress}>
    <Icon name={icon} size={20} color={danger ? '#F44336' : '#fff'} style={{ marginRight: 12 }} />
    <Text style={[styles.actionRowLabel, danger && { color: '#F44336' }]}>{label}</Text>
  </TouchableOpacity>
);

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
  const [viewer, setViewer] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [forwardContacts, setForwardContacts] = useState([]);
  const [forwardQuery, setForwardQuery] = useState('');
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
            if (data.deletedFor && data.deletedFor[currentUid]) return;
            if (data.sender === otherUid && data.receiver === currentUid && !data.isseen) {
              unseenKeys.push(childSnap.key);
            }
            const msg = {
              _id: childSnap.key,
              text: data.message || '',
              createdAt: data.time ? new Date(parseInt(data.time)) : new Date(),
              user: { _id: data.sender, name: data.senderName || '' },
            };
            if (data.deleted) {
              msg.deleted = true;
            }
            if (data.replyingTo) {
              msg.replyingTo = data.replyingTo;
            }
            if (data.forwarded) {
              msg.forwarded = true;
              msg.forwardedFrom = data.forwardedFrom || '';
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

    const outgoingQ = query(ref(realtimeDb, 'Chats'), orderByChild('sender'), equalTo(currentUid));
    const incomingQ = query(ref(realtimeDb, 'Chats'), orderByChild('receiver'), equalTo(currentUid));
    const merged = {};
    let skipCount = 2;
    const mergeSnapshot = () => {
      if (skipCount > 0) { skipCount--; return; }
      const combined = { exists: () => Object.keys(merged).length > 0, forEach: (cb) => { Object.entries(merged).forEach(([k, v]) => cb({ key: k, val: () => v, exists: () => true })); } };
      handleData(combined);
    };
    const unsub1 = onValue(outgoingQ, (snap) => {
      if (snap.exists()) snap.forEach((child) => { merged[child.key] = child.val(); });
      else { Object.keys(merged).filter(k => merged[k]?.sender === currentUid).forEach(k => delete merged[k]); }
      mergeSnapshot();
    });
    const unsub2 = onValue(incomingQ, (snap) => {
      if (snap.exists()) snap.forEach((child) => { merged[child.key] = child.val(); });
      else { Object.keys(merged).filter(k => merged[k]?.receiver === currentUid).forEach(k => delete merged[k]); }
      mergeSnapshot();
    });
    return () => { unsub1(); unsub2(); };
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
    const replyData = replyTo && replyTo.text
      ? { replyingTo: {
          senderName: replyTo.user?._id === currentUid ? 'You' : (userData?.username || userData?.useremail?.split('@')[0] || 'User'),
          text: replyTo.text,
        } }
      : {};
    set(chatRef, {
      sender: currentUid,
      receiver: otherUid,
      senderName: senderName,
      message: text,
      time: Date.now().toString(),
      isseen: false,
      ...replyData,
      ...extra,
    }).catch((err) => {
      console.error('Firebase write failed:', err);
    });
    if (replyTo) setReplyTo(null);
    update(ref(realtimeDb, `Chatlist/${currentUid}/${otherUid}`), { id: otherUid }).catch(() => {});
    runTransaction(ref(realtimeDb, `Chatlist/${otherUid}/${currentUid}`), (data) => {
      if (!data) return { id: currentUid, unreadCount: 1 };
      return { ...data, id: currentUid, unreadCount: (data.unreadCount || 0) + 1 };
    }).catch(() => {});
    playSound('sent');
  }, [currentUid, otherUid, replyTo, userData]);

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

  const deleteForMe = (msgId) => {
    update(ref(realtimeDb, `Chats/${msgId}/deletedFor/${currentUid}`), true)
      .catch((err) => console.error('Delete failed:', err));
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
    setActionMsg(message);
  };

  const closeActions = () => setActionMsg(null);

  const handleLongPress = (context, message) => {
    if (!message) return;
    confirmDelete(message);
  };

  const copyMessage = (message) => {
    const textToCopy = message.text || '';
    try {
      if (Platform.OS === 'web' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          try { Alert.alert('Copied', 'Message copied to clipboard.'); } catch (_) { window.alert('Message copied to clipboard.'); }
        });
      } else if (Clipboard.setStringAsync) {
        Clipboard.setStringAsync(textToCopy).then(() => {
          try { Alert.alert('Copied', 'Message copied to clipboard.'); } catch (_) {}
        });
      } else {
        try { Alert.alert('Copied', 'Message copied to clipboard.'); } catch (_) {}
      }
    } catch (_) {
      try { Alert.alert('Copied', 'Message copied to clipboard.'); } catch (_) {}
    }
  };

  const startReply = (message) => {
    setReplyTo(message);
  };

  const cancelReply = () => setReplyTo(null);

  const openForward = async (message) => {
    setForwardMsg(message);
    try {
      const snap = await get(ref(realtimeDb, `Chatlist/${currentUid}`));
      const contacts = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          contacts.push({ id: child.key });
        });
      }
      const withNames = await Promise.all(contacts.map(async (c) => {
        try {
          const u = await get(ref(realtimeDb, `Users/${c.id}`));
          const v = u.val();
          return { ...c, name: (v?.username || v?.useremail?.split('@')[0] || c.id) };
        } catch {
          return { ...c, name: c.id };
        }
      }));
      setForwardContacts(withNames);
    } catch (_) {}
  };

  const forwardTo = async (recipientUid, message) => {
    try {
      const senderName = auth.currentUser?.email?.split('@')[0] || 'User';
      const chatRef = push(ref(realtimeDb, 'Chats'));
      await set(chatRef, {
        sender: currentUid,
        receiver: recipientUid,
        senderName: senderName,
        message: message.text || '',
        time: Date.now().toString(),
        isseen: false,
        forwarded: true,
        forwardedFrom: message.user?._id === currentUid ? '' : (message.user?.name || ''),
      });
      update(ref(realtimeDb, `Chatlist/${currentUid}/${recipientUid}`), { id: recipientUid }).catch(() => {});
      runTransaction(ref(realtimeDb, `Chatlist/${recipientUid}/${currentUid}`), (data) => {
        if (!data) return { id: currentUid, unreadCount: 1 };
        return { ...data, id: currentUid, unreadCount: (data.unreadCount || 0) + 1 };
      }).catch(() => {});
      try { Alert.alert('Forwarded', 'Message forwarded.'); } catch (_) { window.alert('Message forwarded.'); }
    } catch (err) {
      console.error('Forward failed:', err);
    }
    setForwardMsg(null);
    setForwardQuery('');
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

  const getBase64Data = (dataUrl) => (dataUrl && dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl);

  const getDataUrlMeta = (dataUrl) => {
    const match = /^data:([^;,]+)/.exec(dataUrl || '');
    return match ? match[1] : 'image/jpeg';
  };

  const sanitizeFileName = (name) => {
    const base = String(name || 'file').replace(/[\\/:*?"<>|]+/g, '_').trim();
    return base || 'file';
  };

  const writeToCache = async (file) => {
    const dir = new Directory(Paths.cache, 'received-files');
    dir.create({ intermediates: true, idempotent: true });
    const target = new File(dir, sanitizeFileName(file.name));
    target.write(getBase64Data(file.data), { encoding: 'base64' });
    return target;
  };

  const shareNativeFile = async (file) => {
    const target = await writeToCache(file);
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      try { Alert.alert('Not available', 'File sharing is not available on this device.'); } catch (_) {}
      return;
    }
    await Sharing.shareAsync(target.uri, {
      mimeType: file.mimeType || 'application/octet-stream',
      dialogTitle: file.name || 'File',
    });
  };

  const downloadOnWeb = (dataUrl, name) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const viewOnWeb = (media) => {
    const binary = atob(getBase64Data(media.uri));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: media.mimeType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const viewMedia = async (media) => {
    try {
      if (Platform.OS === 'web') {
        viewOnWeb(media);
        return;
      }
      await shareNativeFile(media);
    } catch (err) {
      console.error('View file error:', err);
      const msg = err && err.message ? `Could not open this file.\n\n${err.message}` : 'Could not open this file.';
      try { Alert.alert('Error', msg); } catch (_) { window.alert(msg); }
    }
  };

  const downloadMedia = async (media) => {
    try {
      if (Platform.OS === 'web') {
        downloadOnWeb(media.uri, media.name);
        return;
      }
      await shareNativeFile(media);
    } catch (err) {
      console.error('Download error:', err);
      const msg = err && err.message ? `Could not download this file.\n\n${err.message}` : 'Could not download this file.';
      try { Alert.alert('Error', msg); } catch (_) { window.alert(msg); }
    }
  };

  const pickFile = async () => {
    try {
      if (Platform.OS === 'web') {
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
        return;
      }
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (asset.size > 7 * 1024 * 1024) {
        showMsg('File too large (max 7MB)');
        return;
      }
      const file = new File(asset.uri);
      const mimeType = asset.mimeType || 'application/octet-stream';
      const dataUrl = `data:${mimeType};base64,${await file.base64()}`;
      if (mimeType.startsWith('image/')) {
        sendMessage('📷 Image', { type: 'image', image: dataUrl, fileName: asset.name });
      } else {
        sendMessage('📎 File', { type: 'file', fileData: dataUrl, fileName: asset.name, fileType: mimeType });
      }
    } catch (err) {
      console.error('pickFile error:', err);
      try { Alert.alert('Error', 'Could not pick file.'); } catch (_) { window.alert('Could not pick file.'); }
    }
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
          {...(Platform.OS === 'web' ? { onContextMenu: (e) => { e.preventDefault(); confirmDelete(currentMessage); } } : {})}
          style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: 280 }}
        >
          <Pressable
            onLongPress={() => confirmDelete(currentMessage)}
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
    const isMine = currentMessage.user._id === currentUid;
    return (
      <View
        {...(Platform.OS === 'web' ? { onContextMenu: (e) => { e.preventDefault(); confirmDelete(currentMessage); } } : {})}
      >
        {currentMessage.replyingTo && (
          <View style={[styles.replyQuote, isMine ? styles.replyQuoteRight : styles.replyQuoteLeft]}>
            <Text style={styles.replyQuoteName} numberOfLines={1}>{currentMessage.replyingTo.senderName || 'User'}</Text>
            <Text style={styles.replyQuoteText} numberOfLines={2}>{currentMessage.replyingTo.text}</Text>
          </View>
        )}
        {currentMessage.forwarded && (
          <Text style={[styles.forwardLabel, { alignSelf: isMine ? 'flex-end' : 'flex-start' }]}>
            Forwarded{currentMessage.forwardedFrom ? ` from ${currentMessage.forwardedFrom}` : ''}
          </Text>
        )}
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
      {replyTo ? (
        <View style={styles.replyBar}>
          <Icon name="reply" size={16} color="#f57c00" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.replyBarName} numberOfLines={1}>
              Replying to {replyTo.user?._id === currentUid ? 'You' : (userData?.username || userData?.useremail?.split('@')[0] || 'User')}
            </Text>
            <Text style={styles.replyBarText} numberOfLines={1}>{replyTo.text}</Text>
          </View>
          <TouchableOpacity onPress={cancelReply} style={{ padding: 4 }}>
            <Icon name="close" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      ) : null}
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
      <TouchableOpacity
        activeOpacity={0.8}
        style={{ padding: 4 }}
        onPress={() => {
          const mimeType = getDataUrlMeta(currentMessage.image);
          const ext = mimeType.split('/')[1] || 'jpg';
          setViewer({ type: 'image', uri: currentMessage.image, name: `image.${ext}`, mimeType, data: currentMessage.image });
        }}
      >
        <Image source={{ uri: currentMessage.image }} style={{ width: 200, height: 200, borderRadius: 12 }} resizeMode="cover" />
      </TouchableOpacity>
    );
  };

  const renderCustomView = (props) => {
    const { currentMessage } = props;
    if (!currentMessage || !currentMessage.file || currentMessage.deleted) return null;
    return (
      <TouchableOpacity onPress={() => setViewer({ type: 'file', uri: currentMessage.file.data, name: currentMessage.file.name || 'File', mimeType: currentMessage.file.mimeType, data: currentMessage.file.data })} style={{ padding: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', margin: 4, borderRadius: 10 }}>
        <Icon name="file-document-outline" size={36} color="#aaa" />
        <Text style={{ color: '#aaa', fontSize: 12, marginTop: 4, textAlign: 'center' }}>{currentMessage.file.name || 'File'}</Text>
        <Text style={{ color: '#f57c00', fontSize: 11, marginTop: 4 }}>Tap to view / download</Text>
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
      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewer(null)}>
            <Icon name="close" size={26} color="#fff" />
          </TouchableOpacity>
          {viewer?.type === 'image' ? (
            <Image source={{ uri: viewer.uri }} style={styles.viewerImage} resizeMode="contain" />
          ) : (
            <View style={styles.viewerFileBox}>
              <Icon name="file-document-outline" size={72} color="#f57c00" />
              <Text style={styles.viewerFileName}>{viewer?.name || 'File'}</Text>
            </View>
          )}
          <View style={styles.viewerActions}>
            {viewer?.type === 'file' ? (
              <TouchableOpacity style={styles.viewerActionBtn} onPress={() => viewMedia(viewer)}>
                <Icon name="eye-outline" size={22} color="#fff" />
                <Text style={styles.viewerActionText}>View</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.viewerActionBtn} onPress={() => downloadMedia(viewer)}>
              <Icon name="download" size={22} color="#fff" />
              <Text style={styles.viewerActionText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={!!actionMsg} transparent animationType="fade" onRequestClose={closeActions}>
        <TouchableOpacity style={styles.actionsOverlay} activeOpacity={1} onPress={closeActions}>
          <View style={styles.actionsSheet}>
            <Text style={styles.actionsTitle}>Message Options</Text>
            {actionMsg && (
              <>
                {!actionMsg.deleted && (
                  <>
                    <ActionRow icon="reply" label="Reply" onPress={() => { startReply(actionMsg); closeActions(); }} />
                    <ActionRow icon="content-copy" label="Copy" onPress={() => { copyMessage(actionMsg); closeActions(); }} />
                    <ActionRow icon="forward" label="Forward" onPress={() => { openForward(actionMsg); closeActions(); }} />
                  </>
                )}
                {actionMsg.user?._id === currentUid && !actionMsg.deleted && (
                  <ActionRow danger icon="delete-forever" label="Delete for everyone" onPress={() => { deleteMessage(actionMsg._id); closeActions(); }} />
                )}
                <ActionRow danger icon="delete" label="Delete for me" onPress={() => { deleteForMe(actionMsg._id); closeActions(); }} />
                <ActionRow danger icon="flag" label="Report" onPress={() => { reportMessage(actionMsg); closeActions(); }} />
              </>
            )}
            <TouchableOpacity style={styles.actionsCancel} onPress={closeActions}>
              <Text style={styles.actionsCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={!!forwardMsg} transparent animationType="slide" onRequestClose={() => setForwardMsg(null)}>
        <View style={styles.forwardOverlay}>
          <View style={styles.forwardSheet}>
            <View style={styles.forwardHeader}>
              <Text style={styles.forwardTitle}>Forward to</Text>
              <TouchableOpacity onPress={() => setForwardMsg(null)} style={{ padding: 4 }}>
                <Icon name="close" size={22} color="#888" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.forwardSearch}
              placeholder="Search chats..."
              placeholderTextColor="#888"
              value={forwardQuery}
              onChangeText={setForwardQuery}
            />
            <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
              {forwardContacts
                .filter(c => !forwardQuery.trim() || (c.name || c.id).toLowerCase().includes(forwardQuery.trim().toLowerCase()))
                .map((c) => (
                  <TouchableOpacity key={c.id} style={styles.forwardItem} onPress={() => forwardTo(c.id, forwardMsg)}>
                    <View style={styles.forwardAvatar}>
                      <Text style={styles.forwardAvatarText}>{(c.name || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.forwardItemName} numberOfLines={1}>{c.name || c.id}</Text>
                    <Icon name="send" size={18} color="#f57c00" />
                  </TouchableOpacity>
                ))}
              {forwardContacts.length === 0 && <Text style={styles.forwardEmpty}>No chats yet. Start a conversation to forward messages.</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  viewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '75%',
    borderRadius: 12,
  },
  viewerFileBox: {
    alignItems: 'center',
  },
  viewerFileName: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    maxWidth: 300,
  },
  viewerActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  viewerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f57c00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  viewerActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  replyQuote: {
    maxWidth: 240,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 2,
    borderLeftWidth: 3,
  },
  replyQuoteRight: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderLeftColor: '#fff',
  },
  replyQuoteLeft: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderLeftColor: '#f57c00',
  },
  replyQuoteName: {
    color: '#f57c00',
    fontSize: 12,
    fontWeight: '700',
  },
  replyQuoteText: {
    color: '#ddd',
    fontSize: 13,
  },
  forwardLabel: {
    color: '#f57c00',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  replyBarName: {
    color: '#f57c00',
    fontSize: 12,
    fontWeight: '700',
  },
  replyBarText: {
    color: '#aaa',
    fontSize: 13,
  },
  forwardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  forwardSheet: {
    backgroundColor: '#222',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  forwardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  forwardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  forwardSearch: {
    backgroundColor: '#2C2C2C',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  forwardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  forwardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f57c00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  forwardAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  forwardItemName: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  forwardEmpty: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  actionsSheet: {
    backgroundColor: '#222',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  actionsTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionRowLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  actionsCancel: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionsCancelText: {
    color: '#f57c00',
    fontSize: 15,
    fontWeight: '700',
  },
});
