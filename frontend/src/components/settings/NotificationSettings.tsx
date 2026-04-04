import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Mail, MessageSquare, TrendingUp, Package, Monitor, FileText, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useSettingsQuery, useUpdateSettingsMutation } from "@/hooks/api/useSettings";

const items = [
    { key: "emailNotifications", label: "Email Notifications", description: "Receive notifications via email", icon: Mail },
    { key: "smsNotifications", label: "SMS Notifications", description: "Receive notifications via text message", icon: MessageSquare },
    { key: "salesAlerts", label: "Sales Alerts", description: "Get notified about new sales and transactions", icon: TrendingUp },
    { key: "inventoryAlerts", label: "Inventory Alerts", description: "Low stock and reorder notifications", icon: Package },
    { key: "systemUpdates", label: "System Updates", description: "POS system updates and maintenance alerts", icon: Monitor },
    { key: "dailyReports", label: "Daily Reports", description: "Receive end-of-day sales summary", icon: FileText },
    { key: "weeklyReports", label: "Weekly Reports", description: "Receive weekly performance reports", icon: FileText },
];

export default function NotificationSettings() {
    const { data: settings, isLoading, refetch } = useSettingsQuery();
    const updateSettingsMutation = useUpdateSettingsMutation();

    const [prefs, setPrefs] = useState({
        emailNotifications: false,
        smsNotifications: false,
        salesAlerts: false,
        inventoryAlerts: false,
        systemUpdates: false,
        dailyReports: false,
        weeklyReports: false,
    });

    useEffect(() => {
        if (settings) {
            console.log("Settings loaded:", settings);
            setPrefs({
                emailNotifications: settings.emailNotifications ?? false,
                smsNotifications: settings.smsNotifications ?? false,
                salesAlerts: settings.salesAlerts ?? false,
                inventoryAlerts: settings.inventoryAlerts ?? false,
                systemUpdates: settings.systemUpdates ?? false,
                dailyReports: settings.dailyReports ?? false,
                weeklyReports: settings.weeklyReports ?? false,
            });
        }
    }, [settings]);

    const handleToggle = (key: string, value: boolean) => {
        setPrefs((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSave = async () => {
        try {
            // Send as nested notifications object to match backend schema
            const body = {
                notifications: {
                    emailNotifications: prefs.emailNotifications,
                    smsNotifications: prefs.smsNotifications,
                    salesAlerts: prefs.salesAlerts,
                    inventoryAlerts: prefs.inventoryAlerts,
                    systemUpdates: prefs.systemUpdates,
                    dailyReports: prefs.dailyReports,
                    weeklyReports: prefs.weeklyReports,
                }
            };
            
            console.log("Saving notification preferences:", body);
            
            await updateSettingsMutation.mutateAsync({ body });
            toast.success("Notification preferences saved");
            
            // Refresh settings to get updated values
            await refetch();
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error(error.message || "Failed to save preferences");
        }
    };

    if (isLoading || !settings) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-xl bg-card p-5 border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-card-foreground">Notification Preferences</h3>
                </div>
                <div className="space-y-1">
                    {items.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.key}>
                                <div className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                                            <p className="text-xs text-muted-foreground">{item.description}</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={prefs[item.key as keyof typeof prefs]}
                                        onCheckedChange={(v) => handleToggle(item.key, v)}
                                    />
                                </div>
                                {i < items.length - 1 && <div className="border-t border-border" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => refetch()}>
                    Reset
                </Button>
                <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
                    {updateSettingsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Preferences
                </Button>
            </div>
        </div>
    );
}