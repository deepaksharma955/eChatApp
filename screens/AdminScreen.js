import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { ref, onValue, off, update, remove, get, query, orderByChild, push, set } from 'firebase/database';
import { auth, realtimeDb } from '../firebase';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const TABS = ['Dashboard', 'Reports', 'Users', 'Messages'];

export default function AdminScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const currentUid = auth.currentUser?.uid;
  const loadedRef = useRef({ reports: false, users: false, chats: false, groups: false, blocked: false });

  const onDataLoaded = (key) => {
    loadedRef.current[key] = true;
    if (Object.values(loadedRef.current).every(Boolean)) setLoading(false);
  };

  useEffect(() => {
    const reportsRef = ref(realtimeDb, 'Reports');
    const handleReports = (snap) => {
      const list = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
      }
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setReports(list);
      if (!loadedRef.current.reports) onDataLoaded('reports');
    };
    onValue(reportsRef, handleReports);
    return () => off(reportsRef, 'value', handleReports);
  }, []);

  useEffect(() => {
    const usersRef = ref(realtimeDb, 'Users');
    const handleUsers = (snap) => {
      const list = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          list.push({ uid: child.key, ...child.val() });
        });
      }
      setUsers(list);
      if (!loadedRef.current.users) onDataLoaded('users');
    };
    onValue(usersRef, handleUsers);
    return () => off(usersRef, 'value', handleUsers);
  }, []);

  useEffect(() => {
    const chatsRef = ref(realtimeDb, 'Chats');
    const unsub = onValue(chatsRef, (snap) => {
      let count = 0;
      if (snap.exists()) snap.forEach(() => count++);
      setTotalMessages(count);
      if (!loadedRef.current.chats) onDataLoaded('chats');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const groupsRef = ref(realtimeDb, 'Groups');
    const unsub = onValue(groupsRef, (snap) => {
      let count = 0;
      if (snap.exists()) snap.forEach(() => count++);
      setTotalGroups(count);
      if (!loadedRef.current.groups) onDataLoaded('groups');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const blockedRef = ref(realtimeDb, 'BlockedUsers');
    const unsub = onValue(blockedRef, (snap) => {
      const list = [];
      if (snap.exists()) snap.forEach((child) => list.push(child.key));
      setBlockedUsers(list);
      if (!loadedRef.current.blocked) onDataLoaded('blocked');
    });
    return () => unsub();
  }, []);

  const updateReportStatus = (reportId, status) => {
    update(ref(realtimeDb, `Reports/${reportId}`), { status }).catch(err => console.error(err));
    setSelectedReport(null);
  };

  const toggleBlockUser = (uid, userName, currentlyBlocked) => {
    const act = currentlyBlocked ? 'unblock' : 'block';
    const confirmMsg = `${act} user "${userName || uid}"?`;
    const doBlockAction = () => {
      if (currentlyBlocked) {
        remove(ref(realtimeDb, `BlockedUsers/${uid}`)).catch(() => {});
      } else {
        set(ref(realtimeDb, `BlockedUsers/${uid}`), true).catch(() => {});
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) doBlockAction();
      return;
    }
    try {
      Alert.alert('Confirm', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        { text: act.charAt(0).toUpperCase() + act.slice(1), style: 'destructive', onPress: doBlockAction },
      ]);
    } catch (_) {
      if (window.confirm(confirmMsg)) doBlockAction();
    }
  };

  const deleteMessageAsAdmin = (msgId, reportId) => {
    const confirmMsg = 'Delete this message permanently?';
    try {
      Alert.alert('Confirm', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await update(ref(realtimeDb, `Chats/${msgId}`), {
              message: 'This message was deleted by admin',
              deleted: true,
              type: null,
              image: null,
              fileData: null,
              fileName: null,
              fileType: null,
            });
            if (reportId) updateReportStatus(reportId, 'resolved');
            Alert.alert('Done', 'Message deleted.');
          } catch (e) { console.error(e); }
        }},
      ]);
    } catch (_) {
      if (window.confirm(confirmMsg)) {
        update(ref(realtimeDb, `Chats/${msgId}`), {
          message: 'This message was deleted by admin',
          deleted: true,
          type: null,
          image: null,
          fileData: null,
          fileName: null,
          fileType: null,
        }).then(() => {
          if (reportId) updateReportStatus(reportId, 'resolved');
        }).catch(() => {});
      }
    }
  };

  const usersWithBlocked = users.map(u => ({ ...u, blocked: blockedUsers.includes(u.uid) }));
  const filteredUsers = searchQuery.trim()
    ? usersWithBlocked.filter(u =>
        (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : usersWithBlocked;

  const renderReportItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedReport(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeContainer}>
          <View style={[styles.statusBadge, {
            backgroundColor: item.status === 'pending' ? '#f57c00' : item.status === 'resolved' ? '#4caf50' : '#666'
          }]}>
            <Text style={styles.statusText}>{item.status || 'pending'}</Text>
          </View>
        </View>
        <Text style={styles.cardDate}>{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ''}</Text>
      </View>
      <Text style={styles.cardTitle}>Reported: {item.reportedName || item.reportedUid}</Text>
      <Text style={styles.cardSub}>By: {item.reporterName || item.reporterUid}</Text>
      <Text style={styles.cardBody} numberOfLines={2}>Reason: {item.reason || 'N/A'}</Text>
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={[styles.userAvatar, { backgroundColor: getAvatarColor(item.username) }]}>
          <Text style={styles.userAvatarText}>{(item.username || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.username || 'Unknown'}</Text>
          <Text style={styles.userEmail}>{item.email || ''}</Text>
          <Text style={styles.userMeta}>{item.country || ''} {item.age ? `· ${item.age}y` : ''}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.blockBtn, item.blocked && { backgroundColor: '#4caf50' }]}
        onPress={() => toggleBlockUser(item.uid, item.username, item.blocked)}
      >
        <Text style={styles.blockBtnText}>{item.blocked ? 'Unblock' : 'Block'}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f57c00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {tab === 'Reports' && reports.filter(r => r.status === 'pending').length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{reports.filter(r => r.status === 'pending').length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Dashboard' && (
        <DashboardTab
          totalUsers={users.length}
          totalMessages={totalMessages}
          totalGroups={totalGroups}
          pendingReports={reports.filter(r => r.status === 'pending').length}
          resolvedReports={reports.filter(r => r.status === 'resolved').length}
          dismissedReports={reports.filter(r => r.status === 'dismissed').length}
          blockedCount={blockedUsers.length}
          onlineUsers={users.filter(u => u.status === 'online').length}
          offlineUsers={users.filter(u => u.status === 'offline' || !u.status).length}
          onCardPress={setActiveTab}
        />
      )}

      {activeTab === 'Reports' && (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>No reports yet</Text>}
        />
      )}

      {activeTab === 'Users' && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBar}>
            <Icon name="magnify" size={20} color="#888" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username or email..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item.uid}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.empty}>No users found</Text>}
          />
        </View>
      )}

      {activeTab === 'Messages' && (
        <MessagesTab currentUid={currentUid} />
      )}

      <Modal visible={!!selectedReport} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedReport && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Report Details</Text>
                  <TouchableOpacity onPress={() => setSelectedReport(null)}>
                    <Icon name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  <Text style={styles.detailLabel}>Reported User</Text>
                  <Text style={styles.detailValue}>{selectedReport.reportedName || selectedReport.reportedUid}</Text>

                  <Text style={styles.detailLabel}>Reported By</Text>
                  <Text style={styles.detailValue}>{selectedReport.reporterName || selectedReport.reporterUid}</Text>

                  <Text style={styles.detailLabel}>Reason</Text>
                  <Text style={styles.detailValue}>{selectedReport.reason || 'N/A'}</Text>

                  {selectedReport.messageText && (
                    <>
                      <Text style={styles.detailLabel}>Reported Message</Text>
                      <Text style={styles.detailValue}>{selectedReport.messageText}</Text>
                    </>
                  )}

                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {selectedReport.timestamp ? new Date(selectedReport.timestamp).toLocaleString() : 'N/A'}
                  </Text>

                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { color: selectedReport.status === 'pending' ? '#f57c00' : selectedReport.status === 'resolved' ? '#4caf50' : '#888' }]}>
                    {selectedReport.status || 'pending'}
                  </Text>
                </View>
                <View style={styles.modalActions}>
                  {selectedReport.messageId && (
                    <TouchableOpacity style={styles.actionBtnDanger} onPress={() => deleteMessageAsAdmin(selectedReport.messageId, selectedReport.id)}>
                      <Icon name="delete" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>Delete Message</Text>
                    </TouchableOpacity>
                  )}
                  {selectedReport.status === 'pending' && (
                    <>
                      <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => updateReportStatus(selectedReport.id, 'resolved')}>
                        <Icon name="check" size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>Resolve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => updateReportStatus(selectedReport.id, 'dismissed')}>
                        <Icon name="close" size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>Dismiss</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MessagesTab({ currentUid }) {
  const [msgSearch, setMsgSearch] = useState('');
  const [msgResults, setMsgResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchMessages = useCallback(async () => {
    if (!msgSearch.trim()) return;
    setSearching(true);
    try {
      const snap = await get(ref(realtimeDb, 'Chats'));
      const results = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          const data = child.val();
          if (data.message && data.message.toLowerCase().includes(msgSearch.toLowerCase())) {
            results.push({ id: child.key, ...data });
          }
        });
      }
      results.sort((a, b) => (b.time || 0) - (a.time || 0));
      setMsgResults(results.slice(0, 50));
    } catch (e) {
      console.error(e);
    }
    setSearching(false);
  }, [msgSearch]);

  const deleteMsg = (msgId) => {
    const doDelete = () => {
      update(ref(realtimeDb, `Chats/${msgId}`), {
        message: 'This message was deleted by admin',
        deleted: true,
        type: null,
        image: null,
        fileData: null,
        fileName: null,
        fileType: null,
      }).catch(() => {});
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this message?')) doDelete();
      return;
    }
    try {
      Alert.alert('Delete Message', 'Delete this message?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    } catch (_) {
      if (window.confirm('Delete this message?')) doDelete();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search message text..."
          placeholderTextColor="#888"
          value={msgSearch}
          onChangeText={setMsgSearch}
          onSubmitEditing={searchMessages}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={searchMessages} style={{ padding: 8 }}>
          {searching ? <ActivityIndicator size="small" color="#f57c00" /> : <Icon name="magnify" size={22} color="#f57c00" />}
        </TouchableOpacity>
      </View>
      <FlatList
        data={msgResults}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const showMsgDetail = () => {
            const msg = `From: ${item.senderName || item.sender}\nDate: ${item.time ? new Date(parseInt(item.time)).toLocaleString() : 'N/A'}\n\n${item.message || '(no text)'}`;
            if (Platform.OS === 'web') {
              window.alert(msg);
            } else {
              try { Alert.alert('Message Details', msg); } catch (_) {}
            }
          };
          return (
            <TouchableOpacity style={styles.msgCard} onPress={showMsgDetail} activeOpacity={0.7}>
              <View style={styles.msgHeader}>
                <Text style={styles.msgSender}>{item.senderName || item.sender}</Text>
                <Text style={styles.msgDate}>{item.time ? new Date(parseInt(item.time)).toLocaleDateString() : ''}</Text>
              </View>
              <Text style={styles.msgText} numberOfLines={2}>{item.message || '(no text)'}</Text>
              <View style={styles.msgActions}>
                <TouchableOpacity style={styles.deleteMsgBtn} onPress={() => deleteMsg(item.id)}>
                  <Icon name="delete-outline" size={18} color="#ff5252" />
                  <Text style={styles.deleteMsgText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>{msgSearch ? 'No messages found' : 'Search messages above'}</Text>}
      />
    </View>
  );
}

function DashboardTab({ totalUsers, totalMessages, totalGroups, pendingReports, resolvedReports, dismissedReports, blockedCount, onlineUsers, offlineUsers, onCardPress }) {
  const cards = [
    { label: 'Total Users', value: totalUsers, icon: 'account-group', color: '#3f51b5', tab: 'Users' },
    { label: 'Messages Sent', value: totalMessages, icon: 'message-text', color: '#009688', tab: null },
    { label: 'Pending Reports', value: pendingReports, icon: 'alert-circle', color: '#f57c00', tab: 'Reports' },
    { label: 'Total Groups', value: totalGroups, icon: 'account-multiple', color: '#9c27b0', tab: null },
    { label: 'Blocked Users', value: blockedCount, icon: 'block-helper', color: '#ff5252', tab: 'Users' },
  ];

  const barData = [
    { label: 'Online', value: onlineUsers, max: totalUsers || 1, color: '#4caf50' },
    { label: 'Offline', value: offlineUsers, max: totalUsers || 1, color: '#888' },
    { label: 'Blocked', value: blockedCount, max: totalUsers || 1, color: '#ff5252' },
  ];

  const reportBars = [
    { label: 'Pending', value: pendingReports, max: pendingReports + resolvedReports + dismissedReports || 1, color: '#f57c00' },
    { label: 'Resolved', value: resolvedReports, max: pendingReports + resolvedReports + dismissedReports || 1, color: '#4caf50' },
    { label: 'Dismissed', value: dismissedReports, max: pendingReports + resolvedReports + dismissedReports || 1, color: '#888' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.dbHeaderRow}>
        <Icon name="view-dashboard" size={22} color="#f57c00" />
        <Text style={styles.dbHeaderTitle}>Admin Dashboard</Text>
      </View>

      {/* Cards row */}
      <View style={styles.dbCardsRow}>
        {cards.map((card, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.dbCard, { borderLeftColor: card.color }]}
            onPress={() => card.tab && onCardPress(card.tab)}
            activeOpacity={card.tab ? 0.6 : 1}
          >
            <Icon name={card.icon} size={26} color={card.color} />
            <Text style={[styles.dbCardValue, { color: card.color }]}>{card.value}</Text>
            <Text style={styles.dbCardLabel}>{card.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User Status Chart */}
      <View style={styles.dbChartBox}>
        <Text style={styles.dbChartTitle}>
          <Icon name="account-check" size={16} color="#f57c00" /> User Status
        </Text>
        {barData.map((item, idx) => (
          <View key={idx} style={styles.dbBarRow}>
            <Text style={styles.dbBarLabel}>{item.label}</Text>
            <View style={styles.dbBarTrack}>
              <View style={[styles.dbBarFill, { width: `${(item.value / item.max) * 100}%`, backgroundColor: item.color }]} />
            </View>
            <Text style={styles.dbBarValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* Reports Breakdown Chart */}
      {pendingReports + resolvedReports + dismissedReports > 0 && (
        <View style={styles.dbChartBox}>
          <Text style={styles.dbChartTitle}>
            <Icon name="flag" size={16} color="#f57c00" /> Reports Breakdown
          </Text>
          {reportBars.map((item, idx) => (
            <View key={idx} style={styles.dbBarRow}>
              <Text style={styles.dbBarLabel}>{item.label}</Text>
              <View style={styles.dbBarTrack}>
                <View style={[styles.dbBarFill, { width: `${(item.value / item.max) * 100}%`, backgroundColor: item.color }]} />
              </View>
              <Text style={styles.dbBarValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#f57c00', '#e91e63', '#9c27b0', '#3f51b5', '#009688', '#4caf50', '#ff5722', '#795348'];
  return colors[Math.abs(hash) % colors.length];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  center: { flex: 1, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: '#2C2C2C', paddingVertical: 4, paddingHorizontal: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, marginHorizontal: 2 },
  tabActive: { backgroundColor: 'rgba(245,124,0,0.15)' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#f57c00' },
  tabBadge: { backgroundColor: '#f57c00', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 6, paddingHorizontal: 5 },
  tabBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  listContent: { padding: 12, paddingBottom: 40 },
  empty: { color: '#666', textAlign: 'center', marginTop: 60, fontSize: 15 },
  card: { backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#3A3A3A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badgeContainer: { flexDirection: 'row' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardDate: { color: '#888', fontSize: 12 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  cardSub: { color: '#888', fontSize: 13, marginBottom: 4 },
  cardBody: { color: '#aaa', fontSize: 13, lineHeight: 18 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C', margin: 12, borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#3A3A3A' },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', height: '100%' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#3A3A3A' },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  userAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  userDetails: { flex: 1 },
  userName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  userEmail: { color: '#888', fontSize: 12 },
  userMeta: { color: '#666', fontSize: 11, marginTop: 1 },
  blockBtn: { backgroundColor: '#ff5252', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  blockBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalBody: { padding: 20 },
  detailLabel: { color: '#888', fontSize: 12, fontWeight: '600', marginTop: 12, marginBottom: 2, textTransform: 'uppercase' },
  detailValue: { color: '#fff', fontSize: 15, lineHeight: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderTopWidth: 1, borderTopColor: '#2C2C2C', gap: 8 },
  actionBtnPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4caf50', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginLeft: 8 },
  actionBtnSecondary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#666', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginLeft: 8 },
  actionBtnDanger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff5252', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginLeft: 8 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 6 },
  msgCard: { backgroundColor: '#2C2C2C', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#3A3A3A' },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  msgSender: { color: '#f57c00', fontSize: 13, fontWeight: '600' },
  msgDate: { color: '#888', fontSize: 11 },
  msgText: { color: '#ccc', fontSize: 14, lineHeight: 19 },
  msgActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  deleteMsgBtn: { flexDirection: 'row', alignItems: 'center' },
  deleteMsgText: { color: '#ff5252', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  dbHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  dbHeaderTitle: { color: '#f57c00', fontSize: 18, fontWeight: '700', marginLeft: 8 },
  dbCardsRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  dbCard: { width: '31%', backgroundColor: '#2C2C2C', borderRadius: 14, padding: 12, margin: '1%', borderWidth: 1, borderColor: '#3A3A3A', borderLeftWidth: 4, alignItems: 'center' },
  dbCardValue: { fontSize: 24, fontWeight: '800', marginVertical: 4 },
  dbCardLabel: { color: '#aaa', fontSize: 11, textAlign: 'center', fontWeight: '500' },
  dbChartBox: { backgroundColor: '#2C2C2C', borderRadius: 14, padding: 16, marginHorizontal: 12, marginTop: 12, borderWidth: 1, borderColor: '#3A3A3A' },
  dbChartTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  dbBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dbBarLabel: { color: '#ccc', fontSize: 12, width: 60, fontWeight: '500' },
  dbBarTrack: { flex: 1, height: 18, backgroundColor: '#1E1E1E', borderRadius: 9, marginHorizontal: 8, overflow: 'hidden' },
  dbBarFill: { height: '100%', borderRadius: 9 },
  dbBarValue: { color: '#fff', fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
});
