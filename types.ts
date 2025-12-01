export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  text: string;
  timestamp: number;
}

export interface DIDConfig {
  apiKey: string;
  agentId: string;
}

export interface DIDSession {
  chatId: string;
  streamId: string;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  FAILED = 'FAILED'
}
