// components/settings/SecuritySettings.tsx
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Key, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateProfileMutation } from "@/hooks/api/useSettings";
import { useAppState } from "@/providers/AppStateProvider";

export default function SecuritySettings() {
    const { currentUser, applyAdminSession } = useAppState(); // Get user from app state
    const updateProfileMutation = useUpdateProfileMutation();

    // Profile fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // Password fields
    const [currentPassword, setCurrentPassword] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI states
    const [profileChanged, setProfileChanged] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);

    // Initialize form with auth user data
    useEffect(() => {
        if (currentUser) {
            setFirstName(currentUser.name?.split(' ')[0] || "");
            setLastName(currentUser.name?.split(' ')[1] || "");
            setEmail(currentUser.email || "");
            setPhone(currentUser.phone || "");
        }
    }, [currentUser]);

    // Track profile changes
    useEffect(() => {
        if (currentUser) {
            const currentFirstName = currentUser.name?.split(' ')[0] || "";
            const currentLastName = currentUser.name?.split(' ')[1] || "";
            const hasProfileChanges =
                firstName !== currentFirstName ||
                lastName !== currentLastName ||
                email !== (currentUser.email || "") ||
                phone !== (currentUser.phone || "");
            setProfileChanged(hasProfileChanges);
        }
    }, [firstName, lastName, email, phone, currentUser]);

    // Track password changes
    useEffect(() => {
        setPasswordChanged(!!(newPassword || oldPassword || confirmPassword));
    }, [newPassword, oldPassword, confirmPassword]);

    const handleProfileUpdate = async () => {
        // Validate email if changed
        if (email !== currentUser?.email) {
            const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(email)) {
                toast.error("Invalid email format");
                return;
            }
        }

        // If email or phone is changed, currentPassword is required
        if ((email !== currentUser?.email || phone !== currentUser?.phone) && !currentPassword) {
            toast.error("Current password required to change email or phone");
            return;
        }

        const payload: any = {};
        const currentFirstName = currentUser?.name?.split(' ')[0] || "";
        const currentLastName = currentUser?.name?.split(' ')[1] || "";
        
        if (firstName !== currentFirstName) payload.firstName = firstName;
        if (lastName !== currentLastName) payload.lastName = lastName;
        if (email !== currentUser?.email) payload.email = email;
        if (phone !== currentUser?.phone) payload.phone = phone;
        if (currentPassword) payload.currentPassword = currentPassword;

        if (Object.keys(payload).length === 0) {
            toast.info("No changes to update");
            return;
        }

        try {
            const updatedProfile = await updateProfileMutation.mutateAsync(payload);
            toast.success("Profile updated successfully");
            setCurrentPassword("");
            
            // Update the user in app state if needed
            // You may need to update the user in your AppStateProvider
            // For now, we'll just refetch or rely on the next login
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        }
    };

    const handlePasswordChange = async () => {
        if (!oldPassword) {
            toast.error("Old password required");
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            toast.error("New password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            await updateProfileMutation.mutateAsync({
                oldPassword,
                newPassword
            });
            toast.success("Password updated successfully");

            // Clear password fields
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(error.message || "Failed to update password");
        }
    };

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Information */}
            <div className="rounded-xl bg-card p-5 border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-card-foreground">Profile Information</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">First Name</Label>
                        <Input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Last Name</Label>
                        <Input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Phone</Label>
                        <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1234567890"
                        />
                    </div>
                </div>

                {/* Current Password field - only shown when changing email/phone */}
                {(email !== currentUser?.email || phone !== currentUser?.phone) && (
                    <div className="mt-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                                Current Password <span className="text-destructive">*</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                    (Required to change email or phone)
                                </span>
                            </Label>
                            <Input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter your current password"
                                className="max-w-md"
                            />
                        </div>
                    </div>
                )}

                {profileChanged && (
                    <div className="mt-4 flex justify-end">
                        <Button
                            onClick={handleProfileUpdate}
                            disabled={updateProfileMutation.isPending}
                            size="sm"
                        >
                            {updateProfileMutation.isPending && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            )}
                            Update Profile
                        </Button>
                    </div>
                )}
            </div>

            {/* Change Password */}
            <div className="rounded-xl bg-card p-5 border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <Key className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-card-foreground">Change Password</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Old Password</Label>
                        <Input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">New Password</Label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Confirm New Password</Label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                {passwordChanged && (
                    <div className="mt-4 flex justify-end">
                        <Button
                            onClick={handlePasswordChange}
                            disabled={updateProfileMutation.isPending || !oldPassword || !newPassword || newPassword !== confirmPassword}
                            size="sm"
                        >
                            {updateProfileMutation.isPending && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            )}
                            Update Password
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}