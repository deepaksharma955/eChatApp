import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, ActivityIndicator, Alert, Text, StyleSheet, AppState, Platform, TouchableOpacity } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, realtimeDb } from './firebase';
import { ref, update, onValue, get } from 'firebase/database';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from './notifications';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ChatScreen from './screens/ChatScreen';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import ProfileScreen from './screens/ProfileScreen';
import FriendRequestsScreen from './screens/FriendRequestsScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import GroupChatScreen from './screens/GroupChatScreen';
import AddMemberScreen from './screens/AddMemberScreen';
import JoinGroupScreen from './screens/JoinGroupScreen';
import DiscoverGroupsScreen from './screens/DiscoverGroupsScreen';
import AdminScreen from './screens/AdminScreen';
import AIFeaturesScreen from './screens/AIFeaturesScreen';
import GrammarScreen from './screens/GrammarScreen';
import AIChatScreen from './screens/AIChatScreen';
import TranslationScreen from './screens/TranslationScreen';
import SpeakingCoachScreen from './screens/SpeakingCoachScreen';
import PronunciationScreen from './screens/PronunciationScreen';
import VocabularyScreen from './screens/VocabularyScreen';
import ChallengesScreen from './screens/ChallengesScreen';
import ProgressScreen from './screens/ProgressScreen';
import VoiceChatScreen from './screens/VoiceChatScreen';
import VideoCallScreen from './screens/VideoCallScreen';
import ChatRoomsScreen from './screens/ChatRoomsScreen';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const AuthenticatedUserContext = createContext({});

const AuthenticatedUserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navRef = useRef(null);
  return (
    <AuthenticatedUserContext.Provider value={{ user, setUser, isAdmin, setIsAdmin, navRef }}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
};

