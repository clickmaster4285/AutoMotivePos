// components/settings/ProfileSettings.tsx
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsQuery, useUpdateSettingsMutation } from "@/hooks/api/useSettings";

// Native data without external libraries
const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "NZD", symbol: "$", name: "New Zealand Dollar" },
  { code: "SGD", symbol: "$", name: "Singapore Dollar" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
];

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "ur", name: "Urdu" },
  { code: "tr", name: "Turkish" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" },
  { code: "no", name: "Norwegian" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
];

// Native timezone data without moment-timezone
const getTimezones = () => {
  try {
    // Use Intl API to get available timezones
    return Intl.supportedValuesOf('timeZone');
  } catch (error) {
    // Fallback timezones if Intl.supportedValuesOf is not available
    return [
      "UTC",
      "America/New_York",
      "America/Los_Angeles",
      "America/Chicago",
      "America/Denver",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Dubai",
      "Asia/Karachi",
      "Asia/Kolkata",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Singapore",
      "Australia/Sydney",
      "Pacific/Auckland",
    ];
  }
};

const getCurrencySymbol = (currencyCode: string): string => {
  const currency = currencies.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

export default function ProfileSettings() {
    const { data: settings, isLoading } = useSettingsQuery();

  
    const updateSettingsMutation = useUpdateSettingsMutation();
    
    const timezones = getTimezones();

    const [form, setForm] = useState({
        companyName: "",
        logo: null as File | null,
        logoPreview: null as string | null,
        tax: 0,
        phone: "",
        address: "",
        currency: "USD",
        language: "en",
        timezone: "UTC",
    });

    useEffect(() => {
        if (settings) {
            setForm({
                companyName: settings.companyName || "",
                logo: null,
                logoPreview: null,
                tax: settings.tax || 0,
                currency: settings.currency || "USD",
                address: settings.address || "",
                phone: settings.phone || "",
                language: settings.language || "en",
                timezone: settings.timezone || "UTC",
            });
        }
    }, [settings]);

    const handleChange = (field: string, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const preview = URL.createObjectURL(file);
            setForm((prev) => ({ ...prev, logo: file, logoPreview: preview }));
        }
    };

    useEffect(() => {
        return () => {
            if (form.logoPreview) {
                URL.revokeObjectURL(form.logoPreview);
            }
        };
    }, [form.logoPreview]);

    const handleSave = async () => {
        const body: any = {
            companyName: form.companyName,
            tax: form.tax,
            currency: form.currency,
            language: form.language,
            timezone: form.timezone,
            phone: form.phone,
            address: form.address,
        };

        Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);

        try {
            await updateSettingsMutation.mutateAsync({
                body: body,
                logoFile: form.logo || undefined
            });
            toast.success("Settings updated successfully");
            // Clear preview after successful save
            setForm(prev => ({ ...prev, logoPreview: null }));
        } catch (err: any) {
            toast.error(err.message || "Failed to update settings");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Logo Section */}
            <div className="flex items-center gap-5 rounded-xl bg-card p-5 border border-border">
                <div className="relative">
                    <Avatar className="h-20 w-20">
                        {form.logoPreview ? (
                            <img
                                src={form.logoPreview}
                                alt="Logo preview"
                                className="h-full w-full object-cover"
                            />
                        ) : settings?.logo ? (
                            <img
                                src={`http://192.168.88.37:6001/uploads/${settings.logo}`}
                                alt="Logo"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                                {form.companyName?.[0] || "C"}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors">
                        <Camera className="h-3.5 w-3.5" />
                        <input type="file" className="hidden" onChange={handleLogoChange} accept="image/*" />
                    </label>
                </div>
                <div>
                    <h3 className="text-base font-semibold text-card-foreground">
                        {form.companyName || "Company Name"}
                    </h3>
                </div>
            </div>

            {/* Company Information */}
            <div className="rounded-xl bg-card p-5 border border-border">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">
                    Company Information
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Company Name</Label>
                        <Input
                            value={form.companyName}
                            placeholder="Enter Company Name"
                            onChange={(e) => handleChange("companyName", e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Tax (%)</Label>
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={form.tax}
                            onChange={(e) => handleChange("tax", parseFloat(e.target.value))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Currency</Label>
                        <select
                            value={form.currency}
                            onChange={(e) => handleChange("currency", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {currencies.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.code} - {c.symbol} ({c.name})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Language</Label>
                        <select
                            value={form.language}
                            onChange={(e) => handleChange("language", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {languages.map((l) => (
                                <option key={l.code} value={l.code}>
                                    {l.name} ({l.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Timezone</Label>
                        <select
                            value={form.timezone}
                            onChange={(e) => handleChange("timezone", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {timezones.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Phone No</Label>
                        <Input
                            type="text"
                            value={form.phone}
                            placeholder="+92 000 0000000"
                            onChange={(e) => handleChange("phone", e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-xs text-muted-foreground">Address</Label>
                        <Textarea
                            placeholder="123 Main St, City, Country"
                            value={form.address}
                            onChange={(e) => handleChange("address", e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
                    {updateSettingsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}