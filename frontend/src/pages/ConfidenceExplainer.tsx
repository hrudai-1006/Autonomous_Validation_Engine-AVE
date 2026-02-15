import { ArrowLeft, CheckCircle, AlertTriangle, Shield, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConfig, fetchProviders } from '../api/client';

const ConfidenceExplainer = () => {
    const { data: config } = useQuery({
        queryKey: ['config'],
        queryFn: fetchConfig
    });

    const { data: providers } = useQuery({
        queryKey: ['providers'],
        queryFn: fetchProviders
    });

    const threshold = config?.confidence_threshold ? Math.round(config.confidence_threshold * 100) : 78;

    const stats = providers ? providers.reduce((acc: any, p: any) => {
        if (p.confidence_score >= threshold) {
            acc.validated++;
        } else {
            acc.flagged++;
        }
        return acc;
    }, { validated: 0, flagged: 0 }) : { validated: 0, flagged: 0 };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <div>
                <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Confidence Score Calculation</h1>
                        <p className="text-gray-400 text-lg">Understanding how the Autonomous Validation Engine evaluates provider data.</p>
                    </div>
                    {config && (
                        <div className="px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                            <p className="text-xs text-blue-400 font-bold uppercase mb-1">Current System Threshold</p>
                            <p className="text-2xl font-bold text-white">{threshold}%</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Base Score Section */}
            <div className="bg-surface border border-gray-800 rounded-xl p-8 flex items-start gap-6">
                <div className="p-4 bg-green-500/10 rounded-full border border-green-500/20">
                    <Shield className="w-8 h-8 text-green-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white mb-2">Starting Base Score: 100%</h2>
                    <p className="text-gray-400 leading-relaxed">
                        Every validation begins with a perfect score. Deductions are applied based on discrepancies found
                        between the <strong>Extracted Document Data</strong> and the <strong>Official Registry Source</strong>.
                    </p>
                </div>
            </div>

            {/* Deductions Table */}
            <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                    <h3 className="text-lg font-bold text-white">Scoring Penalties</h3>
                    <p className="text-sm text-gray-400 mt-1">Points deducted for specific data mismatches.</p>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-[#0D1117] text-gray-400 font-medium text-sm">
                        <tr>
                            <th className="px-6 py-4">Verification Check</th>
                            <th className="px-6 py-4">Penalty</th>
                            <th className="px-6 py-4">Impact Severity</th>
                            <th className="px-6 py-4">Reasoning</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm">
                        <tr className="hover:bg-gray-800/30">
                            <td className="px-6 py-4 font-medium text-white">Name Mismatch</td>
                            <td className="px-6 py-4 text-red-400 font-mono font-bold">-20 pts</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs border border-red-500/20">Critical</span></td>
                            <td className="px-6 py-4 text-gray-400">Identity could not be confirmed. High risk of fraud or error.</td>
                        </tr>
                        <tr className="hover:bg-gray-800/30">
                            <td className="px-6 py-4 font-medium text-white">License Number Mismatch</td>
                            <td className="px-6 py-4 text-red-400 font-mono font-bold">-15 pts</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs border border-red-500/20">High</span></td>
                            <td className="px-6 py-4 text-gray-400">Credential identifier does not match repository records.</td>
                        </tr>
                        <tr className="hover:bg-gray-800/30">
                            <td className="px-6 py-4 font-medium text-white">Specialty Mismatch (Total)</td>
                            <td className="px-6 py-4 text-orange-400 font-mono font-bold">-10 pts</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-xs border border-orange-500/20">Medium</span></td>
                            <td className="px-6 py-4 text-gray-400">Provider is practicing outside of verified specialty.</td>
                        </tr>
                        <tr className="hover:bg-gray-800/30">
                            <td className="px-6 py-4 font-medium text-white">Specialty (Minor Difference)</td>
                            <td className="px-6 py-4 text-yellow-500 font-mono font-bold">-5 pts</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded text-xs border border-yellow-500/20">Low</span></td>
                            <td className="px-6 py-4 text-gray-400">E.g., "Surgery" vs "General Surgery". Technically accurate but vague.</td>
                        </tr>
                        <tr className="hover:bg-gray-800/30">
                            <td className="px-6 py-4 font-medium text-white">Address Format</td>
                            <td className="px-6 py-4 text-yellow-500 font-mono font-bold">-5 pts</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded text-xs border border-yellow-500/20">Low</span></td>
                            <td className="px-6 py-4 text-gray-400">Location valid but formatting differs (e.g., St vs Street).</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Thresholds */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckCircle className="w-24 h-24" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <h3 className="font-bold text-lg text-white">Validated Status</h3>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-green-400">{threshold} - 100%</span>
                        <span className="text-sm text-gray-500">Score Range</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                        Provider data is considered accurate and verified. Minor address formatting issues are tolerated.
                    </p>
                    <div className="pt-4 border-t border-gray-800">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Matching Profiles:</span>
                            <span className="font-bold text-white">{stats.validated}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-surface border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertTriangle className="w-24 h-24" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <h3 className="font-bold text-lg text-white">Flagged Status</h3>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-red-400">&lt; {threshold}%</span>
                        <span className="text-sm text-gray-500">Score Range</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                        Critical discrepancies found. Requires manual review by an administrator before approval.
                    </p>
                    <div className="pt-4 border-t border-gray-800">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Matching Profiles:</span>
                            <span className="font-bold text-white">{stats.flagged}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Average Calculation Info */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl p-6 flex items-center gap-6">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Activity className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">System-Wide Average Logic</h3>
                    <p className="text-gray-400 text-sm mt-1">
                        The <strong>Avg. Confidence</strong> metric on the dashboard is a dynamic calculation of the mean
                        confidence score across <strong>all active profiles</strong> in the registry. It updates in real-time as
                        new documents are processed. A drop in this metric indicates a recent batch of low-quality documents.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ConfidenceExplainer;
