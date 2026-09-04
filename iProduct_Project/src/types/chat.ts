export interface Citation {
  id: string;
  label: string;
  source: string;
  excerpt: string;
  confidence: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  timestamp: number;
  status: 'sending' | 'sent' | 'error';
}

export interface Conversation {
  id: string;
  title: string;
  agentId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
}

export interface DraftState {
  active: boolean;
  agentId: string | null;
}

export type MessageSendStatus = 'idle' | 'sending' | 'answering' | 'failed';

export interface ChatState {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  draft: DraftState;
  composerText: string;
  sendStatus: MessageSendStatus;
  failedMessageText: string | null;
}

export type ChatAction =
  | { type: 'SET_ACTIVE_CONVERSATION'; id: string | null }
  | { type: 'OPEN_DRAFT'; agentId: string | null }
  | { type: 'CLEAR_DRAFT' }
  | { type: 'PROMOTE_DRAFT'; conversation: Conversation }
  | { type: 'CREATE_CONVERSATION'; conversation: Conversation }
  | { type: 'APPEND_MESSAGE'; conversationId: string; message: Message }
  | { type: 'SET_COMPOSER'; text: string }
  | { type: 'SET_SEND_STATUS'; status: MessageSendStatus }
  | { type: 'SET_FAILED_TEXT'; text: string | null }
  | { type: 'DELETE_CONVERSATION'; id: string };
