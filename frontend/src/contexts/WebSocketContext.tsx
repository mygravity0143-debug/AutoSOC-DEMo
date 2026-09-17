import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { WSMessage } from "../types"

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

interface WebSocketContextType {
  status: ConnectionStatus
  lastMessage: WSMessage | null
  subscribe: (type: string, callback: (data: any) => void) => () => void
  sendMessage: (msg: object) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

const WS_URL = "ws://localhost:3001"
const MAX_RETRIES = 10
const BASE_DELAY = 1000

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map())

  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      return
    }

    setStatus("connecting")

    let ws: WebSocket
    try {
      ws = new WebSocket(WS_URL)
    } catch {
      setStatus("error")
      return
    }
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      retriesRef.current = 0
      setStatus("connected")
    }

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return
      try {
        const msg: WSMessage = JSON.parse(event.data)
        setLastMessage(msg)
        const subs = subscribersRef.current.get(msg.type)
        if (subs) {
          subs.forEach(cb => cb(msg.data))
        }
        // also fire wildcard subscribers
        const wildcards = subscribersRef.current.get("*")
        if (wildcards) {
          wildcards.forEach(cb => cb(msg))
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onerror = () => {
      if (!mountedRef.current) return
      setStatus("error")
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setStatus("disconnected")
      wsRef.current = null

      if (retriesRef.current < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY * Math.pow(2, retriesRef.current), 30000)
        retriesRef.current += 1
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) connect()
        }, delay)
      } else {
        setStatus("error")
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [connect])

  const subscribe = useCallback((type: string, callback: (data: any) => void): (() => void) => {
    if (!subscribersRef.current.has(type)) {
      subscribersRef.current.set(type, new Set())
    }
    subscribersRef.current.get(type)!.add(callback)

    return () => {
      const set = subscribersRef.current.get(type)
      if (set) {
        set.delete(callback)
        if (set.size === 0) subscribersRef.current.delete(type)
      }
    }
  }, [])

  const sendMessage = useCallback((msg: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  return (
    <WebSocketContext.Provider value={{ status, lastMessage, subscribe, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = (): WebSocketContextType => {
  const ctx = useContext(WebSocketContext)
  if (!ctx) throw new Error("useWebSocket must be used within WebSocketProvider")
  return ctx
}

export default WebSocketContext
