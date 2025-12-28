"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    BookOpen,
    UserCheck,
    Plus,
    Search,
    Loader2,
    ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Stats {
    students: number;
    faculty: number;
    courses: number;
}

interface User {
    _id: string;
    name: string;
    email: string;
    enrollmentNumber?: string;
    role: 'STUDENT' | 'FACULTY' | 'ADMIN';
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users')
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
        } catch (err) {
            toast.error("Failed to load admin data");
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Admin</h1>
                    <p className="text-muted-foreground">Manage users, courses, and system stability.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" /> Add New User
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-indigo-50 border-indigo-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-700">Students</CardTitle>
                        <Users className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-900">{stats?.students}</div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Faculty</CardTitle>
                        <UserCheck className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{stats?.faculty}</div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900">{stats?.courses}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                User Management
                            </CardTitle>
                            <CardDescription>View and manage all system users.</CardDescription>
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, ID..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Identifier</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {user.enrollmentNumber || user.email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'FACULTY' ? 'secondary' : 'outline'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No users found matches your search.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