function CustomDrawerContent(props) {
  const { navRef } = useContext(AuthenticatedUserContext);

  const handleLogout = () => {
    if (auth.currentUser) {
      update(ref(realtimeDb, `Users/${auth.currentUser.uid}`), { status: 'offline' });
    }
    signOut(auth).catch(error => Alert.alert('Error', error.message));
  };

  const goToAdmin = () => {
    props.navigation.navigate('Admin');
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{flexGrow: 1, backgroundColor: '#1A1A1A'}}>
      <View style={{flex: 1}}>
        <View style={styles.drawerHeader}>
          <View style={styles.drawerAvatar}>
            <Icon name="account" size={40} color="#fff" />
          </View>
          <Text style={styles.drawerUserName}>{auth?.currentUser?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.drawerUserEmail}>{auth?.currentUser?.email || ''}</Text>
        </View>
        <View style={styles.drawerDivider} />
        <DrawerItemList {...props} />
        <TouchableOpacity style={styles.drawerCustomItem} onPress={goToAdmin}>
          <Icon name="shield-account" color="#f57c00" size={22} style={{ width: 40, textAlign: 'center' }} />
          <Text style={styles.drawerCustomLabel}>Admin Panel</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.drawerBottom}>
        <DrawerItem 
          label="Logout" 
          labelStyle={{ color: '#ff5252', fontWeight: '600', fontSize: 15 }}
          icon={() => <Icon name="logout" color="#ff5252" size={22} />}
          onPress={handleLogout} 
        />
      </View>
    </DrawerContentScrollView>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#1E1E1E', shadowColor: 'transparent', elevation: 0 },
        headerTintColor: '#f57c00',
        headerTitleStyle: { fontWeight: '600', fontSize: 17, color: '#fff' },
        drawerStyle: { backgroundColor: '#1A1A1A', width: 280 },
        drawerActiveTintColor: '#f57c00',
        drawerActiveBackgroundColor: 'rgba(245,124,0,0.1)',
        drawerInactiveTintColor: '#ccc',
        drawerItemStyle: { borderRadius: 12, marginHorizontal: 12, marginVertical: 2 },
        drawerLabelStyle: { fontSize: 15, fontWeight: '500' },
      }}
    >
      <Drawer.Screen name="Chats" component={HomeScreen} options={{ title: 'Messages', drawerIcon: ({color}) => <Icon name="chat" size={22} color={color} /> }} />
      <Drawer.Screen name="Search" component={SearchScreen} options={{ title: 'Find Contacts', drawerIcon: ({color}) => <Icon name="account-search" size={22} color={color} /> }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile', drawerIcon: ({color}) => <Icon name="account-circle" size={22} color={color} /> }} />
      <Drawer.Screen name="FriendRequests" component={FriendRequestsScreen} options={{ title: 'Friend Requests', drawerIcon: ({color}) => <Icon name="bell" size={22} color={color} /> }} />
      <Drawer.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'New Group', drawerIcon: ({color}) => <Icon name="account-group" size={22} color={color} /> }} />
      <Drawer.Screen name="JoinGroup" component={JoinGroupScreen} options={{ title: 'Join Group', drawerIcon: ({color}) => <Icon name="link-variant" size={22} color={color} /> }} />
      <Drawer.Screen name="DiscoverGroups" component={DiscoverGroupsScreen} options={{ title: 'Discover Groups', drawerIcon: ({color}) => <Icon name="account-search" size={22} color={color} /> }} />
      <Drawer.Screen name="AIFeatures" component={AIFeaturesScreen} options={{ title: 'AI Learning', drawerIcon: ({color}) => <Icon name="lightbulb-on" size={22} color={color} /> }} />
      <Drawer.Screen name="ChatRooms" component={ChatRoomsScreen} options={{ title: 'Chat Rooms', drawerIcon: ({color}) => <Icon name="forum" size={22} color={color} /> }} />
    </Drawer.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Drawer" component={DrawerNavigator} />
      <Stack.Screen 
        name="Admin" 
        component={AdminScreen} 
        options={{
          headerShown: true,
          title: 'Admin Panel',
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#f57c00',
          headerTitleStyle: { fontWeight: 'bold', color: '#fff' },
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#f57c00',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="GroupChat" 
        component={GroupChatScreen} 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#f57c00',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="AddMember" 
        component={AddMemberScreen} 
        options={{
          headerShown: true,
          title: 'Add Members',
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#f57c00',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen name="Grammar" component={GrammarScreen} options={{ headerShown: true, title: 'Grammar Correction', headerStyle: { backgroundColor: '#1E1E1E' }, headerTintColor: '#f57c00', headerTitleStyle: { fontWeight: 'bold' } }} />
      <Stack.Screen name="AIChat" component={AIChatScreen} options={{ headerShown: true, title: 'AI Conversation', headerStyle: { backgroundColor: '#1E1E1E' }, headerTintColor: '#f57c00', headerTitleStyle: { fontWeight: 'bold' } }} />
      <Stack.Screen name="Translation" component={TranslationScreen} options={{ headerShown: true, title: 'Translation', headerStyle: { backgroundColor: '#1E1E1E' }, headerTintColor: '#f57c00', headerTitleStyle: { fontWeight: 'bold' } }} />
      <Stack.Screen name="SpeakingCoach" component={SpeakingCoachScreen} options={{ headerShown: true, title: 'Speaking Coach', headerStyle: { backgroundColor: '#1E1E1E' }, headerTintColor: '#f57c00', headerTitleStyle: { fontWeight: 'bold' } }} />
      <Stack.Screen name="Pronunciation" component={PronunciationScreen} options={{ headerShown: true, title: 'Pronunciation', headerStyle: { backgroundColor: '#1E1E1E' }, headerTintColor: '#f57c00', headerTitleStyle: { fontWeight: 'bold' } }} />
      <Stack.Screen name="Vocabulary" component={VocabularyScreen} options={{ headerShown: true, title: 'Daily Vocabulary', headerStyle: { backgroundColor: '#1E1E1E' }, headerTintColor: '#f57c00', headerTitleStyle: { fontWeight: 'bold' } }} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} options={{ headerShown: true, title: 'English Challenges', headerStyle: { backgroundColor: '#1E1E1E' }, headerTintColor: '#f57c00', headerTitleStyle: { fontWeight: 'bold' } }} />
      <Stack.Screen name="Progress" component={ProgressScreen} options={{ headerShown: true, title: 'Progress Dashboard', headerStyle: { backgroundColor: '#1E1E1E' }, headerTintColor: '#f57c00', headerTitleStyle: { fontWeight: 'bold' } }} />
      <Stack.Screen name="VoiceChat" component={VoiceChatScreen} options={{ headerShown: true, title: 'Voice Chat', headerStyle: { backgroundColor: '#1E1E1E' }, headerTintColor: '#f57c00', headerTitleStyle: { fontWeight: 'bold' } }} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ headerShown: true, title: 'Video Calling', headerStyle: { backgroundColor: '#1E1E1E' }, headerTintColor: '#f57c00', headerTitleStyle: { fontWeight: 'bold' } }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, setUser, setIsAdmin, navRef } = useContext(AuthenticatedUserContext);
  const [isLoading, setIsLoading] = useState(true);
  const notificationResponseListener = useRef(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async authenticatedUser => {
      if (authenticatedUser) {
        const blockedSnap = await get(ref(realtimeDb, `BlockedUsers/${authenticatedUser.uid}`));
        if (blockedSnap.exists()) {
          if (Platform.OS === 'web') {
            window.alert('Access Denied\nYour account has been blocked.');
          } else {
            try { Alert.alert('Access Denied', 'Your account has been blocked.'); } catch (_) {}
          }
          await signOut(auth);
          setUser(null);
          setIsLoading(false);
          return;
        }
        setUser(authenticatedUser);
        if (Platform.OS !== 'web') {
          registerForPushNotifications();
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const userRef = ref(realtimeDb, `Users/${uid}`);
    const adminRef = ref(realtimeDb, `Users/${uid}/isAdmin`);
    update(userRef, { status: 'online', lastSeen: Date.now().toString() }).catch(() => {});

    const adminUnsub = onValue(adminRef, (snap) => {
      const val = snap.val();
      setIsAdmin(val === true || val === 'true');
    });

    const blockedRef = ref(realtimeDb, `BlockedUsers/${uid}`);
    const blockedUnsub = onValue(blockedRef, (snap) => {
      if (snap.exists()) {
        if (Platform.OS === 'web') {
          window.alert('Access Denied\nYour account has been blocked.');
        } else {
          try { Alert.alert('Access Denied', 'Your account has been blocked.'); } catch (_) {}
        }
        signOut(auth).catch(() => {});
      }
    });

    const handleAppState = (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        update(userRef, { status: 'offline', lastSeen: Date.now().toString() }).catch(() => {});
      } else if (nextState === 'active') {
        update(userRef, { status: 'online', lastSeen: Date.now().toString() }).catch(() => {});
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      subscription.remove();
      adminUnsub();
      blockedUnsub();
      update(userRef, { status: 'offline', lastSeen: Date.now().toString() }).catch(() => {});
    };
  }, [user]);

  useEffect(() => {
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.chatId && navRef.current) {
        if (data.isGroup) {
          navRef.current.navigate('GroupChat', { groupId: data.chatId });
        } else {
          navRef.current.navigate('Chat', { roomId: data.chatId, roomName: data.senderName || 'Chat' });
        }
      }
    });
    return () => {
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E1E' }}>
        <ActivityIndicator size="large" color="#f57c00" />
      </View>
    );
  }

  const isWeb = Platform.OS === 'web';

  return (
    <View style={isWeb ? styles.webContainer : { flex: 1 }}>
      {isWeb ? <View style={styles.webFrame}>
        <NavigationContainer ref={navRef}>
          {user ? <MainStack /> : <AuthStack />}
        </NavigationContainer>
      </View> : (
        <NavigationContainer ref={navRef}>
          {user ? <MainStack /> : <AuthStack />}
        </NavigationContainer>
      )}
    </View>
  );
}

export default function App() {
  return (
    <AuthenticatedUserProvider>
      <RootNavigator />
    </AuthenticatedUserProvider>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  drawerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f57c00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  drawerUserName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  drawerUserEmail: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  drawerCustomItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 28,
    marginHorizontal: 12, marginVertical: 2, borderRadius: 12,
    backgroundColor: 'rgba(245,124,0,0.1)',
  },
  drawerCustomLabel: {
    color: '#f57c00', fontSize: 15, fontWeight: '600',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#2C2C2C',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  drawerBottom: {
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
    paddingTop: 8,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webFrame: {
    width: '100%',
    maxWidth: 480,
    height: '100%',
    maxHeight: 900,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#2C2C2C',
  },
});

