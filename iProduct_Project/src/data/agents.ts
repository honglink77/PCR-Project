import type { Agent } from '@/types/agent';

export const agents: Agent[] = [
  {
    id: 'portfolio-planning',
    name: 'Portfolio Planning',
    description: 'Portfolio Planning Workbench',
    icon: 'Briefcase',
    color: 'bg-sky-600',
    status: 'active',
    capabilities: ['Portfolio Strategy', 'Resource Allocation', 'Investment Analysis'],
  },
  {
    id: 'dev-project',
    name: 'Dev Project',
    description: 'Dev Project Workbench',
    icon: 'Code2',
    color: 'bg-emerald-600',
    status: 'active',
    capabilities: ['Sprint Planning', 'Task Tracking', 'Code Review'],
  },
  {
    id: 'product-design',
    name: 'Product Design',
    description: 'Product Design Workbench',
    icon: 'Palette',
    color: 'bg-rose-500',
    status: 'active',
    capabilities: ['UI/UX Design', 'Prototyping', 'Design System'],
  },
  {
    id: 'product-release',
    name: 'Product Release',
    description: 'Product Release Workbench',
    icon: 'Rocket',
    color: 'bg-amber-500',
    status: 'active',
    capabilities: ['Release Planning', 'Version Control', 'Rollout Strategy'],
  },
  {
    id: 'product-ops',
    name: 'Product Ops',
    description: 'Product Ops Workbench',
    icon: 'Settings',
    color: 'bg-teal-600',
    status: 'active',
    capabilities: ['Process Optimization', 'Tool Management', 'Data Governance'],
  },
  {
    id: 'knowledge-management',
    name: 'Knowledge Management',
    description: 'Knowledge Management Workbench / Module',
    icon: 'BookOpen',
    color: 'bg-indigo-500',
    status: 'active',
    capabilities: ['Knowledge Base', 'Document Hub', 'Best Practices'],
  },
];

export function getAgent(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}
