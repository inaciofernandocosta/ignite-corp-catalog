import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, BookOpen } from "lucide-react";

interface HowItWorksProps {
  onContractClick: () => void;
}

const steps = [
  {
    icon: <Users className="w-8 h-8 text-primary" />,
    title: "Colaborador se cadastra",
    description: "O colaborador se inscreve na plataforma e solicita acesso aos cursos."
  },
  {
    icon: <Building2 className="w-8 h-8 text-primary" />,
    title: "Empresa recebe a inscrição",
    description: "A empresa analisa e valida a solicitação do colaborador."
  },
  {
    icon: <BookOpen className="w-8 h-8 text-primary" />,
    title: "Colaborador é aprovado",
    description: "Após aprovação, o colaborador tem acesso completo aos cursos e certificações."
  }
];

export function HowItWorks({ onContractClick }: HowItWorksProps) {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-foreground mb-4">
            Como funciona para colaboradores
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Um processo simples para você acessar o desenvolvimento profissional
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <Card key={index} className="text-center border-0 bg-background/50 backdrop-blur">
              <CardContent className="pt-8 pb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" onClick={onContractClick} className="min-w-64">
            Solicitar acesso
          </Button>
        </div>
      </div>
    </section>
  );
}