import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Connection {
  id: string
  name: string
  description?: string
  connection_url: string
}

interface ConnectionsState {
  connections: Connection[]

  // Actions
  addConnection: (connection: Connection) => void
  updateConnection: (id: string, updates: Partial<Connection>) => void
  deleteConnection: (id: string) => void
  getConnection: (id: string) => Connection | undefined
}

export const useConnectionsStore = create<ConnectionsState>()(
  persist(
    (set, get) => ({
      connections: [
        {
          id: "local",
          name: "Local",
          description: "Localhost",
          connection_url: "http://localhost:8000"
        },
        {
          id: "cloud",
          name: "FirmIQ Cloud Run",
          description: "Cloud Run Service",
          connection_url: "https://cloudrun.example.com"
        },
      ],

      addConnection: (connection) =>
        set((state) => ({
          connections: [...state.connections, connection],
        })),

      updateConnection: (id, updates) =>
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === id ? { ...conn, ...updates } : conn
          ),
        })),

      deleteConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== id),
        })),

      getConnection: (id) => {
        return get().connections.find((conn) => conn.id === id)
      },
    }),
    {
      name: 'connections-storage',
    }
  )
)
