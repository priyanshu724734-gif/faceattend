"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Camera, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { io } from "socket.io-client";
import Webcam from "react-webcam";

export default function AttendancePage() {
    const { courseId } = useParams();
    const router = useRouter();
    const [sessionActive, setSessionActive] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [method, setMethod] = useState<'FACE' | 'ONE_CLICK' | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR'>('IDLE');

    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial check for active session
    useEffect(() => {
        const checkActive = async () => {
            try {
                const res = await api.get(`/attendance/active/${courseId}`);
                if (res.data.active) {
                    setSessionActive(true);
                    setSessionId(res.data.sessionId);
                    setMethod(res.data.method);
                }
            } catch (error) {
                console.error("Session check failed");
            } finally {
                setLoading(false);
            }
        };
        checkActive();
    }, [courseId]);

    // Real-time listener
    useEffect(() => {
        const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001');
        socket.emit('join_session', courseId);

        socket.on('attendance_started', (data) => {
            if (data.courseId === courseId) {
                setSessionActive(true);
                setSessionId(data.sessionId);
                setMethod(data.method);
                toast.success("Attendance is now OPEN!");
            }
        });

        socket.on('attendance_stopped', () => {
            setSessionActive(false);
            setSessionId(null);
            toast.warning("Attendance session closed by faculty.");
            router.push('/student');
        });

        return () => {
            socket.disconnect();
        };
    }, [courseId, router]);

    const handleApplyAttendance = async () => {
        if (method === 'FACE' && !imgSrc) {
            const image = webcamRef.current?.getScreenshot();
            if (!image) {
                toast.error("Please ensure camera is active.");
                return;
            }
            // Auto capture and submit
            submit(image);
        } else {
            submit(null);
        }
    };

    const submit = async (faceData: string | null) => {
        setStatus('SUBMITTING');
        try {
            const pos = await new Promise<GeolocationPosition>((res, rej) => {
                navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 });
            });

            await api.post('/attendance/mark', {
                sessionId,
                deviceFingerprint: `${navigator.userAgent}-${screen.width}x${screen.height}-${navigator.language}-${(new Date()).getTimezoneOffset()}`,
                gpsLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                faceImage: faceData,
            });

            setStatus('SUCCESS');
            toast.success("Attendance Marked!");
            setTimeout(() => router.push('/student'), 2000);
        } catch (error: any) {
            setStatus('ERROR');
            toast.error(error.response?.data?.message || "Verification Failed");
            setImgSrc(null);
        }
    };

    if (loading) return null;

    // IF SESSION NOT ACTIVE: DO NOT SHOW ANYTHING (As requested)
    if (!sessionActive && status !== 'SUCCESS') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-600">No Active Attendance</h2>
                <p className="text-gray-400 max-w-xs mt-2">Please wait for the faculty to start the attendance session.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
            {status === 'IDLE' && (
                <div className="w-full max-w-md space-y-6 animate-in fade-in duration-500">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black tracking-tight text-indigo-600">READY TO SCAN</h1>
                        <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest">Secure Face Verification Active</p>
                    </div>

                    {method === 'FACE' && status === 'IDLE' && (
                        <div className="relative aspect-square max-w-[320px] mx-auto bg-black rounded-full overflow-hidden border-4 border-indigo-500 shadow-2xl">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover scale-x-[-1]"
                                videoConstraints={{ facingMode: "user", width: 480, height: 480 }}
                                onUserMediaError={() => toast.error("Hardware error: Camera not accessible")}
                            />
                            <div className="absolute inset-0 border-[40px] border-black/40 rounded-full"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-dashed border-indigo-400/50 rounded-full animate-pulse"></div>
                        </div>
                    )}

                    <Button
                        onClick={handleApplyAttendance}
                        className="w-full h-16 text-xl font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                    >
                        {method === 'FACE' ? "APPLY ATTENDANCE (SCAN)" : "APPLY ATTENDANCE"}
                    </Button>
                </div>
            )}

            {status === 'SUBMITTING' && (
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative h-24 w-24">
                        <Loader2 className="h-24 w-24 animate-spin text-indigo-600" />
                        <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-indigo-600" />
                    </div>
                    <p className="text-lg font-bold animate-pulse">VERIFYING IDENTITY...</p>
                </div>
            )}

            {status === 'SUCCESS' && (
                <div className="flex flex-col items-center space-y-4 animate-in zoom-in-90 duration-300">
                    <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-16 w-16 text-green-600" />
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-black text-green-600">PRESENT</p>
                        <p className="text-muted-foreground">Successfully Verified</p>
                    </div>
                </div>
            )}

            {status === 'ERROR' && (
                <div className="text-center space-y-4">
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-red-600">FAILED</h2>
                    <Button variant="outline" onClick={() => {
                        setStatus('IDLE');
                        setImgSrc(null);
                    }}>Try Again</Button>
                </div>
            )}
        </div>
    );
}
