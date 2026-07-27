import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, FlatList, Image, Platform } from 'react-native';
import { auth, realtimeDb } from '../firebase';
import { ref, onValue, off, update } from 'firebase/database';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const COUNTRIES = [
  { flag: '🇦🇫', name: 'Afghanistan' }, { flag: '🇦🇱', name: 'Albania' }, { flag: '🇩🇿', name: 'Algeria' },
  { flag: '🇦🇩', name: 'Andorra' }, { flag: '🇦🇴', name: 'Angola' }, { flag: '🇦🇬', name: 'Antigua & Barbuda' },
  { flag: '🇦🇷', name: 'Argentina' }, { flag: '🇦🇲', name: 'Armenia' }, { flag: '🇦🇺', name: 'Australia' },
  { flag: '🇦🇹', name: 'Austria' }, { flag: '🇦🇿', name: 'Azerbaijan' }, { flag: '🇧🇸', name: 'Bahamas' },
  { flag: '🇧🇭', name: 'Bahrain' }, { flag: '🇧🇩', name: 'Bangladesh' }, { flag: '🇧🇧', name: 'Barbados' },
  { flag: '🇧🇾', name: 'Belarus' }, { flag: '🇧🇪', name: 'Belgium' }, { flag: '🇧🇿', name: 'Belize' },
  { flag: '🇧🇯', name: 'Benin' }, { flag: '🇧🇹', name: 'Bhutan' }, { flag: '🇧🇴', name: 'Bolivia' },
  { flag: '🇧🇦', name: 'Bosnia & Herzegovina' }, { flag: '🇧🇼', name: 'Botswana' }, { flag: '🇧🇷', name: 'Brazil' },
  { flag: '🇧🇳', name: 'Brunei' }, { flag: '🇧🇬', name: 'Bulgaria' }, { flag: '🇧🇫', name: 'Burkina Faso' },
  { flag: '🇧🇮', name: 'Burundi' }, { flag: '🇰🇭', name: 'Cambodia' }, { flag: '🇨🇲', name: 'Cameroon' },
  { flag: '🇨🇦', name: 'Canada' }, { flag: '🇨🇻', name: 'Cape Verde' }, { flag: '🇨🇫', name: 'Central African Republic' },
  { flag: '🇹🇩', name: 'Chad' }, { flag: '🇨🇱', name: 'Chile' }, { flag: '🇨🇳', name: 'China' },
  { flag: '🇨🇴', name: 'Colombia' }, { flag: '🇰🇲', name: 'Comoros' }, { flag: '🇨🇬', name: 'Congo' },
  { flag: '🇨🇷', name: 'Costa Rica' }, { flag: '🇭🇷', name: 'Croatia' }, { flag: '🇨🇺', name: 'Cuba' },
  { flag: '🇨🇾', name: 'Cyprus' }, { flag: '🇨🇿', name: 'Czech Republic' }, { flag: '🇩🇰', name: 'Denmark' },
  { flag: '🇩🇯', name: 'Djibouti' }, { flag: '🇩🇲', name: 'Dominica' }, { flag: '🇩🇴', name: 'Dominican Republic' },
  { flag: '🇪🇨', name: 'Ecuador' }, { flag: '🇪🇬', name: 'Egypt' }, { flag: '🇸🇻', name: 'El Salvador' },
  { flag: '🇬🇶', name: 'Equatorial Guinea' }, { flag: '🇪🇷', name: 'Eritrea' }, { flag: '🇪🇪', name: 'Estonia' },
  { flag: '🇪🇹', name: 'Ethiopia' }, { flag: '🇫🇯', name: 'Fiji' }, { flag: '🇫🇮', name: 'Finland' },
  { flag: '🇫🇷', name: 'France' }, { flag: '🇬🇦', name: 'Gabon' }, { flag: '🇬🇲', name: 'Gambia' },
  { flag: '🇬🇪', name: 'Georgia' }, { flag: '🇩🇪', name: 'Germany' }, { flag: '🇬🇭', name: 'Ghana' },
  { flag: '🇬🇷', name: 'Greece' }, { flag: '🇬🇩', name: 'Grenada' }, { flag: '🇬🇹', name: 'Guatemala' },
  { flag: '🇬🇳', name: 'Guinea' }, { flag: '🇬🇾', name: 'Guyana' }, { flag: '🇭🇹', name: 'Haiti' },
  { flag: '🇭🇳', name: 'Honduras' }, { flag: '🇭🇺', name: 'Hungary' }, { flag: '🇮🇸', name: 'Iceland' },
  { flag: '🇮🇳', name: 'India' }, { flag: '🇮🇩', name: 'Indonesia' }, { flag: '🇮🇷', name: 'Iran' },
  { flag: '🇮🇶', name: 'Iraq' }, { flag: '🇮🇪', name: 'Ireland' }, { flag: '🇮🇱', name: 'Israel' },
  { flag: '🇮🇹', name: 'Italy' }, { flag: '🇯🇲', name: 'Jamaica' }, { flag: '🇯🇵', name: 'Japan' },
  { flag: '🇯🇴', name: 'Jordan' }, { flag: '🇰🇿', name: 'Kazakhstan' }, { flag: '🇰🇪', name: 'Kenya' },
  { flag: '🇰🇼', name: 'Kuwait' }, { flag: '🇰🇬', name: 'Kyrgyzstan' }, { flag: '🇱🇦', name: 'Laos' },
  { flag: '🇱🇻', name: 'Latvia' }, { flag: '🇱🇧', name: 'Lebanon' }, { flag: '🇱🇾', name: 'Libya' },
  { flag: '🇱🇮', name: 'Liechtenstein' }, { flag: '🇱🇹', name: 'Lithuania' }, { flag: '🇱🇺', name: 'Luxembourg' },
  { flag: '🇲🇬', name: 'Madagascar' }, { flag: '🇲🇾', name: 'Malaysia' }, { flag: '🇲🇻', name: 'Maldives' },
  { flag: '🇲🇱', name: 'Mali' }, { flag: '🇲🇹', name: 'Malta' }, { flag: '🇲🇽', name: 'Mexico' },
  { flag: '🇲🇨', name: 'Monaco' }, { flag: '🇲🇳', name: 'Mongolia' }, { flag: '🇲🇪', name: 'Montenegro' },
  { flag: '🇲🇦', name: 'Morocco' }, { flag: '🇲🇿', name: 'Mozambique' }, { flag: '🇲🇲', name: 'Myanmar' },
  { flag: '🇳🇦', name: 'Namibia' }, { flag: '🇳🇵', name: 'Nepal' }, { flag: '🇳🇱', name: 'Netherlands' },
  { flag: '🇳🇿', name: 'New Zealand' }, { flag: '🇳🇮', name: 'Nicaragua' }, { flag: '🇳🇪', name: 'Niger' },
  { flag: '🇳🇬', name: 'Nigeria' }, { flag: '🇰🇵', name: 'North Korea' }, { flag: '🇳🇴', name: 'Norway' },
  { flag: '🇴🇲', name: 'Oman' }, { flag: '🇵🇰', name: 'Pakistan' }, { flag: '🇵🇦', name: 'Panama' },
  { flag: '🇵🇾', name: 'Paraguay' }, { flag: '🇵🇪', name: 'Peru' }, { flag: '🇵🇭', name: 'Philippines' },
  { flag: '🇵🇱', name: 'Poland' }, { flag: '🇵🇹', name: 'Portugal' }, { flag: '🇶🇦', name: 'Qatar' },
  { flag: '🇷🇴', name: 'Romania' }, { flag: '🇷🇺', name: 'Russia' }, { flag: '🇷🇼', name: 'Rwanda' },
  { flag: '🇸🇦', name: 'Saudi Arabia' }, { flag: '🇸🇳', name: 'Senegal' }, { flag: '🇷🇸', name: 'Serbia' },
  { flag: '🇸🇱', name: 'Sierra Leone' }, { flag: '🇸🇬', name: 'Singapore' }, { flag: '🇸🇰', name: 'Slovakia' },
  { flag: '🇸🇮', name: 'Slovenia' }, { flag: '🇸🇴', name: 'Somalia' }, { flag: '🇿🇦', name: 'South Africa' },
  { flag: '🇰🇷', name: 'South Korea' }, { flag: '🇪🇸', name: 'Spain' }, { flag: '🇱🇰', name: 'Sri Lanka' },
  { flag: '🇸🇩', name: 'Sudan' }, { flag: '🇸🇷', name: 'Suriname' }, { flag: '🇸🇪', name: 'Sweden' },
  { flag: '🇨🇭', name: 'Switzerland' }, { flag: '🇸🇾', name: 'Syria' }, { flag: '🇹🇼', name: 'Taiwan' },
  { flag: '🇹🇯', name: 'Tajikistan' }, { flag: '🇹🇿', name: 'Tanzania' }, { flag: '🇹🇭', name: 'Thailand' },
  { flag: '🇹🇬', name: 'Togo' }, { flag: '🇹🇹', name: 'Trinidad & Tobago' }, { flag: '🇹🇳', name: 'Tunisia' },
  { flag: '🇹🇷', name: 'Turkey' }, { flag: '🇹🇲', name: 'Turkmenistan' }, { flag: '🇺🇬', name: 'Uganda' },
  { flag: '🇺🇦', name: 'Ukraine' }, { flag: '🇦🇪', name: 'United Arab Emirates' },
  { flag: '🇬🇧', name: 'United Kingdom' }, { flag: '🇺🇸', name: 'United States' },
  { flag: '🇺🇾', name: 'Uruguay' }, { flag: '🇺🇿', name: 'Uzbekistan' }, { flag: '🇻🇪', name: 'Venezuela' },
  { flag: '🇻🇳', name: 'Vietnam' }, { flag: '🇾🇪', name: 'Yemen' }, { flag: '🇿🇲', name: 'Zambia' },
  { flag: '🇿🇼', name: 'Zimbabwe' },
];

