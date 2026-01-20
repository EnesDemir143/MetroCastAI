import { Info, Cpu, Database, ThermometerSun, Zap } from 'lucide-react';
import { useWeatherStore } from '@/store/useWeatherStore';
import { translations } from '@/utils/translations';

const ProjectInfo = () => {
    const { language } = useWeatherStore();
    const t = translations[language];

    return (
        <div className="space-y-8">
            <div className="relative overflow-hidden rounded-[2rem] glass-darker p-8 border-white/[0.08]">
                <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="relative flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2 rounded-xl">
                            <Info className="text-primary h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-white uppercase italic">{t.theProject}</h3>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                        {t.projectDesc}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="group flex items-start gap-5 p-6 rounded-[1.5rem] glass border-white/[0.05] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300">
                    <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-amber-500/10 transition-colors">
                        <Zap className="text-amber-400 h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-white tracking-wide uppercase">{t.rustBackend}</h4>
                        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{t.rustBackendDesc}</p>
                    </div>
                </div>

                <div className="group flex items-start gap-5 p-6 rounded-[1.5rem] glass border-white/[0.05] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300">
                    <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-primary/10 transition-colors">
                        <Cpu className="text-primary h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-white tracking-wide uppercase">{t.coreIntelligence}</h4>
                        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{t.coreIntelligenceDesc}</p>
                    </div>
                </div>

                <div className="group flex items-start gap-5 p-6 rounded-[1.5rem] glass border-white/[0.05] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300">
                    <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-blue-500/10 transition-colors">
                        <Database className="text-blue-400 h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-white tracking-wide uppercase">{t.cloudBackbone}</h4>
                        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{t.cloudBackboneDesc}</p>
                    </div>
                </div>

                <div className="group flex items-start gap-5 p-6 rounded-[1.5rem] glass border-white/[0.05] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300">
                    <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-orange-500/10 transition-colors">
                        <ThermometerSun className="text-orange-400 h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-white tracking-wide uppercase">{t.nuancedMapping}</h4>
                        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{t.nuancedMappingDesc}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectInfo;
