import React from 'react';
import Sidebar from './Sidebar';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-white flex">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
