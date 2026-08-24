import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { api } from '../api';

export default function TappableText({ text, style, wordStyle }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(false);

  const lookupWord = async (word) => {
    setSelectedWord(word);
    setDefinition(null);
    setLoading(true);
    try {
      const data = await api.post('/api/grammar', { text: `Define the word "${word}" in one short sentence.` });
      setDefinition(data.corrected || data.original || word);
    } catch {
      setDefinition(word);
    }
    setLoading(false);
  };

  const textColor = style?.color || '#fff';
  const fontSize = style?.fontSize || 16;
  const lineHeight = style?.lineHeight || 24;

  const words = text.split(/(\s+)/);

  return (
    <View>
      <Text style={style}>
        {words.map((segment, i) => {
          if (/^\s+$/.test(segment)) return <Text key={i}>{segment}</Text>;
          const clean = segment.replace(/[^a-zA-Z]/g, '');
          if (!clean) return <Text key={i}>{segment}</Text>;
          return (
            <Text key={i} onPress={() => lookupWord(clean)} suppressHighlighting={false}>
              <Text style={[{ color: textColor, fontSize, lineHeight }, wordStyle]}>{segment}</Text>
            </Text>
          );
        })}
      </Text>

      <Modal visible={!!selectedWord} transparent animationType="fade" onRequestClose={() => setSelectedWord(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSelectedWord(null)}>
          <View style={styles.popup}>
            <View style={styles.popupHeader}>
              <Icon name="book-open-variant" size={18} color="#f57c00" />
              <Text style={styles.popupWord}>{selectedWord}</Text>
              <TouchableOpacity onPress={() => setSelectedWord(null)}>
                <Icon name="close" size={18} color="#888" />
              </TouchableOpacity>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color="#f57c00" style={{ marginVertical: 12 }} />
            ) : definition ? (
              <Text style={styles.popupDef}>{definition}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  popup: {
    backgroundColor: '#2C2C2C',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  popupWord: {
    color: '#f57c00',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  popupDef: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
  },
});
