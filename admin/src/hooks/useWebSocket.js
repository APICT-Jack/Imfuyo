import { useEffect, useState } from 'react';
import webSocketService from '../services/websocket';

export const useWebSocket = (event, handler) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    webSocketService.on(event, handler);
    setIsConnected(!!webSocketService.socket?.connected);

    return () => {
      webSocketService.off(event, handler);
    };
  }, [event, handler]);

  return { isConnected };
};