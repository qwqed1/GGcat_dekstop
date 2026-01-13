import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BASE_URL } from "../config/ws";

const WS_URL = `${WS_BASE_URL}/ws/crash?token=supersecret`;
const RECONNECT_DELAY = 2000; // 2 секунды между попытками reconnect
const HEARTBEAT_INTERVAL = 30000; // ping каждые 30 секунд

interface UseCrashSocketOptions {
  enabled?: boolean;
}

export function useCrashSocket(onMessage: (msg: any) => void, options: UseCrashSocketOptions = {}) {
  const { enabled = true } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  
  // Используем ref для актуального callback
  const onMessageRef = useRef(onMessage);
  
  // Обновляем ref при каждом рендере
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearTimers();
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ event: "ping" }));
      }
    }, HEARTBEAT_INTERVAL);
  }, [clearTimers]);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;
    
    // Закрываем старое соединение если есть
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log("🔄 Connecting to Crash WS...");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("🟢 Crash WS connected");
      setConnected(true);
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // Пропускаем pong сообщения
        if (msg.event === "pong") return;
        onMessageRef.current(msg);
      } catch {
        console.warn("Bad WS message", event.data);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ Crash WS error:", error);
    };

    ws.onclose = (event) => {
      console.log("🔴 Crash WS disconnected, code:", event.code);
      setConnected(false);
      clearTimers();
      
      // Автоматический reconnect если компонент не размонтирован
      if (!isUnmountedRef.current) {
        console.log(`🔄 Reconnecting in ${RECONNECT_DELAY}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, RECONNECT_DELAY);
      }
    };
  }, [startHeartbeat, clearTimers]);

  useEffect(() => {
    // Не подключаемся если enabled = false
    if (!enabled) {
      return;
    }
    
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("⚠️ Crash WS not connected, cannot send:", data);
    }
  }, []);

  return { send, connected };
}
