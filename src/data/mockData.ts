export interface Immersion {
  id: string;
  title: string;
  tags: string[];
  level: 'intro' | 'intermediate' | 'advanced';
  workloadDays: number;
  nextClass: string;
  badges?: ('new' | 'popular')[];
  description: string;
  image?: string;
  duration: string;
  startDate?: string;
  slug?: string; // Adicionar campo slug
}

export const mockImmersions: Immersion[] = [
  {
    id: "ia-aplicada-varejo",
    title: "IA Aplicada ao Varejo",
    tags: ["IA Aplicada", "Analytics"],
    level: "intermediate",
    workloadDays: 1,
    nextClass: "2024-09-15",
    badges: ["popular"],
    description: "Aprenda a implementar soluções de IA no varejo, desde recomendação de produtos até otimização de estoque.",
    duration: "1 dia",
    startDate: "2024-09-15"
  },
  {
    id: "machine-learning-fundamentos",
    title: "Machine Learning: Fundamentos",
    tags: ["IA Aplicada", "Data & Analytics"],
    level: "intro",
    workloadDays: 2,
    nextClass: "2024-09-20",
    badges: ["new"],
    description: "Domine os conceitos fundamentais de Machine Learning com exemplos práticos e casos de uso reais.",
    duration: "2 dias",
    startDate: "2024-09-20"
  },
  {
    id: "data-governance-compliance",
    title: "Data Governance e Compliance",
    tags: ["Segurança/Compliance", "Data & Analytics"],
    level: "advanced",
    workloadDays: 2,
    nextClass: "2024-09-22",
    description: "Implemente frameworks robustos de governança de dados alinhados às regulamentações LGPD e GDPR.",
    duration: "2 dias",
    startDate: "2024-09-22"
  },
  {
    id: "mlops-production",
    title: "MLOps: Deploy em Produção",
    tags: ["Dev & MLOps", "IA Aplicada"],
    level: "advanced",
    workloadDays: 3,
    nextClass: "2024-10-05",
    badges: ["popular"],
    description: "Master class em MLOps: desde versionamento de modelos até monitoramento em produção e CI/CD.",
    duration: "3 dias",
    startDate: "2024-10-05"
  },
  {
    id: "python-data-science",
    title: "Python para Data Science",
    tags: ["Dev & MLOps", "Data & Analytics"],
    level: "intro",
    workloadDays: 2,
    nextClass: "2024-09-25",
    badges: ["new"],
    description: "Aprenda Python aplicado à ciência de dados com pandas, numpy, matplotlib e scikit-learn.",
    duration: "2 dias",
    startDate: "2024-09-25"
  },
  {
    id: "ai-security-threats",
    title: "Segurança em IA",
    tags: ["Segurança/Compliance", "IA Aplicada"],
    level: "intermediate",
    workloadDays: 1,
    nextClass: "2024-09-28",
    description: "Identifique e mitigue riscos de segurança em sistemas de IA e machine learning.",
    duration: "1 dia",
    startDate: "2024-09-28"
  }
];

export type UserState = 'visitor' | 'logged-corporate' | 'logged-personal' | 'logged-no-company';
export type AccessState = 'available' | 'not-in-plan' | 'locked';