import { createContext, useContext, useReducer, useCallback, type Dispatch, type ReactNode } from 'react';
import type { ChatState, ChatAction, Conversation, Message, MessageSendStatus } from '@/types/chat';
import { mockConversations } from '@/data/conversations';
import { getAgent } from '@/data/agents';

const initialDraft = { active: false, agentId: null as string | null };

const initialState: ChatState = {
  conversations: mockConversations,
  activeConversationId: null,
  draft: initialDraft,
  composerText: '',
  sendStatus: 'idle',
  failedMessageText: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_ACTIVE_CONVERSATION':
      return {
        ...state,
        activeConversationId: action.id,
        draft: initialDraft,
        composerText: '',
        sendStatus: 'idle',
        failedMessageText: null,
      };
    case 'OPEN_DRAFT':
      return {
        ...state,
        activeConversationId: null,
        draft: { active: true, agentId: action.agentId },
        composerText: '',
        sendStatus: 'idle',
        failedMessageText: null,
      };
    case 'CLEAR_DRAFT':
      return { ...state, draft: initialDraft, composerText: '', sendStatus: 'idle', failedMessageText: null };
    case 'PROMOTE_DRAFT':
      return {
        ...state,
        conversations: { ...state.conversations, [action.conversation.id]: action.conversation },
        activeConversationId: action.conversation.id,
        draft: initialDraft,
        composerText: '',
      };
    case 'CREATE_CONVERSATION':
      return {
        ...state,
        conversations: { ...state.conversations, [action.conversation.id]: action.conversation },
        activeConversationId: action.conversation.id,
        composerText: '',
      };
    case 'APPEND_MESSAGE': {
      const conv = state.conversations[action.conversationId];
      if (!conv) return state;
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [action.conversationId]: {
            ...conv,
            messages: [...conv.messages, action.message],
            updatedAt: action.message.timestamp,
          },
        },
      };
    }
    case 'SET_COMPOSER':
      return { ...state, composerText: action.text };
    case 'SET_SEND_STATUS':
      return { ...state, sendStatus: action.status };
    case 'SET_FAILED_TEXT':
      return { ...state, failedMessageText: action.text };
    case 'DELETE_CONVERSATION': {
      const { [action.id]: _, ...rest } = state.conversations;
      return {
        ...state,
        conversations: rest,
        activeConversationId: state.activeConversationId === action.id ? null : state.activeConversationId,
      };
    }
    default:
      return state;
  }
}

interface ChatContextValue {
  state: ChatState;
  dispatch: Dispatch<ChatAction>;
  openDraft: (agentId?: string | null) => void;
  sendDraftMessage: (text: string) => void;
  sendMessage: (text: string) => void;
  retryMessage: () => void;
}

const ChatCtx = createContext<ChatContextValue | null>(null);

function generateTitle(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 50) return trimmed;
  return trimmed.slice(0, 47) + '...';
}

const mockAiResponses = [
  'Based on my analysis of the available data, here are the key findings:\n\n1. **Primary insight**: The trend shows consistent growth over the past quarter\n2. **Supporting evidence**: Multiple data points corroborate this pattern\n3. **Recommendation**: Consider adjusting the strategy to capitalize on this momentum\n\nI can provide more detailed breakdowns for any of these areas.',
  'I have processed the request and identified several important patterns:\n\n- **Pattern A**: User engagement metrics are trending positively\n- **Pattern B**: There is a correlation between feature adoption and retention\n- **Pattern C**: Regional differences suggest localized strategies may be effective\n\nWould you like me to dive deeper into any specific area?',
  'Here is my assessment:\n\nThe data indicates a strong opportunity in the current market conditions. Key factors include increasing demand for AI-powered tools, growing enterprise adoption rates, and favorable competitive dynamics.\n\nI recommend proceeding with the proposed strategy while monitoring the identified risk factors closely.',
];

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const openDraft = useCallback((agentId?: string | null) => {
    dispatch({ type: 'OPEN_DRAFT', agentId: agentId ?? null });
  }, []);

  const simulateAiReply = useCallback((convId: string) => {
    dispatch({ type: 'SET_SEND_STATUS', status: 'answering' });
    setTimeout(() => {
      const aiContent = mockAiResponses[Math.floor(Math.random() * mockAiResponses.length)];
      const aiMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        conversationId: convId,
        role: 'assistant',
        content: aiContent,
        timestamp: Date.now(),
        status: 'sent',
        citations: [
          { id: `cit-${Date.now()}`, label: '[1]', source: 'Internal Knowledge Base', excerpt: 'Analysis based on aggregated data from multiple internal sources.', confidence: 0.92 },
          { id: `cit-${Date.now()}-2`, label: '[2]', source: 'Enterprise Analytics Platform', excerpt: 'Cross-referenced metrics from the reporting dashboard.', confidence: 0.87 },
        ],
      };
      dispatch({ type: 'APPEND_MESSAGE', conversationId: convId, message: aiMsg });
      dispatch({ type: 'SET_SEND_STATUS', status: 'idle' });
    }, 1500 + Math.random() * 1000);
  }, []);

  const sendDraftMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    dispatch({ type: 'SET_SEND_STATUS', status: 'sending' });
    dispatch({ type: 'SET_COMPOSER', text: '' });

    const agentId = state.draft.agentId ?? 'portfolio-planning';
    const agent = getAgent(agentId);
    const convId = `conv-${Date.now()}`;
    const now = Date.now();

    const userMsg: Message = {
      id: `msg-${now}`,
      conversationId: convId,
      role: 'user',
      content: trimmed,
      timestamp: now,
      status: 'sent',
    };

    const conv: Conversation = {
      id: convId,
      title: generateTitle(trimmed),
      agentId,
      messages: [userMsg],
      createdAt: now,
      updatedAt: now,
      pinned: false,
    };

    setTimeout(() => {
      dispatch({ type: 'PROMOTE_DRAFT', conversation: conv });
      simulateAiReply(convId);
    }, 400);
  }, [state.draft.agentId, simulateAiReply]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !state.activeConversationId) return;

    const convId = state.activeConversationId;
    dispatch({ type: 'SET_SEND_STATUS', status: 'sending' });
    dispatch({ type: 'SET_COMPOSER', text: '' });

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: convId,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      status: 'sent',
    };

    setTimeout(() => {
      dispatch({ type: 'APPEND_MESSAGE', conversationId: convId, message: userMsg });
      simulateAiReply(convId);
    }, 300);
  }, [state.activeConversationId, simulateAiReply]);

  const retryMessage = useCallback(() => {
    const text = state.failedMessageText;
    if (!text) return;
    dispatch({ type: 'SET_FAILED_TEXT', text: null });

    if (state.draft.active) {
      sendDraftMessage(text);
    } else if (state.activeConversationId) {
      sendMessage(text);
    }
  }, [state.failedMessageText, state.draft.active, state.activeConversationId, sendDraftMessage, sendMessage]);

  return (
    <ChatCtx.Provider value={{ state, dispatch, openDraft, sendDraftMessage, sendMessage, retryMessage }}>
      {children}
    </ChatCtx.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
