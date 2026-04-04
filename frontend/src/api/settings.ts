// api/settings.api.ts
import { apiFetch } from "@/api/http";

export type ApiSettingsRecord = {
  _id: string;
  companyName: string | null;
  logo: string | null;
  tax: number | null;
  currency: string | null;
  language: string | null;
  timezone: string | null;
  phone: string | null;
  address: string | null;
  // Top-level notification fields (if they exist)
  emailNotifications?: boolean | null;
  smsNotifications?: boolean | null;
  salesAlerts?: boolean | null;
  inventoryAlerts?: boolean | null;
  systemUpdates?: boolean | null;
  dailyReports?: boolean | null;
  weeklyReports?: boolean | null;
  // Nested notifications object (from your API response)
  notifications?: {
    emailNotifications: boolean | null;
    smsNotifications: boolean | null;
    salesAlerts: boolean | null;
    inventoryAlerts: boolean | null;
    systemUpdates: boolean | null;
    dailyReports: boolean | null;
    weeklyReports: boolean | null;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type Settings = {
  id: string;
  companyName: string | null;
  logo: string | null;
  tax: number | null;
  currency: string | null;
  language: string | null;
  timezone: string | null;
  phone: string | null;
  address: string | null;
  emailNotifications: boolean | null;
  smsNotifications: boolean | null;
  salesAlerts: boolean | null;
  inventoryAlerts: boolean | null;
  systemUpdates: boolean | null;
  dailyReports: boolean | null;
  weeklyReports: boolean | null;
};

export type ApiProfileRecord = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  branch?: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  branchId?: string;
  branchName?: string;
  isActive: boolean;
};

export function mapApiSettingsToSettings(s: ApiSettingsRecord): Settings {
  // Get notifications from nested object or top level
  const notifications = s.notifications || {};
  
  return {
    id: s._id,
    companyName: s.companyName,
    logo: s.logo,
    tax: s.tax,
    currency: s.currency,
    language: s.language,
    timezone: s.timezone,
    phone: s.phone,
    address: s.address,
    // Try to get from notifications object first, then top level
    emailNotifications: notifications.emailNotifications ?? s.emailNotifications ?? false,
    smsNotifications: notifications.smsNotifications ?? s.smsNotifications ?? false,
    salesAlerts: notifications.salesAlerts ?? s.salesAlerts ?? false,
    inventoryAlerts: notifications.inventoryAlerts ?? s.inventoryAlerts ?? false,
    systemUpdates: notifications.systemUpdates ?? s.systemUpdates ?? false,
    dailyReports: notifications.dailyReports ?? s.dailyReports ?? false,
    weeklyReports: notifications.weeklyReports ?? s.weeklyReports ?? false,
  };
}


export function mapApiProfileToProfile(p: ApiProfileRecord): Profile {
  return {
    id: p._id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    phone: p.phone,
    role: p.role,
    branchId: p.branch?._id,
    branchName: p.branch?.name,
    isActive: p.isActive,
  };
}

type SettingsResponse = { success?: boolean; data?: ApiSettingsRecord };
type ProfileResponse = { success?: boolean; user?: ApiProfileRecord; message?: string };

// api/settings.api.ts
export async function fetchSettings(): Promise<Settings> {
 ;
  
  try {
    const res = await apiFetch<ApiSettingsRecord>("/api/settings", { method: "GET" });
  
    
    // Fix: The API returns the settings object directly, not wrapped in a data property
    // Check if res is the settings object directly or has a data property
    let settingsData: ApiSettingsRecord;
    
    if (res && typeof res === 'object') {
      // If res has _id, it's the settings object directly
      if ('_id' in res) {
        settingsData = res as ApiSettingsRecord;
       
      } 
      // If res has a data property that contains the settings
      else if ('data' in res && res.data && '_id' in res.data) {
        settingsData = res.data as ApiSettingsRecord;
       
      }
      else {
      
        throw new Error("Settings not found - invalid response format");
      }
    } else {
      throw new Error("Settings not found - empty response");
    }
    
  
    return mapApiSettingsToSettings(settingsData);
  } catch (error) {
    console.error("❌ Error fetching settings:", error);
    throw error;
  }
}




export type UpdateSettingsBody = {
  companyName?: string | null;
  logo?: string | null;
  tax?: number | null;
  currency?: string | null;
  language?: string | null;
  timezone?: string | null;
  phone?: string | null;
  address?: string | null;
  emailNotifications?: boolean | null;
  smsNotifications?: boolean | null;
  salesAlerts?: boolean | null;
  inventoryAlerts?: boolean | null;
  systemUpdates?: boolean | null;
  dailyReports?: boolean | null;
  weeklyReports?: boolean | null;
};

export async function updateSettings(body: UpdateSettingsBody, logoFile?: File): Promise<Settings> {
  const url = "/api/settings";
 
  
  try {
    let responseData: any;
    
    if (logoFile) {
      // Use FormData for file upload
      const formData = new FormData();
      
      // Append all fields to FormData
      Object.entries(body).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // Append the logo file
      formData.append('logo', logoFile);
      
      const res = await apiFetch<any>(url, {
        method: "PUT",
        body: formData,
      });
      responseData = res;
    } else {
      // No file, send as JSON
      const res = await apiFetch<any>(url, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      responseData = res;
    }
    
  
    
    // Handle different response structures
    let settingsData = null;
    
    // Check if response has _id (direct settings object)
    if (responseData && responseData._id) {
      settingsData = responseData;
      
    } 
    // Check if response has data property with _id
    else if (responseData && responseData.data && responseData.data._id) {
      settingsData = responseData.data;
      
    }
    // Check if response has user or settings property
    else if (responseData && responseData.settings && responseData.settings._id) {
      settingsData = responseData.settings;
     
    }
    
    if (!settingsData) {
      console.error("🔴 Could not find settings in response:", responseData);
      throw new Error("Invalid update settings response - no settings data found");
    }
    
   
    const mapped = mapApiSettingsToSettings(settingsData);
    
    return mapped;
  } catch (error) {
    console.error("❌ Error updating settings:", error);
    throw error;
  }
}



export type UpdateProfileBody = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  currentPassword?: string;
  oldPassword?: string;
  newPassword?: string;
};

export async function updateProfile(body: UpdateProfileBody): Promise<Profile> {
  const res = await apiFetch<ProfileResponse>("/api/settings/profile", {
    method: "PUT",
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!res.user) {
    throw new Error("Invalid update profile response");
  }
  return mapApiProfileToProfile(res.user);
}

// Convenience function to upload logo separately if needed
export async function uploadSettingsLogo(file: File): Promise<{ logoPath: string }> {
  const updated = await updateSettings({}, file);
  return { logoPath: updated.logo || '' };
}