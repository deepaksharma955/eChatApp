import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { api } from '../api';

export default function AIChatScreen() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! I'm your AI English conversation partner. Say anything and I'll help you practice!" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
      const data = await api.post('/api/ai-chat', { message: userMsg.text, history });
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${e.message}. Make sure the AI server is running (cd server && npm start).` }]);
    }
    setLoading(false);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.bubble, item.role === 'ai' ? styles.aiBubble : styles.userBubble]}>
      {item.role === 'ai' && (
        <View style={styles.aiIcon}>
          <Icon name="robot" size={16} color="#fff" />
        </View>
      )}
      <View style={[styles.bubbleContent, item.role === 'ai' ? styles.aiContent : styles.userContent]}>
        <Text style={[styles.bubbleText, item.role === 'user' && { color: '#fff' }]}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : Platform.OS === 'android' ? 80 : 0}
    >
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatRef.current?.scrollToEnd()}
        ListFooterComponent={loading ? <View style={styles.typing}><ActivityIndicator size="small" color="#f57c00" /><Text style={styles.typingText}>AI is typing...</Text></View> : null}
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.5 }]} onPress={handleSend} disabled={!input.trim() || loading}>
          <Icon name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  chatList: { padding: 16, paddingBottom: Platform.OS === 'web' ? 20 : 40 },
  bubble: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  aiBubble: { justifyContent: 'flex-start' },
  userBubble: { justifyContent: 'flex-end' },
  aiIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f57c00', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  bubbleContent: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  aiContent: { backgroundColor: '#2C2C2C', borderTopLeftRadius: 4 },
  userContent: { backgroundColor: '#f57c00', borderTopRightRadius: 4 },
  bubbleText: { color: '#eee', fontSize: 15, lineHeight: 21 },
  typing: { flexDirection: 'row', alignItems: 'center', marginLeft: 36, marginBottom: 8 },
  typingText: { color: '#888', fontSize: 13, marginLeft: 8 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingBottom: Platform.OS === 'web' ? 12 : 36, borderTopWidth: 1, borderTopColor: '#2C2C2C', backgroundColor: '#1A1A1A' },
  input: { flex: 1, backgroundColor: '#2C2C2C', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10, color: '#fff', fontSize: 15, maxHeight: 100, marginRight: 10 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f57c00', justifyContent: 'center', alignItems: 'center' },
});
