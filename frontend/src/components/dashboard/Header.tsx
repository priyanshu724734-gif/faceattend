"use client";

import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, KeyRound, User as UserIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";

interface HeaderProps {
    user: any;
}

export default function Header({ user }: HeaderProps) {
    const { logout } = useAuth();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [changing, setChanging] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setChanging(true);
        try {
            await api.post('/auth/change-password', { oldPassword, newPassword });
            toast.success("Password changed successfully");
            setIsPasswordModalOpen(false);
            setOldPassword("");
            setNewPassword("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setChanging(false);
        }
    }

    return (
        <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-10 shadow-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        AMS
                    </div>
                    <span>AttendanceSystem</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col text-right">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email || user.enrollmentNumber}</span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar>
                                    <AvatarImage src={user.profileImageUrl} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.role}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsPasswordModalOpen(true)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                <span>Change Password</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={logout} className="text-red-600">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Change Password</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleChangePassword} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Old Password</Label>
                                    <Input
                                        type="password"
                                        required
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={changing}>
                                    {changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </header>
    );
}
