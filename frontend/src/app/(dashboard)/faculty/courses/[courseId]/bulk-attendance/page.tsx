"use client";

import { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Camera, CheckCircle2, ArrowLeft, Users, Zap } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import Webcam from "react-webcam";

export default function BulkAttendancePage() {
    const { courseId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [mode, setMode] = useState<'UPLOAD' | 'CAMERA'>('UPLOAD');
    const [result, setResult] = useState<{ detectedFaces: number; markedPresent: number } | null>(null);
    const webcamRef = useRef<Webcam>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImage(imageSrc);
        }
    }, [webcamRef]);

    const handleSubmit = async () => {
        if (!image) return;
        setLoading(true);
        try {
            const res = await api.post('/attendance/bulk-recognize', {
                courseId,
                image
            });
            setResult({
                detectedFaces: res.data.detectedFaces,
                markedPresent: res.data.markedPresent
            });
            toast.success("Bulk recognition completed!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Recognition failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bulk Attendance</h1>
                    <p className="text-muted-foreground">Upload a group photo to mark everyone present at once.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            AI Group Recognition
                        </CardTitle>
                        <CardDescription>
                            The system will detect all faces and match them with registered students.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-4">
                            <Button
                                variant={mode === 'UPLOAD' ? 'default' : 'outline'}
                                onClick={() => { setMode('UPLOAD'); setImage(null); }}
                                className="flex-1"
                            >
                                <Upload className="mr-2 h-4 w-4" /> Upload Photo
                            </Button>
                            <Button
                                variant={mode === 'CAMERA' ? 'default' : 'outline'}
                                onClick={() => { setMode('CAMERA'); setImage(null); }}
                                className="flex-1"
                            >
                                <Camera className="mr-2 h-4 w-4" /> Live Camera
                            </Button>
                        </div>

                        <div className="aspect-video bg-muted rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden relative">
                            {image ? (
                                <img src={image} className="w-full h-full object-contain" alt="Preview" />
                            ) : mode === 'CAMERA' ? (
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center p-8">
                                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="max-w-[200px] mx-auto"
                                        onChange={handleFileChange}
                                    />
                                    <p className="mt-2 text-sm text-muted-foreground italic">Try high resolution photos for better accuracy</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        {image && (
                            <Button variant="outline" onClick={() => setImage(null)}>Clear</Button>
                        )}
                        <div className="ml-auto flex gap-2">
                            {mode === 'CAMERA' && !image && (
                                <Button onClick={capture}>Capture Screenshot</Button>
                            )}
                            {image && (
                                <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                                    Start Recognition
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>

                <div className="space-y-6">
                    {result && (
                        <Card className="border-green-200 bg-green-50">
                            <CardHeader>
                                <CardTitle className="text-green-800 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Results
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center text-sm font-medium text-green-700">
                                    <span>Faces Detected:</span>
                                    <span className="text-xl">{result.detectedFaces}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium text-green-700">
                                    <span>Students Matched:</span>
                                    <span className="text-xl text-indigo-700 font-bold">{result.markedPresent}</span>
                                </div>
                                <Button variant="outline" className="w-full bg-white" onClick={() => router.push(`/faculty/courses/${courseId}/history`)}>
                                    View Session Log
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Helpful Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground space-y-2">
                            <p>• Ensure good lighting in the classroom.</p>
                            <p>• Ask students to look towards the camera.</p>
                            <p>• Multiple group photos can be taken to ensure coverage.</p>
                            <p>• System uses 0.4 similarity threshold for high confidence.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
