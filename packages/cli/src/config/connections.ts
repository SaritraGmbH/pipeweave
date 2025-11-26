/**
 * Connection storage and management
 * Stores database and orchestrator URLs together as named connections
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Connection {
  name: string;
  orchestratorUrl?: string;
  database?: {
    url?: string;
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    ssl?: boolean;
  };
  createdAt: string;
  lastUsed?: string;
}

export interface ConnectionsConfig {
  connections: Connection[];
  defaultConnection?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.pipeweave');
const CONFIG_FILE = path.join(CONFIG_DIR, 'connections.json');

/**
 * Ensure config directory exists
 */
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load connections from disk
 */
export function loadConnections(): ConnectionsConfig {
  ensureConfigDir();

  if (!fs.existsSync(CONFIG_FILE)) {
    return { connections: [] };
  }

  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading connections:', error);
    return { connections: [] };
  }
}

/**
 * Save connections to disk
 */
export function saveConnections(config: ConnectionsConfig): void {
  ensureConfigDir();

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving connections:', error);
    throw error;
  }
}

/**
 * Add or update a connection
 */
export function saveConnection(connection: Omit<Connection, 'createdAt' | 'lastUsed'>): void {
  const config = loadConnections();

  const existingIndex = config.connections.findIndex(c => c.name === connection.name);
  const existing = existingIndex >= 0 ? config.connections[existingIndex] : undefined;

  const now = new Date().toISOString();
  const fullConnection: Connection = {
    ...connection,
    createdAt: existing?.createdAt || now,
    lastUsed: now,
  };

  if (existingIndex >= 0) {
    config.connections[existingIndex] = fullConnection;
  } else {
    config.connections.push(fullConnection);
  }

  // If this is the first connection, make it default
  if (config.connections.length === 1) {
    config.defaultConnection = connection.name;
  }

  // Update selected connection timestamp
  if (config.defaultConnection === connection.name) {
    markConnectionUsed(connection.name);
  }

  saveConnections(config);
}

/**
 * Delete a connection
 */
export function deleteConnection(name: string): boolean {
  const config = loadConnections();

  const index = config.connections.findIndex(c => c.name === name);
  if (index < 0) {
    return false;
  }

  config.connections.splice(index, 1);

  // If we deleted the default, clear it or set to first available
  if (config.defaultConnection === name) {
    config.defaultConnection = config.connections.length > 0 ? config.connections[0]?.name : undefined;
  }

  saveConnections(config);
  return true;
}

/**
 * Get a connection by name
 */
export function getConnection(name: string): Connection | undefined {
  const config = loadConnections();
  return config.connections.find(c => c.name === name);
}

/**
 * Update last used timestamp for a connection
 */
export function markConnectionUsed(name: string): void {
  const config = loadConnections();
  const connection = config.connections.find(c => c.name === name);

  if (connection) {
    connection.lastUsed = new Date().toISOString();
    saveConnections(config);
  }
}

/**
 * Set default connection
 */
export function setDefaultConnection(name: string): boolean {
  const config = loadConnections();

  if (!config.connections.find(c => c.name === name)) {
    return false;
  }

  config.defaultConnection = name;
  saveConnections(config);
  return true;
}

/**
 * Get default connection
 */
export function getDefaultConnection(): Connection | undefined {
  const config = loadConnections();

  if (!config.defaultConnection) {
    return undefined;
  }

  return config.connections.find(c => c.name === config.defaultConnection);
}

/**
 * List all connections
 */
export function listConnections(): Connection[] {
  const config = loadConnections();
  return config.connections;
}

/**
 * Get config file path (for display purposes)
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}
