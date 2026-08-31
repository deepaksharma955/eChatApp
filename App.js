import 'react-native-gesture-handler';
import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider, useTheme } from './utils/ThemeContext';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, ActivityIndicator, Alert, Text, StyleSheet, AppState, Platform, TouchableOpacity, Share, Linking } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, realtimeDb } from './firebase';
import { ref, update, onValue, get } from 'firebase/database';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications, scheduleDailyVocabularyNotification } from './notifications';
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
import ReadingTestScreen from './screens/ReadingTestScreen';
import StoryAgentScreen from './screens/StoryAgentScreen';
import ChatRoomsScreen from './screens/ChatRoomsScreen';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import UpdateScreen from './screens/UpdateScreen';
import { checkForUpdate } from './utils/versionCheck';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const AuthenticatedUserContext = createContext({});

const ADMIN_EMAIL = 'deepaksharma955@gmail.com';

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
  const { navRef, isAdmin } = useContext(AuthenticatedUserContext);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    if (auth.currentUser) {
      update(ref(realtimeDb, `Users/${auth.currentUser.uid}`), { status: 'offline' });
    }
    signOut(auth).catch(error => Alert.alert('Error', error.message));
  };

  const goToAdmin = () => {
    props.navigation.navigate('Admin');
  };

  const handleShareApp = async () => {
    try {
      const appLink = 'https://play.google.com/store/apps/details?id=com.deepaksharma955.echatapp';
      const message = `Check out eDiscuss - a fun way to chat, make friends, and learn English with AI! ${appLink}`;
      if (Platform.OS === 'web') {
        try {
          await navigator.clipboard.writeText(message);
          Alert.alert('Copied', 'App link copied to clipboard.');
        } catch (_) {
          window.alert(message);
        }
        return;
      }
      await Share.share({ message });
    } catch (_) {}
  };

  const handleRateApp = async () => {
    try {
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.deepaksharma955.echatapp';
      if (Platform.OS === 'web') {
        await Linking.openURL(playStoreUrl);
        return;
      }
      await Linking.openURL(Platform.OS === 'android' ? `market://details?id=com.deepaksharma955.echatapp` : playStoreUrl);
    } catch (_) {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.deepaksharma955.echatapp').catch(() => {});
    }
  };

  return (
      <DrawerContentScrollView {...props} contentContainerStyle={{flexGrow: 1, backgroundColor: theme.surface}}>
      <View style={{flex: 1}}>
        <View style={styles.drawerHeader}>
          <View style={styles.drawerAvatar}>
            <Icon name="account" size={40} color="#fff" />
          </View>
          <Text style={[styles.drawerUserName, { color: theme.text }]}>{auth?.currentUser?.email?.split('@')[0] || 'User'}</Text>
          <Text style={[styles.drawerUserEmail, { color: theme.textSecondary }]}>{auth?.currentUser?.email || ''}</Text>
        </View>
        <View style={[styles.drawerDivider, { backgroundColor: theme.border }]} />
        <DrawerItemList {...props} />
        {isAdmin && (
          <TouchableOpacity style={[styles.drawerCustomItem, { backgroundColor: theme.primaryLight }]} onPress={goToAdmin}>
            <Icon name="shield-account" color={theme.primary} size={22} style={{ width: 40, textAlign: 'center' }} />
            <Text style={[styles.drawerCustomLabel, { color: theme.primary }]}>Admin Panel</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={[styles.drawerBottom, { borderTopColor: theme.border }]}>
        <DrawerItem 
          label={theme.dark ? 'Light Mode' : 'Dark Mode'}
          labelStyle={{ color: theme.text, fontWeight: '600', fontSize: 15 }}
          icon={() => <Icon name={theme.dark ? 'weather-sunny' : 'weather-night'} color={theme.primary} size={22} />}
          onPress={toggleTheme}
        />
        <DrawerItem 
          label="Share App" 
          labelStyle={{ color: theme.text, fontWeight: '600', fontSize: 15 }}
          icon={() => <Icon name="share-variant" color={theme.primary} size={22} />}
          onPress={handleShareApp} 
        />
        <DrawerItem 
          label="Rate Us" 
          labelStyle={{ color: theme.text, fontWeight: '600', fontSize: 15 }}
          icon={() => <Icon name="star" color="#FFD700" size={22} />}
          onPress={handleRateApp} 
        />
        <DrawerItem 
          label="Logout" 
          labelStyle={{ color: theme.error, fontWeight: '600', fontSize: 15 }}
          icon={() => <Icon name="logout" color={theme.error} size={22} />}
          onPress={handleLogout}
        />
      </View>
    </DrawerContentScrollView>
  );
}

function DrawerNavigator() {
  const { theme } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: theme.background, shadowColor: 'transparent', elevation: 0 },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: '600', fontSize: 17, color: theme.text },
        headerLeft: ({ tintColor }) => (
          <TouchableOpacity style={{ marginLeft: 16 }} onPress={() => navigation.toggleDrawer()}>
            <Icon name="menu" size={26} color={tintColor || theme.primary} />
          </TouchableOpacity>
        ),
        drawerStyle: { backgroundColor: theme.surface, width: 280 },
        drawerActiveTintColor: theme.primary,
        drawerActiveBackgroundColor: theme.primaryLight,
        drawerInactiveTintColor: theme.textSecondary,
        drawerItemStyle: { borderRadius: 12, marginHorizontal: 12, marginVertical: 2 },
        drawerLabelStyle: { fontSize: 15, fontWeight: '500' },
      })}
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
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Drawer" component={DrawerNavigator} />
      <Stack.Screen 
        name="Admin" 
        component={AdminScreen} 
        options={{
          headerShown: true,
          title: 'Admin Panel',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.primary,
          headerTitleStyle: { fontWeight: 'bold', color: theme.text },
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.primary,
          headerTitleStyle: { fontWeight: 'bold', color: theme.text },
        }}
      />
      <Stack.Screen 
        name="GroupChat" 
        component={GroupChatScreen} 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.primary,
          headerTitleStyle: { fontWeight: 'bold', color: theme.text },
        }}
      />
      <Stack.Screen 
        name="AddMember" 
        component={AddMemberScreen} 
        options={{
          headerShown: true,
          title: 'Add Members',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.primary,
          headerTitleStyle: { fontWeight: 'bold', color: theme.text },
        }}
      />
      <Stack.Screen name="Grammar" component={GrammarScreen} options={{ headerShown: true, title: 'Grammar Correction', headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.primary, headerTitleStyle: { fontWeight: 'bold', color: theme.text } }} />
      <Stack.Screen name="AIChat" component={AIChatScreen} options={{ headerShown: true, title: 'AI Conversation', headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.primary, headerTitleStyle: { fontWeight: 'bold', color: theme.text } }} />
      <Stack.Screen name="Translation" component={TranslationScreen} options={{ headerShown: true, title: 'Translation', headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.primary, headerTitleStyle: { fontWeight: 'bold', color: theme.text } }} />
      <Stack.Screen name="SpeakingCoach" component={SpeakingCoachScreen} options={{ headerShown: true, title: 'Speaking Coach', headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.primary, headerTitleStyle: { fontWeight: 'bold', color: theme.text } }} />
      <Stack.Screen name="Pronunciation" component={PronunciationScreen} options={{ headerShown: true, title: 'Pronunciation', headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.primary, headerTitleStyle: { fontWeight: 'bold', color: theme.text } }} />
      <Stack.Screen name="Vocabulary" component={VocabularyScreen} options={{ headerShown: true, title: 'Daily Vocabulary', headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.primary, headerTitleStyle: { fontWeight: 'bold', color: theme.text } }} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} options={{ headerShown: true, title: 'English Challenges', headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.primary, headerTitleStyle: { fontWeight: 'bold', color: theme.text } }} />
      <Stack.Screen name="Progress" component={ProgressScreen} options={{ headerShown: true, title: 'Progress Dashboard', headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.primary, headerTitleStyle: { fontWeight: 'bold', color: theme.text } }} />
      <Stack.Screen name="VoiceChat" component={VoiceChatScreen} options={{ headerShown: true, title: 'Voice Chat', headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.primary, headerTitleStyle: { fontWeight: 'bold', color: theme.text } }} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ headerShown: true, title: 'Video Calling', headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.primary, headerTitleStyle: { fontWeight: 'bold', color: theme.text } }} />
      <Stack.Screen name="ReadingTest" component={ReadingTestScreen} options={{ headerShown: true, title: 'Reading Test', headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.primary, headerTitleStyle: { fontWeight: 'bold', color: theme.text } }} />
      <Stack.Screen name="StoryAgent" component={StoryAgentScreen} options={{ headerShown: true, title: 'Story Agents', headerStyle: { backgroundColor: theme.background }, headerTintColor: theme.primary, headerTitleStyle: { fontWeight: 'bold', color: theme.text } }} />
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
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [appUpdate, setAppUpdate] = useState(null);
  const [skippedUpdate, setSkippedUpdate] = useState(false);
  const notificationResponseListener = useRef(null);

  const navigateFromNotification = (data) => {
    if (!data || !navRef.current) return;

    if (data.chatId) {
      const isGroup = data.isGroup === true || data.isGroup === 'true';
      if (isGroup) {
        navRef.current.navigate('GroupChat', { groupId: data.chatId });
      } else {
        navRef.current.navigate('Chat', { roomId: data.chatId, roomName: data.senderName || 'Chat' });
      }
      return;
    }

    const screen = data.screen;
    if (screen === 'Vocabulary') {
      navRef.current.navigate('Vocabulary', { dailyWord: data.word });
    } else if (screen === 'Challenges') {
      navRef.current.navigate('Challenges');
    } else if (screen === 'Progress') {
      navRef.current.navigate('Progress');
    } else if (screen === 'Home' || screen === 'Admin') {
      navRef.current.navigate(screen);
    }
  };

  useEffect(() => {
    checkForUpdate().then((res) => {
      if (res) setAppUpdate(res);
    });
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async authenticatedUser => {
      try {
        if (authenticatedUser) {
          const blockedSnap = await get(ref(realtimeDb, `BlockedUsers/${authenticatedUser.uid}`)).catch(() => null);
          if (blockedSnap && blockedSnap.exists()) {
            if (Platform.OS === 'web') {
              window.alert('Access Denied\nYour account has been blocked.');
            } else {
              try { Alert.alert('Access Denied', 'Your account has been blocked.'); } catch (_) {}
            }
            await signOut(auth);
            setUser(null);
            setIsAdmin(false);
            return;
          }
          setUser(authenticatedUser);
          if (Platform.OS !== 'web') {
            registerForPushNotifications();
            scheduleDailyVocabularyNotification();
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (e) {
        if (authenticatedUser) setUser(authenticatedUser);
        console.warn('Auth init error:', e);
      } finally {
        setIsLoading(false);
      }
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 10000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const userRef = ref(realtimeDb, `Users/${uid}`);
    const adminRef = ref(realtimeDb, `Users/${uid}/isAdmin`);
    update(userRef, { status: 'online', lastSeen: Date.now().toString() }).catch(() => {});

    const adminUnsub = onValue(adminRef, (snap) => {
      const val = snap.val();
      const emailIsOwner = user?.email?.toLowerCase() === ADMIN_EMAIL;
      setIsAdmin(val === true || val === 'true' || emailIsOwner);
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
      if (!navRef.current) return;
      navigateFromNotification(data);
    });

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        const data = response.notification.request.content.data;
        setTimeout(() => {
          if (navRef.current) navigateFromNotification(data);
        }, 1000);
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (appUpdate && !(appUpdate.forced === false && skippedUpdate)) {
    return (
      <UpdateScreen
        storeUrl={appUpdate.storeUrl}
        apkUrl={appUpdate.apkUrl}
        latest={appUpdate.latest}
        current={appUpdate.current}
        forceUpdate={appUpdate.forced}
        changelog={appUpdate.changelog}
        onSkip={appUpdate.forced ? null : () => setSkippedUpdate(true)}
      />
    );
  }

  const isWeb = Platform.OS === 'web';

  return (
    <View style={[isWeb ? styles.webContainer : { flex: 1 }, { backgroundColor: theme.background }]}>
      {isWeb ? <View style={[styles.webFrame, { backgroundColor: theme.background, borderColor: theme.border }]}>
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
    <ErrorBoundary>
      <ThemeProvider>
        <AuthenticatedUserProvider>
          <RootNavigator />
        </AuthenticatedUserProvider>
      </ThemeProvider>
    </ErrorBoundary>
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
    fontSize: 18,
    fontWeight: '700',
  },
  drawerUserEmail: {
    fontSize: 13,
    marginTop: 4,
  },
  drawerCustomItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 28,
    marginHorizontal: 12, marginVertical: 2, borderRadius: 12,
  },
  drawerCustomLabel: {
    fontSize: 15, fontWeight: '600',
  },
  drawerDivider: {
    height: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  drawerBottom: {
    marginBottom: 20,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webFrame: {
    width: '100%',
    maxWidth: 480,
    height: '100%',
    maxHeight: 900,
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
});

