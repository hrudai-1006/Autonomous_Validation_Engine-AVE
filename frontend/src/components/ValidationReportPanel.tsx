import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchValidationById, fetchDiscrepancies } from '../api/client';
import { X, CheckCircle, AlertTriangle, ArrowRight, Download } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface Props {
    validationId: number;
    onClose: () => void;
}

const ValidationReportPanel: React.FC<Props> = ({ validationId, onClose }) => {
    const { data: report, isLoading } = useQuery({
        queryKey: ['validation', validationId],
        queryFn: () => fetchValidationById(validationId),
        enabled: !!validationId
    });

    const { data: discrepancies } = useQuery({
        queryKey: ['discrepancies', validationId],
        queryFn: () => fetchDiscrepancies(validationId),
        enabled: !!validationId
    });

    // if (!report && isLoading) return null; // Removed early return to show loading state inside modal

    const handleDownload = () => {
        if (!report) return;

        const dataStr = JSON.stringify(report, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `validation_report_${report.id}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="relative w-full max-w-2xl bg-[#0D1117] h-full shadow-2xl border-l border-gray-800 overflow-y-auto"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-start sticky top-0 bg-[#0D1117] z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Validation Report</h2>
                        <p className="text-sm text-gray-500 font-mono mt-1">ID: val_{report?.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-primary transition-colors"
                            title="Download JSON Report"
                        >
                            <Download className="w-6 h-6" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {(isLoading && !report) ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <p>Loading validation report...</p>
                    </div>
                ) : report ? (
                    <div className="p-8 space-y-8">
                        {/* Score Card */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={clsx(
                                "p-6 rounded-xl border flex flex-col justify-center",
                                report.confidence_score >= 85
                                    ? "bg-green-900/10 border-green-900/50"
                                    : "bg-red-900/10 border-red-900/50"
                            )}>
                                <span className="text-gray-400 text-sm font-medium">Confidence Score</span>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={clsx("text-4xl font-bold", report.confidence_score >= 85 ? "text-green-400" : "text-red-400")}>
                                        {report.confidence_score}%
                                    </span>
                                    {report.confidence_score >= 85
                                        ? <CheckCircle className="w-8 h-8 text-green-500" />
                                        : <AlertTriangle className="w-8 h-8 text-red-500" />
                                    }
                                </div>
                            </div>

                            <div className="bg-surface border border-gray-800 p-6 rounded-xl flex flex-col justify-center">
                                <span className="text-gray-400 text-sm font-medium">Status</span>
                                <div className="mt-2">
                                    <span className={clsx(
                                        "px-3 py-1.5 rounded-full font-bold border",
                                        report.status === 'Validated'
                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                            : "bg-red-500/10 text-red-400 border-red-500/20"
                                    )}>
                                        {report.status}
                                    </span>
                                    <div className="text-xs text-gray-500 mt-2">
                                        Processed via batch upload
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Discrepancies */}
                        {Array.isArray(discrepancies) && discrepancies.length > 0 && (
                            <div className="bg-orange-900/10 border border-orange-900/50 rounded-xl p-5">
                                <h4 className="flex items-center gap-2 text-warning font-bold mb-3">
                                    <AlertTriangle className="w-5 h-5" />
                                    Discrepancies Detected
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-orange-200/80">
                                    {discrepancies.map((d: any, i: number) => {
                                        if (!d) return null;
                                        // Handle object structure from backend
                                        if (typeof d === 'object') {
                                            if (d.field && d.penalty) {
                                                return (
                                                    <li key={i}>
                                                        <span className="font-semibold capitalize">{String(d.field).replace('_', ' ')}:</span> Mismatch detected (-{d.penalty}%)
                                                        <div className="text-xs mt-1 ml-2 opacity-70">
                                                            Ex: <span className="text-red-300">{String(d.extracted || 'N/A')}</span> vs Reg: <span className="text-green-300">{String(d.registry || 'N/A')}</span>
                                                        </div>
                                                    </li>
                                                );
                                            }
                                            // Fallback for other object types
                                            return <li key={i}>{String(d.reason || d.message || JSON.stringify(d))}</li>;
                                        }
                                        // Handle string strings
                                        return <li key={i}>{String(d)}</li>;
                                    })}
                                </ul>
                            </div>
                        )}

                        {/* Data Lineage */}
                        <div>
                            <h3 className="font-bold text-lg mb-4">Data Lineage Comparison</h3>
                            <div className="grid grid-cols-2 gap-8 text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">
                                <div>SOURCE (PDF/OCR)</div>
                                <div>REGISTRY (CMS NPI)</div>
                            </div>

                            <div className="space-y-4">
                                {['full_name', 'npi', 'specialty', 'address', 'license'].map((field) => (
                                    <div key={field} className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center group">
                                        <div className="bg-surface border border-gray-800 p-4 rounded-lg">
                                            <span className="text-xs text-gray-500 capitalize block mb-1">{field.replace('_', ' ')}</span>
                                            <div className="font-medium text-white break-words">
                                                {report.extracted_data?.[field] || "N/A"}
                                            </div>
                                        </div>

                                        <ArrowRight className="w-4 h-4 text-gray-600" />

                                        <div className="bg-surface border border-gray-800 p-4 rounded-lg">
                                            <span className="text-xs text-gray-500 capitalize block mb-1">{field.replace('_', ' ')}</span>
                                            <div className="font-medium text-white break-words">
                                                {(() => {
                                                    const reg = report.registry_data || {};
                                                    switch (field) {
                                                        case 'full_name': return reg.provider_name || reg.full_name || "N/A";
                                                        case 'npi': return reg.npi_number || reg.npi || "N/A";
                                                        case 'specialty': return reg.primary_specialty || reg.specialty || "N/A";
                                                        default: return reg[field] || "N/A";
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <AlertTriangle className="w-12 h-12 mb-4 text-red-500/50" />
                        <p>Report not found or failed to load.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ValidationReportPanel;
