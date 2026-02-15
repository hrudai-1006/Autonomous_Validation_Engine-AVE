import { Save, Shield, Zap } from 'lucide-react';
import clsx from 'clsx';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConfig, updateConfig } from '../api/client';
import { useEffect, useState } from 'react';

const Configuration = () => {
    const queryClient = useQueryClient();
    const [localConfig, setLocalConfig] = useState<any>({
        confidence_threshold: 0.78,
        auto_approve_high_confidence: false,
        fuzzy_matching: true,
        live_registry_enrichment: true,
        extraction_mode: 'batch'
    });

    const { data: configData, isLoading } = useQuery({
        queryKey: ['config'],
        queryFn: fetchConfig,
    });

    // Update local state when data loads
    useEffect(() => {
        if (configData) {
            setLocalConfig(configData);
        }
    }, [configData]);

    const mutation = useMutation({
        mutationFn: updateConfig,
        onSuccess: (data) => {
            queryClient.setQueryData(['config'], data);
            alert("Configuration Saved Successfully!");
        },
        onError: () => {
            alert("Failed to save configuration.");
        }
    });

    const handleSave = () => {
        mutation.mutate(localConfig);
    };

    if (isLoading) return <div className="text-white">Loading configuration...</div>;

    return (
        <div className="space-y-8 max-w-4xl">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">System Configuration</h2>
                    <p className="text-secondary mt-1">Manage agent behavior, thresholds, and integration settings.</p>
                </div>
                <a href="/secrets" className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold">Manage Secrets</span>
                </a>
            </header>

            {/* QA Thresholds */}
            <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-white">Quality Assurance Thresholds</h3>
                </div>
                <div className="p-8 space-y-8">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="font-medium text-white">Minimum Confidence Score</label>
                            <span className="text-primary font-bold">{Math.round(localConfig.confidence_threshold * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={localConfig.confidence_threshold * 100}
                            onChange={(e) => setLocalConfig({ ...localConfig, confidence_threshold: parseInt(e.target.value) / 100.0 })}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <p className="text-xs text-secondary mt-2">Records below this score will be automatically flagged for manual review.</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium text-white block">Auto-Approve High Confidence</label>
                            <p className="text-xs text-secondary mt-1">Automatically validate records scoring 98% or higher.</p>
                        </div>
                        <button
                            onClick={() => setLocalConfig({ ...localConfig, auto_approve_high_confidence: !localConfig.auto_approve_high_confidence })}
                            className={clsx(
                                "w-12 h-6 rounded-full transition-colors relative",
                                localConfig.auto_approve_high_confidence ? "bg-primary" : "bg-gray-700"
                            )}
                        >
                            <div className={clsx(
                                "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform",
                                localConfig.auto_approve_high_confidence ? "translate-x-6" : "translate-x-0"
                            )} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Agent Capabilities */}
            <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex items-center gap-3">
                    <Zap className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-white">Agent Capabilities</h3>
                </div>
                <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium text-white block">Fuzzy Logic Matching</label>
                            <p className="text-xs text-secondary mt-1">Use probabilistic matching for addresses and names (e.g. "St." vs "Street").</p>
                        </div>
                        <button
                            onClick={() => setLocalConfig({ ...localConfig, fuzzy_matching: !localConfig.fuzzy_matching })}
                            className={clsx(
                                "w-12 h-6 rounded-full transition-colors relative",
                                localConfig.fuzzy_matching ? "bg-primary" : "bg-gray-700"
                            )}
                        >
                            <div className={clsx(
                                "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform",
                                localConfig.fuzzy_matching ? "translate-x-6" : "translate-x-0"
                            )} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium text-white block">Live Registry Enrichment</label>
                            <p className="text-xs text-secondary mt-1">Allow agents to query external live APIs (CMS NPI Registry).</p>
                        </div>
                        <button
                            onClick={() => setLocalConfig({ ...localConfig, live_registry_enrichment: !localConfig.live_registry_enrichment })}
                            className={clsx(
                                "w-12 h-6 rounded-full transition-colors relative",
                                localConfig.live_registry_enrichment ? "bg-primary" : "bg-gray-700"
                            )}
                        >
                            <div className={clsx(
                                "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform",
                                localConfig.live_registry_enrichment ? "translate-x-6" : "translate-x-0"
                            )} />
                        </button>
                    </div>



                    <div className="pt-6 border-t border-gray-800">
                        <label className="font-medium text-white block mb-3">Extraction Mode</label>
                        <div className="flex bg-background rounded-lg p-1 border border-gray-800">
                            <button
                                onClick={() => setLocalConfig({ ...localConfig, extraction_mode: 'batch' })}
                                className={clsx(
                                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                                    localConfig.extraction_mode === 'batch'
                                        ? "bg-primary text-white"
                                        : "text-gray-400 hover:text-white"
                                )}
                            >
                                Batch Mode
                            </button>
                            <button
                                onClick={() => setLocalConfig({ ...localConfig, extraction_mode: 'single' })}
                                className={clsx(
                                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                                    localConfig.extraction_mode === 'single'
                                        ? "bg-primary text-white"
                                        : "text-gray-400 hover:text-white"
                                )}
                            >
                                Single Provider
                            </button>
                        </div>
                        <p className="text-xs text-secondary mt-2">
                            Batch: Extract all found providers. Single: Focus on the main provider only.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-[#0D1117] border border-gray-700 rounded-lg text-white font-bold hover:bg-gray-800 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    Save Configuration
                </button>
            </div>
        </div>
    );
};

export default Configuration;
