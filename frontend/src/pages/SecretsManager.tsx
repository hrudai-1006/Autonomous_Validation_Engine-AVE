import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchSystemStatus, updateSecrets } from '../api/client';
import { Database, Key, CheckCircle, XCircle, Eye, EyeOff, Save } from 'lucide-react';

const SecretsManager = () => {
    const [localSecrets, setLocalSecrets] = useState({
        gemini_api_key: '',
        database_url: ''
    });
    const [showDbUrl, setShowDbUrl] = useState(false);

    const { data: status, refetch, isLoading: isLoadingStatus } = useQuery({
        queryKey: ['systemStatus'],
        queryFn: fetchSystemStatus,
    });

    const mutation = useMutation({
        mutationFn: updateSecrets,
        onSuccess: (data) => {
            alert(data.message || "Secrets updated successfully!");
            refetch();
        },
        onError: (err: any) => {
            alert("Failed to update secrets: " + (err.response?.data?.detail || err.message));
        }
    });

    useEffect(() => {
        if (status) {
            // We don't populate the actual values because the API masks them for security.
            // But we can set placeholders or leave empty for user to input new ones.
        }
    }, [status]);

    const handleSave = () => {
        if (!localSecrets.gemini_api_key || !localSecrets.database_url) {
            alert("Please fill in both fields to update.");
            return;
        }
        if (confirm("Updating secrets will rewrite your .env file. Proceed?")) {
            mutation.mutate(localSecrets);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <header>
                <h2 className="text-3xl font-bold text-white">Secrets & Connections</h2>
                <p className="text-secondary mt-1">Manage API keys and database connections safely.</p>
            </header>

            {/* Status Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Key className="w-6 h-6 text-primary" />
                        <h3 className="text-lg font-bold text-white">Gemini API</h3>
                    </div>
                    {isLoadingStatus ? (
                        <div className="text-gray-400">Checking connection...</div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {status?.gemini === 'connected' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className={status?.gemini === 'connected' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                                {status?.gemini === 'connected' ? 'Connected' : 'Connection Failed'}
                            </span>
                        </div>
                    )}
                    {status?.gemini_message && <p className="text-xs text-red-400 mt-2">{status.gemini_message}</p>}
                    <p className="text-xs text-gray-500 mt-4">Current Key: {status?.masked_gemini_key || 'Not Set'}</p>
                </div>

                <div className="bg-surface border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Database className="w-6 h-6 text-blue-400" />
                        <h3 className="text-lg font-bold text-white">Database</h3>
                    </div>
                    {isLoadingStatus ? (
                        <div className="text-gray-400">Checking connection...</div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {status?.database === 'connected' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className={status?.database === 'connected' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                                {status?.database === 'connected' ? 'Connected' : 'Connection Failed'}
                            </span>
                        </div>
                    )}
                    {status?.database_message && <p className="text-xs text-red-400 mt-2">{status.database_message}</p>}
                    <p className="text-xs text-gray-500 mt-4">URL: {status?.masked_db_url || 'Not Set'}</p>
                </div>
            </div>

            {/* Update Form */}
            <div className="bg-surface border border-gray-800 rounded-xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Update Credentials</h3>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Gemini API Key</label>
                        <input
                            type="password"
                            value={localSecrets.gemini_api_key}
                            onChange={(e) => setLocalSecrets({ ...localSecrets, gemini_api_key: e.target.value })}
                            placeholder="AIza..."
                            className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Database Connection URL</label>
                        <div className="relative">
                            <input
                                type={showDbUrl ? "text" : "password"}
                                value={localSecrets.database_url}
                                onChange={(e) => setLocalSecrets({ ...localSecrets, database_url: e.target.value })}
                                placeholder="postgresql://user:pass@host/db"
                                className="w-full bg-background border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors pr-12"
                            />
                            <button
                                onClick={() => setShowDbUrl(!showDbUrl)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                            >
                                {showDbUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Format: <code>postgresql://user:password@host:port/dbname</code>
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={mutation.isPending}
                            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg text-white font-bold transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {mutation.isPending ? 'Updating...' : 'Update Secrets'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecretsManager;
