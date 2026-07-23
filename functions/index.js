const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

async function getUserPushToken(uid) {
  const snap = await admin.database().ref(`Users/${uid}/pushToken`).once('value');
  return snap.val();
}

async function sendPushNotification(token, title, body, data) {
  if (!token) return;
  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data,
  };
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.error('Push send error:', err);
  }
}

exports.onNewChatMessage = functions.database.ref('/Chats/{chatId}/{messageId}')
  .onCreate(async (snapshot, context) => {
    const msg = snapshot.val();
    if (!msg) return;

    const chatId = context.params.chatId;
    const receiverToken = await getUserPushToken(chatId);

    if (!receiverToken) return;

    const senderName = msg.senderName || (await getUserEmail(msg.sender)) || 'Someone';
    await sendPushNotification(
      receiverToken,
      senderName,
      msg.text || 'Sent a message',
      { chatId, isGroup: false, senderName }
    );
  });

exports.onNewGroupMessage = functions.database.ref('/GroupMessages/{groupId}/{messageId}')
  .onCreate(async (snapshot, context) => {
    const msg = snapshot.val();
    if (!msg) return;

    const groupId = context.params.groupId;
    const groupSnap = await admin.database().ref(`Groups/${groupId}`).once('value');
    const group = groupSnap.val();
    if (!group || !group.members) return;

    const promises = [];
    Object.keys(group.members).forEach(uid => {
      if (uid !== msg.sender) {
        promises.push(
          getUserPushToken(uid).then(token => {
            if (token) {
              return sendPushNotification(
                token,
                msg.senderName || 'Group',
                msg.text || 'Sent a message',
                { chatId: groupId, isGroup: true, senderName: msg.senderName || 'Group' }
              );
            }
          })
        );
      }
    });
    await Promise.all(promises);
  });

async function getUserEmail(uid) {
  try {
    const snap = await admin.database().ref(`Users/${uid}/useremail`).once('value');
    return snap.val();
  } catch {
    return null;
  }
}
