<script setup>
import { ref, onMounted } from 'vue';

const params = location.href.substring(location.href.lastIndexOf('?') + 1)
const _params = {}
params.split('&').forEach((item) => {
  const arr = item.split('=');
  _params[arr[0]] = arr[1];
});
const { id: currentId } = _params

const localVideo = ref(null);
let localStream = ref(null);
const sound = ref(true)
const video = ref(true)
let socket = null
let pc = ref(null)
const remoteVideo = ref(null)
const targetId = ref(null)
const front = ref(false)
const facingMode = ref(null)

function handCall() {
  // 创建一个新rtc连接
  pc = new RTCPeerConnection({})
  // 获取当前所有的音视频流
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
  // 监听接通后的通讯
  pc.addEventListener('track', (e) => {
    remoteVideo.value.srcObject = e.streams[0]
  })
  //
  pc.addEventListener('icecandidate', (event) => {
    if (event.candidate) {
      // 内网穿透，将本地的candidate发送给目标
      const message = {
        code: 'icecandidate',
        data: { targetId: targetId.value, icecandidate: event.candidate }
      }
      socket.send(JSON.stringify(message))
    }

  })
  sendOffer()
}
async function sendOffer() {
  // 创建offer,发送
  const description = await pc.createOffer()
  pc.setLocalDescription(description)
  const message = {
    code: 'offer',
    data: {
      targetId: targetId.value,
      offer: description
    }
  }
  socket.send(JSON.stringify(message))
}
// ====接收方
function getOffer({ fromId, offer }) {
  console.info('getOffer', fromId, offer)
  // 创建一个新rtc连接
  pc = new RTCPeerConnection({})
  // 获取当前所有的音视频流
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
  // 监听接通
  pc.addEventListener('track', (e) => {
    remoteVideo.value.srcObject = e.streams[0]
  })
  // 
  pc.addEventListener('icecandidate', (e) => {
    if (e.candidate) {
      // 内网穿透，将本地的candidate发送给目标
      const message = {
        code: 'icecandidate',
        data: { targetId: fromId, candidate: e.candidate }
      }
      socket.send(JSON.stringify(message))
    }
  })
  // 设置远程描述
  pc.setRemoteDescription(offer)
  // 给目标发送answer
  sendAnswer(fromId)
}

async function sendAnswer(targetId) {
  const description = await pc.createAnswer()
  pc.setLocalDescription(description)
  const message = {
    code: 'answer',
    data: {
      targetId, answer: description
    }
  }
  socket.send(JSON.stringify(message))
}

function getAnswer({ fromId, answer }) {
  pc.setRemoteDescription(answer)
}

function getCandidate({ fromId, candidate }) {
  pc.addIceCandidate(candidate)
}

async function handOpen() {
  console.log('---', front.value)
  let constraints = { video: { facingMode: front.value ? "user" : "environment" }, audio: sound.value }
  console.log(constraints)
  localStream = await navigator.mediaDevices.getUserMedia(constraints)
  localVideo.value.srcObject = localStream
}
function operateSound() {
  sound.value = !sound.value
  handOpen()
}
function operateVideo() {
  video.value = !video.value
  handOpen()
}
function operateFlip() {
  front.value = !front.value
  handOpen()
}


function init() {
  socket = new WebSocket(`wss://192.168.43.82:9001/socket?id=${currentId}`)
  socket.onopen = () => {
    console.log('WebSocket连接已打开');
  };
  socket.onmessage = e => {

    const message = e.data
    console.log('接收消息:', message);
    const { code, data } = JSON.parse(message)
    if (code === 'connect_success') {

    } else if (code === 'offer') {
      // 接收offer
      getOffer(data)

    } else if (code === 'answer') {
      // 接收answer
      getAnswer(data)

    } else if (code === 'icecandidate') {
      // 接收candidate
      getCandidate(data)

    }

  };
  socket.onclose = () => {
    console.log('WebSocket连接已关闭');
  };
  socket.onerror = (error) => {
    console.error('WebSocket发生错误:', error);
  };
}
init()
</script>
<template>
  <video ref="localVideo" autoplay></video>
  <video ref="remoteVideo" autoplay style="border: 1px dashed red;"></video>
  <div>
    <button @click="handOpen">打开音视频</button>
    <button @click="operateSound">{{ sound ? '关闭声音' : '开启声音' }}</button>
    <!-- <button @click="operateVideo">{{ video ? '关闭视频' : '打开视频' }}</button> -->
    <button @click="operateFlip">{{ front ? '前置' : '后置' }}</button>
  </div>
  <div>
    <input v-model="targetId" type="text" />
    <button @click="handCall">呼叫</button>
  </div>
</template>

<style scoped>
video {
  width: 300px;
  height: 200px;
  border: 1px dashed black;
}
</style>