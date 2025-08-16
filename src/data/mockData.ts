export interface Immersion {
  id: string;
  title: string;
  tags: string[];
  level: 'intro' | 'intermediate' | 'advanced';
  format: 'live' | 'on-demand';
  workloadHours: number;
  nextClass?: string;
  badges?: ('new' | 'popular')[];
  description: string;
}

export const mockImmersions: Immersion[] = [
  {
    id: "ia-aplicada-varejo",
    title: "IA Aplicada ao Varejo",
    tags: ["IA Aplicada", "Analytics"],
    level: "intermediate",
    format: "live",
    workloadHours: 8,
    nextClass: "2024-09-15",
    badges: ["popular"],
    description: "Aprenda a implementar soluções de IA no varejo, desde recomendação de produtos até otimização de estoque e análise preditiva de demanda."
  },
  {
    id: "machine-learning-fundamentos",
    title: "Machine Learning: Fundamentos e Aplicações",
    tags: ["IA Aplicada", "Data & Analytics"],
    level: "intro",
    format: "on-demand",
    workloadHours: 16,
    badges: ["new"],
    description: "Domine os conceitos fundamentais de Machine Learning com exemplos práticos e casos de uso reais em diferentes indústrias."
  },
  {
    id: "data-governance-compliance",
    title: "Data Governance e Compliance",
    tags: ["Segurança/Compliance", "Data & Analytics"],
    level: "advanced",
    format: "live",
    workloadHours: 12,
    nextClass: "2024-09-22",
    description: "Implemente frameworks robustos de governança de dados alinhados às regulamentações LGPD, GDPR e melhores práticas do mercado."
  },
  {
    id: "mlops-production",
    title: "MLOps: Deploy de Modelos em Produção",
    tags: ["Dev & MLOps", "IA Aplicada"],
    level: "advanced",
    format: "live",
    workloadHours: 24,
    nextClass: "2024-10-05",
    badges: ["popular"],
    description: "Master class em MLOps: desde versionamento de modelos até monitoramento em produção, CI/CD para ML e orquestração de pipelines."
  },
  {
    id: "python-data-science",
    title: "Python para Data Science",
    tags: ["Dev & MLOps", "Data & Analytics"],
    level: "intro",
    format: "on-demand",
    workloadHours: 20,
    badges: ["new"],
    description: "Aprenda Python aplicado à ciência de dados: pandas, numpy, matplotlib, scikit-learn e jupyter notebooks com projetos hands-on."
  },
  {
    id: "ai-security-threats",
    title: "Segurança em IA: Ameaças e Proteções",
    tags: ["Segurança/Compliance", "IA Aplicada"],
    level: "intermediate",
    format: "live",
    workloadHours: 8,
    nextClass: "2024-09-28",
    description: "Identifique e mitigue riscos de segurança em sistemas de IA: adversarial attacks, model poisoning e privacy-preserving ML."
  },
  {
    id: "deep-learning-avancado",
    title: "Deep Learning Avançado",
    tags: ["IA Aplicada", "Dev & MLOps"],
    level: "advanced",
    format: "on-demand",
    workloadHours: 32,
    badges: ["popular"],
    description: "Técnicas avançadas em deep learning: transformers, GANs, reinforcement learning e arquiteturas de neural networks state-of-the-art."
  },
  {
    id: "analytics-business-intelligence",
    title: "Analytics e Business Intelligence",
    tags: ["Data & Analytics"],
    level: "intermediate",
    format: "live",
    workloadHours: 12,
    nextClass: "2024-10-12",
    description: "Construa dashboards interativos e relatórios inteligentes usando ferramentas modernas de BI e técnicas de storytelling com dados."
  }
];

export type UserState = 'visitor' | 'logged-corporate' | 'logged-personal' | 'logged-no-company';
export type AccessState = 'available' | 'not-in-plan' | 'locked';