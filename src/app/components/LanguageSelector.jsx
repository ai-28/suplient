"use client"

import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
// Supported languages array
const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' }
];

export function LanguageSelector({ variant = 'card', className }) {
  const [pendingLanguage, setPendingLanguage] = useState('en');

  const handleLanguageChange = (value) => {
    setPendingLanguage(value);
  };

  const handleSaveLanguage = () => {
    // Replace toast with console.log for now
    console.log('Language saved:', pendingLanguage);
  };

  if (variant === 'compact') {
    return (
      <div className={className}>
        <Label htmlFor="language-select">Language</Label>
        <div className="space-y-3">
          <Select value={pendingLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language-select">
              <SelectValue placeholder="Current language" />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pendingLanguage !== 'en' && (
            <Button onClick={handleSaveLanguage} className="w-full">
              Save Changes
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Language</CardTitle>
        <CardDescription>Select your language</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="language-select">Current Language</Label>
          <Select value={pendingLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language-select">
              <SelectValue placeholder="Current Language" />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            Current Language: {supportedLanguages.find(lang => lang.code === 'en')?.nativeName}
          </p>
        </div>

          {pendingLanguage !== 'en' && (
          <Button onClick={handleSaveLanguage} className="w-full">
            Save Changes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}