const GENDERS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];
const ENGLISH_LEVELS = ['Beginner', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced', 'Fluent', 'Native'];

export default function ProfileScreen() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState('');
  const [englishLevel, setEnglishLevel] = useState('');
  const [interests, setInterests] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showEnglishPicker, setShowEnglishPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const currentUid = auth.currentUser?.uid;
  const email = auth.currentUser?.email || '';

  useEffect(() => {
    if (!currentUid) return;
    const userRef = ref(realtimeDb, `Users/${currentUid}`);
    const handleData = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUsername(data.username || '');
        setBio(data.bio || '');
        setCountry(data.country || '');
        setGender(data.gender || '');
        setEnglishLevel(data.englishLevel || '');
        setInterests(data.interests || '');
        setProfileImage(data.profileImage || '');
        setAge(data.age || '');
      }
      setLoading(false);
    };
    onValue(userRef, handleData, () => setLoading(false));
    return () => off(userRef, 'value', handleData);
  }, [currentUid]);

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) {
          try { Alert.alert('File too large (max 3MB)'); } catch (_) { window.alert('File too large (max 3MB)'); }
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => setProfileImage(ev.target.result);
        reader.readAsDataURL(file);
      };
      input.click();
    } else {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });
        if (!result.canceled && result.assets?.[0]?.base64) {
          const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
          const sizeInMB = (base64.length * 0.75) / (1024 * 1024);
          if (sizeInMB > 3) {
            try { Alert.alert('File too large (max 3MB)'); } catch (_) { window.alert('File too large (max 3MB)'); }
            return;
          }
          setProfileImage(base64);
        }
      } catch (err) {
        console.error('ImagePicker error:', err);
      }
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await update(ref(realtimeDb, `Users/${currentUid}`), {
        username: username.trim(),
        search: username.trim().toLowerCase(),
        bio: bio.trim(),
        country,
        age: age || '',
        gender,
        englishLevel,
        interests: interests.trim(),
        profileImage: profileImage || 'default',
      });
      Alert.alert('Success', 'Profile updated.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
    : COUNTRIES;

  const avatarLetter = (username || email || '?').charAt(0).toUpperCase();
  const avatarColors = ['#f57c00', '#e91e63', '#9c27b0', '#3f51b5', '#009688', '#4caf50', '#ff5722', '#795348'];
  let avatarHash = 0;
  for (let i = 0; i < (username || '').length; i++) avatarHash = username.charCodeAt(i) + ((avatarHash << 5) - avatarHash);
  const avatarColor = avatarColors[Math.abs(avatarHash) % avatarColors.length];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f57c00" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            {profileImage && profileImage !== 'default' ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            )}
            <View style={styles.cameraBadge}>
              <Icon name="camera" size={16} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Username</Text>
        <View style={styles.inputContainer}>
          <Icon name="account-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Your username"
            placeholderTextColor="#888"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Country</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCountryPicker(true)}>
          <Icon name="earth" size={20} color="#888" style={{ marginRight: 10 }} />
          <Text style={[styles.pickerText, !country && { color: '#888' }]}>
            {country || 'Select your country'}
          </Text>
          <Icon name="chevron-down" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Age</Text>
        <View style={styles.inputContainer}>
          <Icon name="calendar-clock" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={(t) => { const n = t.replace(/[^0-9]/g, ''); if (n === '' || (parseInt(n) > 0 && parseInt(n) <= 150)) setAge(n); }}
            placeholder="Your age"
            placeholderTextColor="#888"
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Gender</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowGenderPicker(true)}>
          <Icon name="gender-male-female" size={20} color="#888" style={{ marginRight: 10 }} />
          <Text style={[styles.pickerText, !gender && { color: '#888' }]}>{gender || 'Select gender'}</Text>
          <Icon name="chevron-down" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>English Level</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowEnglishPicker(true)}>
          <Icon name="school-outline" size={20} color="#888" style={{ marginRight: 10 }} />
          <Text style={[styles.pickerText, !englishLevel && { color: '#888' }]}>{englishLevel || 'Select English level'}</Text>
          <Icon name="chevron-down" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Interests</Text>
        <View style={styles.inputContainer}>
          <Icon name="heart-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.interestInput]}
            value={interests}
            onChangeText={setInterests}
            placeholder="e.g. Music, Travel, Sports"
            placeholderTextColor="#888"
            multiline
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Bio</Text>
        <View style={styles.inputContainer}>
          <Icon name="card-text-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell something about yourself"
            placeholderTextColor="#888"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputContainer}>
          <Icon name="email-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: '#666' }]}
            value={email}
            editable={false}
          />
        </View>
        <Text style={styles.hint}>Email cannot be changed</Text>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon name="check" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal visible={showCountryPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearch}>
              <Icon name="magnify" size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search country..."
                placeholderTextColor="#888"
                value={countrySearch}
                onChangeText={setCountrySearch}
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={item => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, item.name === country && styles.modalItemActive]}
                  onPress={() => { setCountry(`${item.flag} ${item.name}`); setShowCountryPicker(false); setCountrySearch(''); }}
                >
                  <Text style={styles.modalItemFlag}>{item.flag}</Text>
                  <Text style={[styles.modalItemText, item.name === country && { color: '#f57c00' }]}>{item.name}</Text>
                  {item.name === country ? <Icon name="check" size={18} color="#f57c00" /> : null}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showGenderPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.modalItem, g === gender && styles.modalItemActive]}
                onPress={() => { setGender(g); setShowGenderPicker(false); }}
              >
                <Icon name={g === 'Male' ? 'gender-male' : g === 'Female' ? 'gender-female' : 'gender-transgender'} size={20} color={g === gender ? '#f57c00' : '#ccc'} style={{ marginRight: 12 }} />
                <Text style={[styles.modalItemText, g === gender && { color: '#f57c00' }]}>{g}</Text>
                {g === gender ? <Icon name="check" size={18} color="#f57c00" /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showEnglishPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select English Level</Text>
              <TouchableOpacity onPress={() => setShowEnglishPicker(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {ENGLISH_LEVELS.map(level => (
              <TouchableOpacity
                key={level}
                style={[styles.modalItem, level === englishLevel && styles.modalItemActive]}
                onPress={() => { setEnglishLevel(level); setShowEnglishPicker(false); }}
              >
                <Icon name="school-outline" size={20} color={level === englishLevel ? '#f57c00' : '#ccc'} style={{ marginRight: 12 }} />
                <Text style={[styles.modalItemText, level === englishLevel && { color: '#f57c00' }]}>{level}</Text>
                {level === englishLevel ? <Icon name="check" size={18} color="#f57c00" /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 12, position: 'relative' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f57c00', justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#1E1E1E',
  },
  email: { color: '#888', fontSize: 14 },
  fieldGroup: { marginBottom: 20 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#2C2C2C', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#3A3A3A' },
  inputIcon: { marginTop: 14, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#fff', height: 48 },
  bioInput: { height: 80, paddingTop: 14, paddingBottom: 14 },
  interestInput: { height: 60, paddingTop: 14, paddingBottom: 14 },
  pickerButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C',
    height: 54, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#3A3A3A',
  },
  pickerText: { flex: 1, fontSize: 15, color: '#fff' },
  hint: { color: '#666', fontSize: 11, marginTop: 6, marginLeft: 4 },
  saveButton: {
    flexDirection: 'row', backgroundColor: '#f57c00', height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
    shadowColor: '#f57c00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  saveButtonText: { fontWeight: '700', color: '#fff', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C',
    margin: 12, borderRadius: 12, paddingHorizontal: 12, height: 42,
  },
  modalSearchInput: { flex: 1, fontSize: 14, color: '#fff', height: '100%' },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#2C2C2C',
  },
  modalItemActive: { backgroundColor: 'rgba(245,124,0,0.08)' },
  modalItemFlag: { fontSize: 22, marginRight: 14 },
  modalItemText: { flex: 1, color: '#fff', fontSize: 16 },
});
