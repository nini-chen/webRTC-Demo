import {
  WebSocketServer
} from 'ws';
import {
  createServer
}
from 'https'
import {
  readFileSync
} from 'fs'

// 添加证书，为了webrct的加密安全策略
const server = createServer({
  cert: readFileSync('../cert/server.pem'),
  key: readFileSync('../cert/server.key')
})
// 创建wss服务
const wss = new WebSocketServer({
  server
});

wss.on('connection', function connection(ws, request) {
  const params = request.url.substring(request.url.lastIndexOf('?') + 1)
  const _params = {}
  params.split('&').forEach((item) => {
    const arr = item.split('=');
    _params[arr[0]] = arr[1];
  });

  const {
    id: currentUserId
  } = _params
  ws._userId = currentUserId

  ws.on('error', console.error);

  ws.on('message', function message(res) {
    console.log('received: %s', res);
    const message = res.toString();
    const {
      code,
      data
    } = JSON.parse(message);
    if (code === 'offer') {
      // 收到offer
      const {
        targetId,
        offer
      } = data
      wss.clients.forEach((client) => {
        if (client._userId === targetId) {
          const message = {
            code: 'offer',
            data: {
              fromId: currentUserId,
              offer
            }
          }
          client.send(JSON.stringify(message));
        }
      })
    } else if (code === 'answer') {
      const {
        targetId,
        answer
      } = data
      wss.clients.forEach((client) => {
        if (client._userId === targetId) {
          const message = {
            code: 'answer',
            data: {
              fromId: currentUserId,
              answer
            }
          }
          client.send(JSON.stringify(message));
        }
      })

    } else if (code === 'icecandidate') {
      const {
        targetId,
        candidate
      } = data
      wss.clients.forEach(client => {
        if (client._userId === targetId) {
          const message = {
            code: 'icecandidate',
            data: {
              fromId: currentUserId,
              candidate
            }
          }
          client.send(JSON.stringify(message))
        }
      })
    } else if (code === 'join_group') {

    };
  });
  const message = {
    code: 'connect_success',
    data: ''
  }

  ws.send(JSON.stringify(message));
});

// 服务端口
server.listen(8085)