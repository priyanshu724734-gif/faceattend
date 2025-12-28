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
import { Loader2, ArrowLeft, Calendar, UserCheck, UserPlus } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

interface HistoryItem {
    _id: string;
    date: string;
    method: string;
    presentCount: number;
    absentCount: number;
    attendancePercentage: string;
}

export default function FacultyHistoryPage() {
    const { courseId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/reports/${courseId}/history`);
                setHistory(res.data);
            } catch (err) {
                toast.error("Failed to load history");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [courseId]);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Attendance History</h1>
                        <p className="text-muted-foreground">Session-wise attendance records.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{history.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(history.reduce((acc, curr) => acc + parseFloat(curr.attendancePercentage), 0) / (history.length || 1)).toFixed(1)}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Sessions List
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead className="text-right">Present</TableHead>
                                <TableHead className="text-right">Attendance %</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((session) => (
                                <TableRow key={session._id}>
                                    <TableCell className="font-medium">
                                        {format(new Date(session.date), "PPP p")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{session.method}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        <span className="text-green-600">{session.presentCount}</span>
                                        <span className="text-muted-foreground mx-1">/</span>
                                        <span className="text-red-600">{session.absentCount + session.presentCount}</span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {session.attendancePercentage}%
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => router.push(`/faculty/sessions/${session._id}`)}>View Details</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {history.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No attendance sessions recorded yet.
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
