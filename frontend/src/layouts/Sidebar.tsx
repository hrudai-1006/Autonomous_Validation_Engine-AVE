import { LayoutDashboard, Users, Settings, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

const Sidebar = () => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Provider Registry', icon: Users, path: '/registry' },
        { name: 'Configuration', icon: Settings, path: '/config' },
    ];

    return (
        <div className="w-64 bg-surface h-screen border-r border-gray-800 flex flex-col fixed left-0 top-0">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Activity className="w-6 h-6" />
                    AVE System
                </h1>
                <p className="text-xs text-secondary mt-1">Autonomous Validation Engine</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            location.pathname === item.path
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "text-gray-400 hover:bg-gray-800 hover:text-white"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">OP</div>
                    <div>
                        <p className="text-sm font-medium text-white">Operator</p>
                        <p className="text-xs text-secondary">Admin Access</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
