'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateSubscription } from '@/app/actions/update-subscription';

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUsers = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            // Simple hardcoded admin check for MVP
            if (user.email !== 'zhumabekmadi4@gmail.com') {
                router.push('/dashboard');
                return;
            }

            // Fetch users and their subscriptions
            const { data, error } = await supabase
                .from('subscriptions')
                .select(`
                    *,
                    users (
                        email,
                        full_name
                    )
                `);

            if (error) {
                console.error('Error fetching users:', error);
            } else {
                setUsers(data || []);
            }
            setLoading(false);
        };

        fetchUsers();
    }, [router]);

    const handleUpgrade = async (userId: string) => {
        setUpdating(userId);

        // Use Server Action instead of client update to bypass RLS
        try {
            const result = await updateSubscription(userId);

            if (!result.success) {
                alert('Failed to update: ' + result.error);
            } else {
                // Optimistic update / Refresh local state
                setUsers(users.map(u =>
                    u.user_id === userId
                        ? { ...u, tier: 'pro', meetings_limit: 10000, status: 'active' }
                        : u
                ));
                alert('Success! User updated to PRO.');
            }
        } catch (e: any) {
            alert('System Error: ' + e.message);
        }

        setUpdating(null);
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold flex items-center">
                <ShieldCheck className="mr-2 h-6 w-6 text-green-500" />
                Admin Dashboard
            </h1>

            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User / Email</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Limit</TableHead>
                                <TableHead>Used</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="font-medium">{sub.users?.full_name || 'Unknown'}</div>
                                        <div className="text-xs text-zinc-500">{sub.users?.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs ${sub.tier === 'pro' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                            {sub.tier.toUpperCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell>{sub.meetings_limit}</TableCell>
                                    <TableCell>{sub.meetings_used}</TableCell>
                                    <TableCell>
                                        {sub.tier !== 'pro' || sub.meetings_limit < 1000 ? (
                                            <Button
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700"
                                                onClick={() => handleUpgrade(sub.user_id)}
                                                disabled={updating === sub.user_id}
                                            >
                                                {updating === sub.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                                                Make Unlimited
                                            </Button>
                                        ) : (
                                            <span className="text-green-500 text-sm flex items-center">
                                                <ShieldCheck className="h-4 w-4 mr-1" /> VIP
                                            </span>
                                        )}

                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
