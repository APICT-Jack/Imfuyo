import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    this.socket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    // Admin specific events
    this.socket.on('user-verification-request', (data) => {
      this.emit('user-verification-request', data);
    });

    this.socket.on('new-listing', (data) => {
      this.emit('new-listing', data);
    });

    this.socket.on('system-alert', (data) => {
      this.emit('system-alert', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) callbacks.splice(index, 1);
  }
}

export default new WebSocketService();