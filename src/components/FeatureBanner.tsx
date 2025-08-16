import { Building2, Users, Calendar, Star } from "lucide-react";

export function FeatureBanner() {
  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Um novo jeito de aprender
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto mb-6"></div>
          <p className="text-lg text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Nossa metodologia de ensino é prática, imediatamente aplicável e ideal para empreendedores que não têm tempo a perder.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Central Circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 lg:w-56 lg:h-56">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-1 shadow-2xl">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2),transparent_70%)]"></div>
                <div className="text-center z-10">
                  <div className="text-blue-400 text-2xl lg:text-3xl font-bold mb-1">MF</div>
                  <div className="text-white text-sm lg:text-base font-semibold tracking-wider">
                    MENTORIA<br />FUTURA
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-8 lg:gap-12 pt-32 pb-16">
            {/* Top Left */}
            <div className="text-right pr-8 lg:pr-16">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-end mb-3">
                  <Building2 className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Programas Presenciais
                </h3>
                <p className="text-blue-100 text-sm">
                  Realizados dentro de sala e com interação.
                </p>
              </div>
            </div>

            {/* Top Right */}
            <div className="text-left pl-8 lg:pl-16">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 shadow-xl">
                <div className="flex items-center mb-3">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Para evoluir o seu time
                </h3>
                <p className="text-blue-100 text-sm">
                  Desenvolva e retenha os seus talentos.
                </p>
              </div>
            </div>

            {/* Bottom Left */}
            <div className="text-right pr-8 lg:pr-16">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-end mb-3">
                  <Calendar className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Programas Online
                </h3>
                <p className="text-blue-100 text-sm">
                  Evolua sem sair de casa.
                </p>
              </div>
            </div>

            {/* Bottom Right */}
            <div className="text-left pl-8 lg:pl-16">
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 shadow-xl">
                <div className="flex items-center mb-3">
                  <Star className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Experiência Exclusiva
                </h3>
                <p className="text-blue-100 text-sm">
                  Duração de 1 dia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}