"use client";

import { useEffect, useRef, useCallback, useState } from "react";

type MessageHandler = (data: any) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private channels = new Map<string, Set<MessageHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    const host = typeof window !== "undefined" ? window.location.host : "localhost:3000";
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
    // Backend is on port 8000
    this.baseUrl = baseUrl || `${protocol}//localhost:8000/api/v1/ws`;
  }

  subscribe(channel: string, handler: MessageHandler) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(handler);

    // Connect if first subscriber
    if (this.channels.size === 1 && (!this.ws || this.ws.readyState !== WebSocket.OPEN)) {
      this.connect();
    }

    return () => this.unsubscribe(channel, handler);
  }

  unsubscribe(channel: string, handler: MessageHandler) {
    const handlers = this.channels.get(channel);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.channels.delete(channel);
      }
    }
    // Disconnect if no subscribers
    if (this.channels.size === 0) {
      this.disconnect();
    }
  }

  private connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.baseUrl);

      this.ws.onopen = () => {
        // Subscribe to all active channels
        for (const channel of this.channels.keys()) {
          this.ws!.send(JSON.stringify({ type: "subscribe", channel }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Dispatch to all handlers (channels are server-side)
          for (const [, handlers] of this.channels) {
            for (const handler of handlers) {
              handler(data);
            }
          }
        } catch {
          // ignore non-JSON messages
        }
      };

      this.ws.onclose = () => {
        // Reconnect after 3 seconds
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = () => {
        // Will trigger onclose → reconnect
      };
    } catch {
      // Reconnect after 5 seconds
      this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    }
  }

  private disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton
const wsManager = new WebSocketManager();

/**
 * Hook to subscribe to WebSocket channels
 * 
 * @param channel - Channel name (e.g., "company_123", "global_orders", "courier_456")
 * @param enabled - Whether to subscribe
 * @returns last received message
 */
export function useWebSocket(channel: string | null, enabled = true) {
  const [lastMessage, setLastMessage] = useState<any>(null);
  const handlerRef = useRef<MessageHandler | null>(null);

  const handler = useCallback((data: any) => {
    setLastMessage(data);
  }, []);

  useEffect(() => {
    if (!channel || !enabled) return;

    handlerRef.current = handler;
    const unsubscribe = wsManager.subscribe(channel, handler);

    return () => {
      unsubscribe();
      handlerRef.current = null;
    };
  }, [channel, enabled, handler]);

  return lastMessage;
}

export { wsManager };
