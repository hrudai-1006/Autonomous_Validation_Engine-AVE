import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProviders, deleteProvider, clearRegistry, fetchValidationById } from '../api/client';
import { Search, Filter, AlertTriangle, CheckCircle, Trash2, ChevronDown, Download } from 'lucide-react';
import clsx from 'clsx';
import ValidationReportPanel from '../components/ValidationReportPanel';

const Registry = () => {
    const { data: providers } = useQuery({
        queryKey: ['providers'],
        queryFn: fetchProviders
    });

    const [search, setSearch] = useState('');
    const [selectedValidationId, setSelectedValidationId] = useState<number | null>(null);
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    // Get status from URL or default to 'All'
    const statusFilter = searchParams.get('status') || 'All';

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this provider?')) {
            await deleteProvider(id);
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    };

    const handleClearAll = async () => {
        if (confirm('Are you sure you want to delete ALL providers? This cannot be undone.')) {
            await clearRegistry();
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    };

    // Registry.tsx imports: `import { useState } from 'react';` `import { useQuery } from '@tanstack/react-query';`
    // I need to add `useQueryClient` to imports.

    const filteredProviders = providers?.filter(p => {
        const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) || p.npi.includes(search);
        const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Provider Registry</h2>
            </div>

            {/* Search & Filter */}
            <div className="bg-surface p-4 rounded-lg border border-gray-800 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by Name, NPI, or File..."
                        className="w-full bg-[#0D1117] border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'All') {
                                searchParams.delete('status');
                                setSearchParams(searchParams);
                            } else {
                                setSearchParams({ status: val });
                            }
                        }}
                        className={clsx(
                            "appearance-none pl-10 pr-10 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:border-primary transition-colors cursor-pointer",
                            statusFilter === 'All'
                                ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                                : "bg-primary/10 border-primary/50 text-primary hover:bg-primary/20"
                        )}
                    >
                        <option value="All" className="bg-gray-900 text-white">All Statuses</option>
                        <option value="Validated" className="bg-gray-900 text-white">Validated</option>
                        <option value="Flagged" className="bg-gray-900 text-white">Flagged</option>
                        <option value="Pending" className="bg-gray-900 text-white">Pending</option>
                    </select>
                    <ChevronDown className={clsx(
                        "absolute right-3 top-3 w-3 h-3 pointer-events-none",
                        statusFilter === 'All' ? "text-gray-400" : "text-primary"
                    )} />
                </div>
                <button
                    onClick={handleClearAll}
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg text-sm font-medium hover:bg-red-900/40 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear Registry
                </button>
            </div>

            {/* Table */}
            <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#0D1117] text-gray-400 font-medium">
                        <tr>
                            <th className="px-6 py-4">Provider</th>
                            <th className="px-6 py-4">NPI</th>
                            <th className="px-6 py-4">Specialty</th>
                            <th className="px-6 py-4">Date Added</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredProviders?.map((provider) => (
                            <tr key={provider.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium">
                                    <div className="font-bold text-white mb-0.5">{provider.full_name}</div>
                                    <div className="text-xs text-gray-500">provider_batch_001.csv</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-gray-400">{provider.npi}</td>
                                <td className="px-6 py-4 text-gray-300">{provider.specialty}</td>
                                <td className="px-6 py-4 text-gray-400">
                                    {new Date(provider.last_updated).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-fit",
                                        provider.status === 'Validated'
                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                    )}>
                                        {provider.status === 'Validated' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                        {provider.status}
                                    </span>
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
                                        onClick={() => handleDelete(provider.id)}
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

            {/* Validation Report Slide-out */}
            {selectedValidationId && (
                <ValidationReportPanel
                    validationId={selectedValidationId}
                    onClose={() => setSelectedValidationId(null)}
                />
            )}
        </div>
    );
};

export default Registry;
