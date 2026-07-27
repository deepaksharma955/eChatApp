import { Platform } from 'react-native';

let RTCModule = null;

async function getRTC() {
  if (Platform.OS === 'web') {
    return {
      RTCPeerConnection: window.RTCPeerConnection,
      RTCSessionDescription: window.RTCSessionDescription,
      RTCIceCandidate: window.RTCIceCandidate,
      mediaDevices: navigator.mediaDevices,
    };
  }
  if (!RTCModule) {
    try { RTCModule = await import('react-native-webrtc'); } catch { return null; }
  }
  if (!RTCModule) return null;
  return {
    RTCPeerConnection: RTCModule.default.RTCPeerConnection,
    RTCSessionDescription: RTCModule.default.RTCSessionDescription,
    RTCIceCandidate: RTCModule.default.RTCIceCandidate,
    mediaDevices: RTCModule.default.mediaDevices,
  };
}

export async function createPeerConnection(iceServers) {
  const rtc = await getRTC();
  if (!rtc) throw new Error('WebRTC not available');
  const pc = new rtc.RTCPeerConnection({
    iceServers: iceServers || [{ urls: 'stun:stun.l.google.com:19302' }],
  });
  return { pc, rtc };
}

export async function getUserMedia(audio, video) {
  const rtc = await getRTC();
  if (!rtc) throw new Error('WebRTC not available');
  return rtc.mediaDevices.getUserMedia({ audio, video });
}

export async function createOffer(pc) {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function createAnswer(pc) {
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export function isCallingSupported() {
  if (Platform.OS === 'web') {
    return !!(window.RTCPeerConnection || window.webkitRTCPeerConnection);
  }
  try { require('react-native-webrtc'); return true; } catch { return false; }
}

export async function createSessionDescription(data) {
  const rtc = await getRTC();
  if (!rtc) throw new Error('WebRTC not available');
  return new rtc.RTCSessionDescription(data);
}

export async function createIceCandidate(data) {
  const rtc = await getRTC();
  if (!rtc) throw new Error('WebRTC not available');
  return new rtc.RTCIceCandidate(data);
}
