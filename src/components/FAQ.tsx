import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqItems = [
  {
    id: "acesso",
    question: "Como sei se minha empresa tem acesso às imersões?",
    answer: "Faça login com seu e-mail corporativo. Se sua empresa estiver cadastrada, você verá o catálogo completo com as imersões disponíveis para seu plano. Caso contrário, aparecerá uma opção para solicitar a contratação."
  },
  {
    id: "elegibilidade", 
    question: "Todos os colaboradores podem acessar todas as imersões?",
    answer: "Depende do plano contratado pela sua empresa. Algumas imersões podem estar disponíveis apenas para determinados níveis ou departamentos. Consulte seu RH ou TI para mais informações sobre seu acesso específico."
  },
  {
    id: "cadastrar",
    question: "Como cadastrar minha empresa na plataforma?",
    answer: "Entre em contato conosco através do botão 'Contratar para minha empresa'. Nossa equipe comercial entrará em contato para apresentar os planos disponíveis e realizar o cadastro completo da sua organização."
  },
  {
    id: "suporte",
    question: "Preciso de ajuda com acesso ou inscrições",
    answer: "Para questões de acesso, entre em contato com o RH ou TI da sua empresa. Para dúvidas técnicas sobre a plataforma ou conteúdo das imersões, utilize nosso suporte técnico disponível 24/7."
  }
];

export function FAQ() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-foreground mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Encontre respostas para as principais dúvidas sobre acesso e funcionamento
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item) => (
              <AccordionItem 
                key={item.id} 
                value={item.id}
                className="border border-border rounded-lg px-6 bg-card"
              >
                <AccordionTrigger className="text-left font-heading font-medium hover:no-underline py-6">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}