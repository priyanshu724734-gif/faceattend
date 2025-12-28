"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Clock, QrCode, Camera, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Course {
    _id: string;
    courseCode: string;
    courseName: string;
    classTiming: string;
    studentCount: number;
}

export default function FacultyDashboard() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSession, setActiveSession] = useState<string | null>(null); // Course ID of active session mechanism
    const [attendanceType, setAttendanceType] = useState<'FACE' | 'ONE_CLICK' | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            const coursesData = res.data;
            setCourses(coursesData);

            // Re-sync active sessions
            for (const course of coursesData) {
                const sessionRes = await api.get(`/attendance/active/${course._id}`);
                if (sessionRes.data.active) {
                    setActiveSession(course._id);
                    setSessionId(sessionRes.data.sessionId);
                    setAttendanceType(sessionRes.data.method);
                    break; // Faculty typically only has one active session at a time
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load courses");
        } finally {
            setLoading(false);
        }
    };

    const [sessionId, setSessionId] = useState<string | null>(null);

    const startAttendance = async (courseId: string, type: 'FACE' | 'ONE_CLICK') => {
        try {
            // Get current location
            const getLocation = () => new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            let latitude = 0;
            let longitude = 0;
            try {
                const pos = await getLocation();
                latitude = pos.coords.latitude;
                longitude = pos.coords.longitude;
            } catch (e) {
                console.warn("Could not get location, starting without GPS constraints for faculty");
            }

            const res = await api.post('/attendance/start', {
                courseId,
                attendanceMethod: type,
                latitude,
                longitude
            });

            setActiveSession(courseId);
            setSessionId(res.data._id);
            setAttendanceType(type);
            toast.success(`${type === 'FACE' ? 'Face Scan' : 'One-Click'} Attendance Started`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to start attendance session");
        }
    };

    const stopAttendance = async () => {
        try {
            await api.post('/attendance/stop', { sessionId });
            setActiveSession(null);
            setSessionId(null);
            setAttendanceType(null);
            toast.success("Attendance Stopped & Saved");
        } catch (error) {
            toast.error("Failed to stop attendance");
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <Card key={course._id} className="flex flex-col border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge variant="outline" className="mb-1">{course.courseCode}</Badge>
                                    <CardTitle className="text-xl">{course.courseName}</CardTitle>
                                </div>
                                <Users className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{course.studentCount} Students Registered</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{course.classTiming}</span>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2 flex flex-col gap-2">
                            {activeSession === course._id ? (
                                <Button variant="destructive" className="w-full" onClick={stopAttendance}>
                                    <StopCircle className="mr-2 h-4 w-4" />
                                    Stop Attendance ({attendanceType === 'FACE' ? 'Face' : '1-Click'})
                                </Button>
                            ) : (
                                <div className="flex w-full gap-2">
                                    <Button
                                        variant="default"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => startAttendance(course._id, 'FACE')}
                                        disabled={activeSession !== null}
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        Face Scan
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => startAttendance(course._id, 'ONE_CLICK')}
                                        disabled={activeSession !== null}
                                    >
                                        <QrCode className="mr-2 h-4 w-4" />
                                        One-Click
                                    </Button>
                                </div>
                            )}
                            <div className="flex w-full gap-2 mt-2">
                                <Button variant="outline" className="flex-1 text-[10px] px-1" onClick={() => router.push(`/faculty/courses/${course._id}/students`)}>
                                    Class List
                                </Button>
                                <Button variant="secondary" className="flex-1 text-[10px] px-1" onClick={() => router.push(`/faculty/courses/${course._id}/bulk-attendance`)}>
                                    Bulk Scan
                                </Button>
                                <Button variant="outline" className="flex-1 text-[10px] px-1" onClick={() => router.push(`/faculty/courses/${course._id}/details`)}>
                                    History
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
