"use client";

import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Loader2, Camera, CheckCircle, VideoOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";

export default function FaceRegisterPage() {
    const router = useRouter();
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImgSrc(imageSrc);
        }
    }, [webcamRef]);

    const retake = () => setImgSrc(null);

    const handleSubmit = async () => {
        if (!imgSrc) return;
        setLoading(true);
        try {
            await api.post('/face/register', { image: imgSrc });
            setSuccess(true);
            toast.success("Face Registered Successfully");
            setTimeout(() => router.push('/student'), 2000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Registration Failed");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[70vh] p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <CardTitle>Register Face ID</CardTitle>
                    </div>
                    <CardDescription>
                        Ensure your face is clearly visible and well-lit. This will be used for attendance verification.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {success ? (
                        <div className="flex flex-col items-center py-8 text-green-600">
                            <CheckCircle className="h-16 w-16 mb-4" />
                            <p className="text-xl font-bold">Registration Complete</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative aspect-square bg-black rounded-full overflow-hidden flex items-center justify-center border-4 border-indigo-100 mx-auto w-64 h-64">
                                {imgSrc ? (
                                    <img src={imgSrc} alt="captured" className="w-full h-full object-cover" />
                                ) : (
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover"
                                        videoConstraints={{ facingMode: "user" }}
                                    />
                                )}
                            </div>
                            <div className="flex justify-center">
                                {imgSrc ? (
                                    <Button variant="outline" onClick={retake} className="w-full"><VideoOff className="mr-2 h-4 w-4" /> Retake</Button>
                                ) : (
                                    <Button onClick={capture} className="w-full"><Camera className="mr-2 h-4 w-4" /> Capture Photo</Button>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    {!success && (
                        <Button className="w-full" onClick={handleSubmit} disabled={!imgSrc || loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Face Data
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
