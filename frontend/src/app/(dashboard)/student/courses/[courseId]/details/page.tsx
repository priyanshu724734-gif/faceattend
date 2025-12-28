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
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface StudentHistoryItem {
    date: string;
    status: 'PRESENT' | 'ABSENT';
    attendanceTaken: boolean;
}

export default function StudentDetailsPage() {
    const { courseId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<StudentHistoryItem[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/reports/${courseId}/student-details`);
                setHistory(res.data);
            } catch (err) {
                toast.error("Failed to load attendance details");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [courseId]);

    const stats = history.reduce((acc, curr) => {
        if (curr.status === 'PRESENT') acc.attended++;
        if (curr.attendanceTaken) acc.total++;
        return acc;
    }, { attended: 0, total: 0 });

    const percentage = stats.total === 0 ? 0 : Math.round((stats.attended / stats.total) * 100);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attendance Details</h1>
                    <p className="text-muted-foreground">Comprehensive view of your class performance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold">Attendance Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-4xl font-bold">{percentage}%</p>
                                <p className="text-muted-foreground text-sm">Overall Attendance</p>
                            </div>
                            <div className="text-right text-sm">
                                <p><span className="font-bold text-green-600">{stats.attended}</span> / {stats.total} Classes</p>
                                <p className="text-muted-foreground">Required: 75%</p>
                            </div>
                        </div>
                        <Progress value={percentage} className={`h-3 ${percentage < 75 ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`} />
                        {percentage < 75 && (
                            <Badge variant="destructive" className="w-full justify-center py-1">
                                Warning: Low Attendance
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground text-center">Classes Attended</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <div className="text-3xl font-bold text-green-600">{stats.attended}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground text-center">Classes Missed</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <div className="text-3xl font-bold text-red-600">{stats.total - stats.attended}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Daily Log
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...history].reverse().map((item, idx) => (
                                <TableRow key={idx}>
                                    <TableCell className="font-medium">
                                        {format(new Date(item.date), "PPP")}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(item.date), "p")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.status === 'PRESENT' ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                <CheckCircle2 className="mr-1 h-3 w-3" /> Present
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="bg-red-100 text-red-800 border-none">
                                                <XCircle className="mr-1 h-3 w-3" /> Absent
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {history.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No attendance logs available for this course.
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
