import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchStats, fetchProviders, uploadFile, fetchActiveJob, cancelJob, deleteProvider, fetchValidationById } from '../api/client';
import AgentExecutionStream from '../components/AgentExecutionStream';
import ValidationReportPanel from '../components/ValidationReportPanel';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Activity, StopCircle, Loader2, Trash2, Download } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

const MetricCard = ({ title, value, icon: Icon, color, sub, to }: any) => {
    const Content = (
        <div className="bg-surface border border-gray-800 p-6 rounded-xl shadow-lg flex items-start justify-between h-full hover:border-gray-700 transition-colors cursor-pointer">
            <div>
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <h3 className="text-3xl font-bold mt-2 text-white">{value}</h3>
                {sub && <p className="text-xs text-secondary mt-1">{sub}</p>}
            </div>
            <div className={clsx("p-3 rounded-lg bg-opacity-10", color)}>
                <Icon className={clsx("w-6 h-6", color.replace('bg-', 'text-'))} />
            </div>
        </div>
    );

    return to ? <Link to={to} className="block h-full">{Content}</Link> : Content;
};

const Dashboard = () => {
    const queryClient = useQueryClient();
    const [selectedValidationId, setSelectedValidationId] = useState<number | null>(null);

    const { data: stats } = useQuery({
        queryKey: ['stats'],
        queryFn: fetchStats,
        refetchInterval: 5000
    });

    const { data: providers } = useQuery({
        queryKey: ['providers'],
        queryFn: fetchProviders,
        refetchInterval: 5000
    });

    const { data: activeJob } = useQuery({
        queryKey: ['activeJob'],
        queryFn: fetchActiveJob,
        refetchInterval: 2000  // Poll every 2 seconds for real-time progress
    });

    const uploadMutation = useMutation({
        mutationFn: uploadFile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            queryClient.invalidateQueries({ queryKey: ['agentLogs'] });
            queryClient.invalidateQueries({ queryKey: ['activeJob'] });
        }
    });

    const cancelMutation = useMutation({
        mutationFn: cancelJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeJob'] });
            queryClient.invalidateQueries({ queryKey: ['agentLogs'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProvider,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['providers'] });
        }
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadMutation.mutate(e.target.files[0]);
        }
    };

    const handleCancelJob = () => {
        if (activeJob?.job_id) {
            cancelMutation.mutate(activeJob.job_id);
        }
    };

    // Calculate progress percentage
    const progressPercent = activeJob?.active && activeJob.total_providers > 0
        ? Math.round((activeJob.processed_providers / activeJob.total_providers) * 100)
        : 0;

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Live Validation Operations
                    </h2>
                </div>

            </header>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Profiles"
                    value={stats?.total_profiles || 0}
                    icon={FileText}
                    color="bg-blue-500 text-blue-500"
                    to="/registry"
                />
                <MetricCard
                    title="Validated"
                    value={stats?.validated || 0}
                    icon={CheckCircle}
                    color="bg-green-500 text-green-500"
                    to="/registry?status=Validated"
                />
                <MetricCard
                    title="Action Required"
                    value={stats?.action_required || 0}
                    sub="+ Priority"
                    icon={AlertCircle}
                    color="bg-red-500 text-red-500"
                    to="/registry?status=Flagged"
                />
                <MetricCard
                    title="Avg. Confidence"
                    value={`${stats?.avg_confidence || 0}%`}
                    icon={Activity}
                    color="bg-purple-500 text-purple-500"
                    to="/confidence-explainer"
                />
            </div>

            {/* Validation Progress Bar */}
            {activeJob?.active && (
                <div className="bg-surface border border-primary/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            <div>
                                <h3 className="font-semibold text-white">Validating: {activeJob.filename}</h3>
                                <p className="text-sm text-secondary">
                                    Step: {activeJob.current_step} • {activeJob.processed_providers}/{activeJob.total_providers} providers
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleCancelJob}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 text-sm font-medium transition-colors"
                        >
                            <StopCircle className="w-4 h-4" />
                            Stop
                        </button>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-right text-xs text-secondary mt-2">{progressPercent}% complete</p>
                </div>
            )}

            <div className="grid grid-grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Upload & Queue */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Upload Section */}
                    <div className="bg-surface border border-gray-800 rounded-xl p-8 text-center relative hover:border-primary/50 transition-colors group">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleFileUpload}
                        />
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white">Click to Upload Files</h3>
                                <p className="text-sm text-secondary mt-1">Supports PDF, Images, CSV (Bulk), TXT</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Validation Queue */}
                    <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Recent Validation Queue</h3>
                            <Link to="/registry" className="text-primary text-sm hover:underline">View All</Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-900/50 text-gray-400 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Provider Name</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Confidence</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {providers?.slice(0, 5).map((provider: any) => (
                                        <tr key={provider.id} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium">{provider.full_name}</td>
                                            <td className="px-6 py-4">
                                                <span className={clsx(
                                                    "px-2.5 py-1 rounded-full text-xs font-bold border",
                                                    provider.status === 'Validated'
                                                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                        : "bg-red-500/10 text-red-400 border-red-500/20"
                                                )}>
                                                    {provider.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-24 bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={clsx("h-full rounded-full",
                                                                provider.confidence_score >= 90 ? "bg-green-500" :
                                                                    provider.confidence_score >= 80 ? "bg-yellow-500" : "bg-red-500"
                                                            )}
                                                            style={{ width: `${provider.confidence_score}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-mono">{provider.confidence_score}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => provider.latest_validation_id && setSelectedValidationId(provider.latest_validation_id)}
                                                    disabled={!provider.latest_validation_id}
                                                    className="text-primary hover:text-white font-medium text-xs disabled:opacity-50"
                                                >
                                                    Review
                                                </button>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (!provider.latest_validation_id) return;
                                                        try {
                                                            const report = await fetchValidationById(provider.latest_validation_id);
                                                            const dataStr = JSON.stringify(report, null, 2);
                                                            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                                                            const exportFileDefaultName = `validation_report_${provider.latest_validation_id}.json`;
                                                            const linkElement = document.createElement('a');
                                                            linkElement.setAttribute('href', dataUri);
                                                            linkElement.setAttribute('download', exportFileDefaultName);
                                                            linkElement.click();
                                                        } catch (err) {
                                                            console.error("Failed to download report", err);
                                                            alert("Failed to download report");
                                                        }
                                                    }}
                                                    disabled={!provider.latest_validation_id}
                                                    className="text-blue-400 hover:text-white transition-colors ml-4 p-1 hover:bg-blue-500/10 rounded disabled:opacity-50"
                                                    title="Download Report"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('Are you sure you want to delete this provider?')) {
                                                            deleteMutation.mutate(provider.id);
                                                        }
                                                    }}
                                                    className="text-red-500 hover:text-red-400 transition-colors ml-4 p-1 hover:bg-red-500/10 rounded"
                                                    title="Delete Provider"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Agent Stream */}
                <div className="lg:col-span-1">
                    <AgentExecutionStream />
                </div>
            </div>

            {selectedValidationId && (
                <ValidationReportPanel
                    validationId={selectedValidationId}
                    onClose={() => setSelectedValidationId(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;
