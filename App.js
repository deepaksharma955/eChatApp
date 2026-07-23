import 'react-native-gesture-handler';
import React, { useState, createContext, useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, ActivityIndicator, Alert, Text, StyleSheet, AppState } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, realtimeDb } from './firebase';
import { ref, update } from 'firebase/database';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
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
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const AuthenticatedUserContext = createContext({});

const AuthenticatedUserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  return (
    <AuthenticatedUserContext.Provider value={{ user, setUser }}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
};

function CustomDrawerContent(props) {
  const handleLogout = () => {
    if (auth.currentUser) {
      update(ref(realtimeDb, `Users/${auth.currentUser.uid}`), { status: 'offline' });
    }
    signOut(auth).catch(error => Alert.alert('Error', error.message));
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{flex: 1, backgroundColor: '#1A1A1A'}}>
      <View style={styles.drawerHeader}>
        <View style={styles.drawerAvatar}>
          <Icon name="account" size={40} color="#fff" />
        </View>
        <Text style={styles.drawerUserName}>{auth?.currentUser?.email?.split('@')[0] || 'User'}</Text>
        <Text style={styles.drawerUserEmail}>{auth?.currentUser?.email || ''}</Text>
      </View>
      <View style={styles.drawerDivider} />
      <DrawerItemList {...props} />
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
        drawerLabelStyle: { fontSize: 15, fontWeight: '500', marginLeft: -16 },
      }}
    >
      <Drawer.Screen name="Chats" component={HomeScreen} options={{ title: 'Messages', drawerIcon: ({color}) => <Icon name="chat" size={22} color={color} /> }} />
      <Drawer.Screen name="Search" component={SearchScreen} options={{ title: 'Find Contacts', drawerIcon: ({color}) => <Icon name="account-search" size={22} color={color} /> }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile', drawerIcon: ({color}) => <Icon name="account-circle" size={22} color={color} /> }} />
      <Drawer.Screen name="FriendRequests" component={FriendRequestsScreen} options={{ title: 'Friend Requests', drawerIcon: ({color}) => <Icon name="bell" size={22} color={color} /> }} />
      <Drawer.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'New Group', drawerIcon: ({color}) => <Icon name="account-group" size={22} color={color} /> }} />
      <Drawer.Screen name="JoinGroup" component={JoinGroupScreen} options={{ title: 'Join Group', drawerIcon: ({color}) => <Icon name="link-variant" size={22} color={color} /> }} />
      <Drawer.Screen name="DiscoverGroups" component={DiscoverGroupsScreen} options={{ title: 'Discover Groups', drawerIcon: ({color}) => <Icon name="account-search" size={22} color={color} /> }} />
    </Drawer.Navigator>
  );
}

function MainStack() {
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = ref(realtimeDb, `Users/${user.uid}`);
    update(userRef, { status: 'online' });

    const handleAppState = (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        update(userRef, { status: 'offline' });
      } else if (nextState === 'active') {
        update(userRef, { status: 'online' });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      subscription.remove();
      update(userRef, { status: 'offline' });
    };
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Drawer" component={DrawerNavigator} />
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
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, setUser } = useContext(AuthenticatedUserContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async authenticatedUser => {
      authenticatedUser ? setUser(authenticatedUser) : setUser(null);
      setIsLoading(false);
    });
    return unsubscribeAuth;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E1E' }}>
        <ActivityIndicator size="large" color="#f57c00" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
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
  drawerDivider: {
    height: 1,
    backgroundColor: '#2C2C2C',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  drawerBottom: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
    paddingTop: 8,
  },
});

