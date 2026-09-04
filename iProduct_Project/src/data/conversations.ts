import type { Conversation } from '@/types/chat';

const now = Date.now();
const HOUR = 3_600_000;
const DAY = 86_400_000;

export const mockConversations: Record<string, Conversation> = {
  'conv-1': {
    id: 'conv-1',
    title: 'Q3 Market Sizing Analysis',
    agentId: 'portfolio-planning',
    pinned: true,
    createdAt: now - 2 * HOUR,
    updatedAt: now - 30 * 60_000,
    messages: [
      { id: 'm1', conversationId: 'conv-1', role: 'user', content: 'Can you analyze the current market size for enterprise AI tools in product development?', timestamp: now - 2 * HOUR, status: 'sent' },
      { id: 'm2', conversationId: 'conv-1', role: 'assistant', content: 'Based on my analysis, the enterprise AI tools market for product development reached $8.2B in 2025, growing at 34% CAGR. Key segments include:\n\n- **Product Analytics & Insights**: $2.8B (largest segment)\n- **AI-Assisted Design**: $1.9B (fastest growing at 42%)\n- **Automated Testing & QA**: $1.6B\n- **Product Planning & Roadmapping**: $1.9B\n\nThe total addressable market is projected to reach $18.5B by 2028, driven by increasing adoption of AI-first product workflows.', timestamp: now - 2 * HOUR + 15000, status: 'sent', citations: [{ id: 'c1', label: '[1]', source: 'Gartner AI Market Report 2025', excerpt: 'Enterprise AI tools market valued at $8.2B with 34% CAGR...', confidence: 0.94 }, { id: 'c2', label: '[2]', source: 'IDC Product Analytics Forecast', excerpt: 'Product analytics segment leads with $2.8B market share...', confidence: 0.89 }] },
      { id: 'm3', conversationId: 'conv-1', role: 'user', content: 'How does our positioning compare against key competitors?', timestamp: now - HOUR, status: 'sent' },
      { id: 'm4', conversationId: 'conv-1', role: 'assistant', content: 'I identified 5 primary competitors in our segment. Here is the competitive landscape:\n\n1. **CompetitorA** - Strong in analytics, weak in AI planning tools\n2. **CompetitorB** - Broad platform but lacks depth in product strategy\n3. **CompetitorC** - Excellent UX research tools, limited data integration\n4. **CompetitorD** - Enterprise-focused with heavy compliance features\n5. **CompetitorE** - Startup with innovative AI chat but small market share\n\nOur key differentiator is the integrated multi-agent workspace approach that combines all these capabilities into a single platform.', timestamp: now - HOUR + 20000, status: 'sent', citations: [{ id: 'c3', label: '[1]', source: 'Internal Competitive Intel Database', excerpt: 'Cross-reference of 5 competitors across 12 capability dimensions...', confidence: 0.91 }] },
    ],
  },
  'conv-2': {
    id: 'conv-2',
    title: 'Feature Prioritization Framework',
    agentId: 'dev-project',
    pinned: false,
    createdAt: now - 5 * HOUR,
    updatedAt: now - 3 * HOUR,
    messages: [
      { id: 'm5', conversationId: 'conv-2', role: 'user', content: 'Help me set up a RICE scoring framework for our Q4 features.', timestamp: now - 5 * HOUR, status: 'sent' },
      { id: 'm6', conversationId: 'conv-2', role: 'assistant', content: 'I have prepared a RICE scoring framework tailored to your product. Here is the breakdown:\n\n**Reach** - Estimated users impacted per quarter\n**Impact** - Score 0.25 (minimal) to 3 (massive)\n**Confidence** - Percentage based on available data\n**Effort** - Person-months estimated\n\nI have pre-scored 12 candidate features from your backlog. The top 3 are:\n\n1. Real-time collaboration (Score: 847)\n2. Custom dashboard builder (Score: 723)\n3. API marketplace integration (Score: 691)', timestamp: now - 5 * HOUR + 30000, status: 'sent' },
    ],
  },
  'conv-3': {
    id: 'conv-3',
    title: 'Monthly KPI Dashboard Review',
    agentId: 'product-design',
    pinned: false,
    createdAt: now - DAY,
    updatedAt: now - DAY + 2 * HOUR,
    messages: [
      { id: 'm7', conversationId: 'conv-3', role: 'user', content: 'Pull the latest monthly KPIs and highlight any anomalies.', timestamp: now - DAY, status: 'sent' },
      { id: 'm8', conversationId: 'conv-3', role: 'assistant', content: 'Monthly KPI summary is ready. Notable findings:\n\n- **DAU/MAU ratio**: 42% (up 3pp from last month)\n- **Feature adoption rate**: 67% for new dashboard widgets\n- **NPS Score**: 72 (stable)\n- **Churn rate**: 2.1% (anomaly detected - 0.4pp increase)\n\nThe churn anomaly correlates with a pricing tier change affecting mid-market accounts. I recommend investigating the 23 accounts that downgraded last week.', timestamp: now - DAY + 10000, status: 'sent', citations: [{ id: 'c4', label: '[1]', source: 'Analytics Dashboard - August 2026', excerpt: 'DAU/MAU improved to 42%, driven by new collaboration features...', confidence: 0.97 }] },
    ],
  },
  'conv-4': {
    id: 'conv-4',
    title: 'User Persona Research',
    agentId: 'product-release',
    pinned: false,
    createdAt: now - DAY - 3 * HOUR,
    updatedAt: now - DAY - HOUR,
    messages: [
      { id: 'm9', conversationId: 'conv-4', role: 'user', content: 'Synthesize the interview data from our latest user research sprint.', timestamp: now - DAY - 3 * HOUR, status: 'sent' },
      { id: 'm10', conversationId: 'conv-4', role: 'assistant', content: 'Synthesized 18 user interviews into 3 primary personas:\n\n**Persona 1: Strategic Sarah** (Product Director)\n- Goals: High-level roadmap visibility, stakeholder reporting\n- Pain points: Too many tools, context switching\n\n**Persona 2: Analytical Alex** (Data PM)\n- Goals: Data-driven decisions, metric tracking\n- Pain points: Manual data gathering, slow insight delivery\n\n**Persona 3: Operational Oscar** (Product Operations)\n- Goals: Process efficiency, cross-team coordination\n- Pain points: Lack of automation, visibility gaps', timestamp: now - DAY - 3 * HOUR + 25000, status: 'sent' },
    ],
  },
  'conv-5': {
    id: 'conv-5',
    title: 'Architecture Review: Event System',
    agentId: 'product-ops',
    pinned: false,
    createdAt: now - 2 * DAY,
    updatedAt: now - 2 * DAY + 4 * HOUR,
    messages: [
      { id: 'm11', conversationId: 'conv-5', role: 'user', content: 'Review the proposed event-driven architecture for our notification system.', timestamp: now - 2 * DAY, status: 'sent' },
      { id: 'm12', conversationId: 'conv-5', role: 'assistant', content: 'I have reviewed the architecture proposal. Summary of findings:\n\n**Strengths:**\n- Event sourcing pattern is well-suited for audit trails\n- Decoupled producers/consumers enable independent scaling\n\n**Concerns:**\n- Message ordering is not guaranteed across partitions\n- Dead letter queue strategy is undefined\n- No circuit breaker for external webhook delivery\n\n**Recommendations:**\n1. Add partition key strategy based on user_id\n2. Implement exponential backoff with DLQ after 5 retries\n3. Add circuit breaker with 50% error threshold', timestamp: now - 2 * DAY + 45000, status: 'sent' },
    ],
  },
  'conv-6': {
    id: 'conv-6',
    title: 'Growth Experiment: Onboarding Flow',
    agentId: 'knowledge-management',
    pinned: false,
    createdAt: now - 3 * DAY,
    updatedAt: now - 3 * DAY + HOUR,
    messages: [
      { id: 'm13', conversationId: 'conv-6', role: 'user', content: 'Design an A/B test for our new onboarding wizard.', timestamp: now - 3 * DAY, status: 'sent' },
      { id: 'm14', conversationId: 'conv-6', role: 'assistant', content: 'A/B test design for onboarding wizard:\n\n**Control**: Current 5-step wizard\n**Variant A**: 3-step condensed wizard (skip team setup + integrations)\n**Variant B**: Interactive guided tour (no wizard, contextual tips)\n\n**Primary metric**: 7-day activation rate\n**Secondary**: Time-to-first-value, support ticket volume\n**Sample size**: 2,400 per variant (95% confidence, 80% power)\n**Duration**: 14 days minimum', timestamp: now - 3 * DAY + 20000, status: 'sent' },
    ],
  },
  'conv-7': {
    id: 'conv-7',
    title: 'Competitor Feature Comparison',
    agentId: 'portfolio-planning',
    pinned: false,
    createdAt: now - 4 * DAY,
    updatedAt: now - 4 * DAY + 2 * HOUR,
    messages: [
      { id: 'm15', conversationId: 'conv-7', role: 'user', content: 'Compare our feature set with the top 3 competitors.', timestamp: now - 4 * DAY, status: 'sent' },
      { id: 'm16', conversationId: 'conv-7', role: 'assistant', content: 'Feature comparison matrix complete. We lead in 8 of 15 categories, trail in 4, and are at parity in 3. Key gaps are mobile experience and enterprise SSO options.', timestamp: now - 4 * DAY + 30000, status: 'sent' },
    ],
  },
};
