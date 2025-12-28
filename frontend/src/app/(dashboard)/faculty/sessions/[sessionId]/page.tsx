"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, RefreshCw, Check, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

interface StudentSession {
    _id: string;
    name: string;
    enrollmentNumber: string;
    status: 'PRESENT' | 'ABSENT';
}

export default function SessionDetailsPage() {
    const { sessionId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ session: any; students: StudentSession[] } | null>(null);

    useEffect(() => {
        fetchDetails();
    }, [sessionId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/session/${sessionId}`);
            setData(res.data);
        } catch (err) {
            toast.error("Failed to load session details");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (studentId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
        try {
            await api.post('/attendance/toggle', {
                sessionId,
                studentId,
                status: newStatus
            });
            // Update local state
            setData(prev => prev ? {
                ...prev,
                students: prev.students.map(s => s._id === studentId ? { ...s, status: newStatus as any } : s)
            } : null);
            toast.success(`Marked as ${newStatus}`);
        } catch (error) {
            toast.error("Correction failed");
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manual Review</h1>
                        <p className="text-muted-foreground">
                            Session on {data?.session && format(new Date(data.session.startTime), "PPP p")}
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDetails}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Attendance Sheet</CardTitle>
                    <CardDescription>Click status to manually override. Useful if face scan failed for a student.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Enrollment No.</TableHead>
                                <TableHead>Student Name</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                                <TableHead className="text-right">Manual Toggle</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.students.map((student) => (
                                <TableRow key={student._id}>
                                    <TableCell className="font-mono">{student.enrollmentNumber}</TableCell>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={student.status === 'PRESENT' ? 'secondary' : 'destructive'} className={student.status === 'PRESENT' ? 'bg-green-100 text-green-800' : ''}>
                                            {student.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleStatus(student._id, student.status)}
                                            className={student.status === 'PRESENT' ? 'text-red-500' : 'text-green-500'}
                                        >
                                            {student.status === 'PRESENT' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                            {student.status === 'PRESENT' ? "Mark Absent" : "Mark Present"}
                                        </Button>
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
