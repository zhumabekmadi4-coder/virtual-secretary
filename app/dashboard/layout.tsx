'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Mic, List, LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                router.push('/login');
            } else {
                setUser(user);
            }
        };
        checkAuth();
    }, [router]);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (!user) return null; // Or loading spinner

    const navItems = [
        { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
        { href: '/dashboard/record', label: 'Record', icon: Mic },
        { href: '/dashboard/meetings', label: 'Meetings', icon: List },
    ];

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            {/* Mobile Top Bar */}
            <header className="flex justify-between items-center p-4 border-b border-zinc-800 lg:hidden">
                <div className="text-lg font-bold">Virtual Secretary</div>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5" />
                </Button>
            </header>

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-800 p-4 space-y-4">
                <div className="text-2xl font-bold px-2 mb-6">Secretary.ai</div>
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    {item.label}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>
                <div className="pt-4 border-t border-zinc-800">
                    <div className="flex items-center px-2 mb-4 text-sm text-zinc-400">
                        <User className="mr-2 h-4 w-4" />
                        {user.email}
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 pb-24 lg:pb-4">
                {children}
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-2 lg:hidden z-50">
                <div className="flex justify-around items-center">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} className="flex flex-col items-center p-2">
                                <div className={`p-2 rounded-full transition-colors ${isActive ? 'bg-white text-black' : 'text-zinc-400'}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] mt-1 text-zinc-400">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
