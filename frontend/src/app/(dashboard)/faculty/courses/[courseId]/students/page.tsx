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
import { Loader2, ArrowLeft, Download, Users } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface StudentStats {
    _id: string;
    name: string;
    enrollmentNumber: string;
    attendancePercentage: string;
}

export default function ClassListPage() {
    const { courseId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ totalClasses: number; students: StudentStats[] } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/reports/${courseId}/students`);
                setData(res.data);
            } catch (err) {
                toast.error("Failed to load class list");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    const getAttendanceColor = (percentage: number) => {
        if (percentage >= 75) return "text-green-600 font-bold";
        if (percentage >= 60) return "text-orange-600 font-bold";
        return "text-red-600 font-bold";
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Class List</h1>
                        <p className="text-muted-foreground">Total classes held: {data?.totalClasses}</p>
                    </div>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Registered Students
                    </CardTitle>
                    <CardDescription>
                        A list of all students enrolled in this course and their overall attendance.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Enrollment No.</TableHead>
                                <TableHead>Student Name</TableHead>
                                <TableHead className="text-right">Attendance %</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.students.map((student) => {
                                const percentage = parseFloat(student.attendancePercentage);
                                return (
                                    <TableRow key={student._id}>
                                        <TableCell className="font-mono">{student.enrollmentNumber}</TableCell>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell className={`text-right ${getAttendanceColor(percentage)}`}>
                                            {student.attendancePercentage}%
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {percentage >= 75 ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800">Eligible</Badge>
                                            ) : (
                                                <Badge variant="destructive">Shortage</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {data?.students.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No students enrolled in this course yet.
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
