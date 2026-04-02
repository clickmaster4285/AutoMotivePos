'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/PhoneInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Globe,
  Landmark,
  Building2,
  Mail,
  Home,
  User,
  PhoneCall,
  Info
} from 'lucide-react';
import { Country, State, City } from 'country-state-city';
import { useMemo } from "react";

export const PersonalDetails = ({ formData, updateFormField }) => {

  // Memoized location lists
  const countries = useMemo(() =>
    Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode })), []);

  const states = useMemo(() =>
    formData.address.country
      ? State.getStatesOfCountry(formData.address.country).map(s => ({
        label: s.name,
        value: s.isoCode
      }))
      : [],
    [formData.address.country]
  );

  const cities = useMemo(() =>
    (formData.address.country && formData.address.state)
      ? City.getCitiesOfState(formData.address.country, formData.address.state).map(c => ({
        label: c.name,
        value: c.name
      }))
      : [],
    [formData.address.country, formData.address.state]
  );

  const relationshipOptions = [
    { label: 'Spouse', value: 'Spouse' },
    { label: 'Parent', value: 'Parent' },
    { label: 'Sibling', value: 'Sibling' },
    { label: 'Friend', value: 'Friend' },
    { label: 'Other', value: 'Other' },
  ];

  return (
    <div className="space-y-10">
      {/* Basic Identity */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Basic Identity</h2>
            <p className="text-sm text-muted-foreground">Personal information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={(e) => updateFormField('firstName', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last Name
            </Label>
            <Input
              id="lastName"
              placeholder="Enter last name"
              value={formData.lastName}
              onChange={(e) => updateFormField('lastName', e.target.value)}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <PhoneInput
              value={formData.phone}
              onChange={(val) => updateFormField('phone', val)}
              label="Primary Phone Number"
              placeholder="Enter phone number"
            />
          </div>
        </div>
      </section>

      {/* Residential Address */}
      <section className="space-y-6 pt-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Residential Address</h2>
            <p className="text-sm text-muted-foreground">
              Enter your current residential address
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Country */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Country <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.address.country}
              onValueChange={(val) => {
                updateFormField('address.country', val);
                updateFormField('address.state', '');
                updateFormField('address.city', '');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* State */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              State / Province <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.address.state}
              onValueChange={(val) => {
                updateFormField('address.state', val);
                updateFormField('address.city', '');
              }}
              disabled={!formData.address.country}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={formData.address.country ? "Select State" : "Select Country first"}
                />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              City <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.address.city}
              onValueChange={(val) => updateFormField('address.city', val)}
              disabled={!formData.address.state}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={formData.address.state ? "Select City" : "Select State first"}
                />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zip Code */}
          <div className="space-y-2">
            <Label htmlFor="zip" className="text-sm font-medium flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Zip / Postal Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="zip"
              placeholder="e.g., 10001"
              value={formData.address.zip}
              onChange={(e) => updateFormField('address.zip', e.target.value)}
            />
          </div>

          {/* Street Address */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="street" className="text-sm font-medium flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Street Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="street"
              placeholder="House number, street name, area"
              value={formData.address.street}
              onChange={(e) => updateFormField('address.street', e.target.value)}
            />
          </div>

          {/* Address Line 2 */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="addressLine2" className="text-sm font-medium flex items-center gap-1.5">
              <Home className="h-4 w-4 text-muted-foreground" />
              Apartment / Suite / Unit
              <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Input
              id="addressLine2"
              placeholder="Apartment, suite, unit, building, floor, etc."
              value={formData.address.addressLine2 || ''}
              onChange={(e) => updateFormField('address.addressLine2', e.target.value)}
            />
          </div>
        </div>

        {/* Info Note */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900">
          <Info className="h-5 w-5  shrink-0 mt-0.5" />
          <p className="text-sm  text-gray-900 dark:text-blue-400">
            Please ensure your address is accurate for shipping and verification purposes.
          </p>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-3 mt-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Emergency Contact</h2>
            <p className="text-sm text-muted-foreground">Someone we can contact in case of emergency</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Contact Full Name</Label>
            <Input
              placeholder="Full name of emergency contact"
              value={formData.emergencyContact.name}
              onChange={(e) => updateFormField('emergencyContact.name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Relationship</Label>
            <Select
              value={formData.emergencyContact.relationship}
              onValueChange={(val) => updateFormField('emergencyContact.relationship', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Relationship" />
              </SelectTrigger>
              <SelectContent>
                {relationshipOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <PhoneInput
              value={formData.emergencyContact.phone}
              onChange={(val) => updateFormField('emergencyContact.phone', val)}
              label="Emergency Contact Phone"
              placeholder="Enter phone number"
            />
          </div>
        </div>
      </section>
    </div>
  );
};