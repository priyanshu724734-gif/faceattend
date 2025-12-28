"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CheckCircle, Camera, Play } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { io } from "socket.io-client";

interface CourseStats {
    totalClasses: number;
    attendedClasses: number;
    missedClasses: number;
    attendancePercentage: string;
}

interface Course {
    _id: string;
    courseCode: string;
    courseName: string;
    classTiming: string;
    stats: CourseStats;
}

interface ActiveSession {
    active: boolean;
    method: 'FACE' | 'ONE_CLICK';
    sessionId: string;
}

export default function StudentDashboard() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSessions, setActiveSessions] = useState<{ [key: string]: ActiveSession }>({});
    const [isFaceRegistered, setIsFaceRegistered] = useState(false);
    const [markingOneClick, setMarkingOneClick] = useState<string | null>(null);

    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001');

        socket.on('attendance_started', (data: any) => {
            setActiveSessions(prev => ({
                ...prev,
                [data.courseId]: { active: true, method: data.method, sessionId: data.sessionId }
            }));
            toast.success(`Attendance started for ${data.courseId}`);
        });

        socket.on('attendance_stopped', () => {
            syncActiveSessions(courses);
        });

        return () => { socket.disconnect(); };
    }, [courses]);

    useEffect(() => {
        fetchData();
        api.get('/face/status').then(res => setIsFaceRegistered(res.data.registered)).catch(console.error);
    }, []);

    const syncActiveSessions = async (courseList: Course[]) => {
        const status: { [key: string]: ActiveSession } = {};
        for (const course of courseList) {
            try {
                const res = await api.get(`/attendance/active/${course._id}`);
                if (res.data.active) {
                    status[course._id] = {
                        active: true,
                        method: res.data.method,
                        sessionId: res.data.sessionId
                    };
                } else {
                    status[course._id] = { active: false, method: 'FACE', sessionId: '' };
                }
            } catch (e) {
                status[course._id] = { active: false, method: 'FACE', sessionId: '' };
            }
        }
        setActiveSessions(status);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/courses');
            const courseList = res.data;
            setCourses(courseList);
            await syncActiveSessions(courseList);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load courses");
        } finally {
            setLoading(false);
        }
    };

    const handleOneClick = async (courseId: string, sessionId: string) => {
        setMarkingOneClick(courseId);
        try {
            const pos = await new Promise<GeolocationPosition>((res, rej) => {
                navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 });
            });

            await api.post('/attendance/mark', {
                sessionId,
                deviceFingerprint: `${navigator.userAgent}-${screen.width}x${screen.height}-${navigator.language}`,
                gpsLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                faceImage: null
            });

            toast.success("Attendance Marked (One-Click)!");
            fetchData(); // Refresh stats
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to mark attendance");
        } finally {
            setMarkingOneClick(null);
        }
    };

    const handleApply = (course: Course) => {
        const session = activeSessions[course._id];
        if (!session || !session.active) return;

        if (session.method === 'ONE_CLICK') {
            handleOneClick(course._id, session.sessionId);
        } else {
            router.push(`/student/courses/${course._id}/attendance`);
        }
    };

    const handleRegisterFace = () => {
        router.push('/student/face-register');
    };

    const getAttendanceColor = (percentage: number) => {
        if (percentage >= 75) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        if (percentage >= 50) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Student Dashboard</h1>
                    <p className="text-muted-foreground font-medium">Welcome back, <span className="text-indigo-600">{user?.name}</span></p>
                </div>
                <Button
                    onClick={handleRegisterFace}
                    disabled={isFaceRegistered}
                    className={isFaceRegistered ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"}
                >
                    <Camera className="mr-2 h-4 w-4" />
                    {isFaceRegistered ? "Face Registered" : "Register Face ID"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => {
                    const percentage = parseFloat(course.stats.attendancePercentage);
                    const session = activeSessions[course._id];
                    const isActive = session?.active;

                    return (
                        <Card key={course._id} className={`flex flex-col shadow-sm transition-all duration-300 ${isActive ? 'ring-2 ring-green-500 shadow-green-100 scale-[1.02]' : 'hover:shadow-md'}`}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Badge variant="outline" className="font-mono text-[10px]">{course.courseCode}</Badge>
                                        <CardTitle className="text-xl font-bold">{course.courseName}</CardTitle>
                                    </div>
                                    <Badge className={`${getAttendanceColor(percentage)} border-none`} variant="secondary">
                                        {course.stats.attendancePercentage}%
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Total</p>
                                        <p className="text-xl font-black">{course.stats.totalClasses}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border-l-2 border-l-green-500">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Present</p>
                                        <p className="text-xl font-black text-green-600">{course.stats.attendedClasses}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                                        <span>Attendance Progress</span>
                                        <span>{percentage}%</span>
                                    </div>
                                    <Progress value={percentage} className="h-1.5" />
                                </div>

                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{course.classTiming}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 pb-6 px-6 flex flex-col gap-2">
                                {isActive ? (
                                    <Button
                                        className="w-full h-12 bg-green-600 hover:bg-green-700 animate-pulse font-black text-white shadow-lg shadow-green-200 rounded-xl"
                                        onClick={() => handleApply(course)}
                                        disabled={markingOneClick === course._id}
                                    >
                                        {markingOneClick === course._id ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                            <>
                                                <Play className="mr-2 h-4 w-4 fill-white" />
                                                APPLY NOW {session.method === 'ONE_CLICK' ? '(1-CLICK)' : '(SCAN)'}
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full h-11 text-slate-400 bg-slate-50/50 border-slate-100 cursor-not-allowed rounded-xl"
                                        disabled
                                    >
                                        Attendance Unavailable
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    className="w-full h-10 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold"
                                    onClick={() => router.push(`/student/courses/${course._id}/details`)}
                                >
                                    View Session History
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
