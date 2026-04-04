// pages/UserSettings.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Bell } from "lucide-react";

import ProfileSettings from "@/components/settings/ProfileSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";

export default function UserSettings() {
    return (
        <div className="max-w-4xl">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">User Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your profile, security preferences, and notification settings
                </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="mb-6 bg-card border border-border h-11 p-1 gap-1">
                    <TabsTrigger 
                        value="profile" 
                        className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-4"
                    >
                        <User className="h-3.5 w-3.5" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger 
                        value="security" 
                        className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-4"
                    >
                        <Shield className="h-3.5 w-3.5" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger 
                        value="notifications" 
                        className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-4"
                    >
                        <Bell className="h-3.5 w-3.5" />
                        Notifications
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <ProfileSettings />
                </TabsContent>
                
                <TabsContent value="security">
                    <SecuritySettings />
                </TabsContent>
                
                <TabsContent value="notifications">
                    <NotificationSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}