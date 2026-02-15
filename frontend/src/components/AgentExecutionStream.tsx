import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLogs, clearLogs } from '../api/client';
import clsx from 'clsx';
import { Terminal, Search, FileText, CheckCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

const AgentExecutionStream = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const handleClearLogs = async () => {
        await clearLogs();
        queryClient.invalidateQueries({ queryKey: ['agentLogs'] });
    };

    // Poll logs every 2 seconds
    const { data: logs } = useQuery({
        queryKey: ['agentLogs'],
        queryFn: fetchLogs,
        refetchInterval: 2000,
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const getIcon = (agent: string) => {
        switch (agent) {
            case 'Enrichment Agent': return Search;
            case 'Extraction Agent': return FileText;
            case 'Quality Assurance Agent': return CheckCircle;
            default: return Terminal;
        }
    };

    const getColor = (level: string) => {
        switch (level) {
            case 'ERROR': return 'text-danger';
            case 'WARN': return 'text-warning';
            case 'SUCCESS': return 'text-success';
            default: return 'text-blue-300';
        }
    };

    return (
        <div className="bg-[#0D1117] rounded-lg border border-gray-800 flex flex-col h-[600px] overflow-hidden shadow-2xl">
            <div className="bg-[#161B22] p-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                    <Terminal className="w-4 h-4" />
                    AGENT EXECUTION STREAM
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleClearLogs}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        title="Clear Logs"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-4 scrollbar-hide">
                <AnimatePresence initial={false}>
                    {logs?.slice().reverse().map((log) => { // Reverse to show latest at bottom if API returns desc
                        const Icon = getIcon(log.agent_name);
                        return (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-3"
                            >
                                <span className="text-gray-600 shrink-0 min-w-[60px]">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                </span>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon className="w-3 h-3 text-purple-400" />
                                        <span className="text-purple-400 font-bold uppercase tracking-wider">
                                            {log.agent_name}
                                        </span>
                                    </div>
                                    <p className={clsx("pl-5 border-l-2 border-gray-800", getColor(log.level))}>
                                        {log.message}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {(!logs || logs.length === 0) && (
                    <div className="text-gray-600 text-center mt-20">
                        Waiting for agent activity...
                    </div>
                )}
            </div>
        </div >
    );
};

export default AgentExecutionStream;
