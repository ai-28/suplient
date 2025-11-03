"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Calendar } from "@/app/components/ui/calendar";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Checkbox } from "@/app/components/ui/checkbox";
import { ArrowLeft, Clock, User, CheckCircle, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/context/LanguageContext";
const generateTimeSlots = () => {
  const slots = [];
  for (let i = 9; i <= 17; i++) {
    if (i === 12 || i === 13) continue; // Skip lunch hours
    const hour = i.toString().padStart(2, '0');
    slots.push(`${hour}:00`);
    if (i < 17) {
      slots.push(`${hour}:30`);
    }
  }
  return slots;
};
const availableSlots = generateTimeSlots();
const coaches = [{
  id: 1,
  name: "Coach Clausen",
  specialization: "Personal Coaching & Therapy",
  avatar: "CC",
  available: true
}, {
  id: 2,
  name: "Dr. Michael Chen",
  specialization: "Trauma Therapy",
  avatar: "MC",
  available: true
}];
export default function BookSession() {
  const router = useRouter();
  const t = useTranslation();
  const [selectedDate, setSelectedDate] = useState(() => new Date(2024, 0, 1));
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCoach, setSelectedCoach] = useState(1);
  const [sessionTopic, setSessionTopic] = useState("");
  const [acceptedConditions, setAcceptedConditions] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  // Set current date after hydration to avoid hydration mismatch
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const handleBookSession = async () => {
    if (!selectedDate || !selectedTime || !sessionTopic.trim() || !acceptedConditions) {
      return;
    }
    setIsBooking(true);

    // Simulate booking process
    setTimeout(() => {
      setIsBooking(false);
      setIsBooked(true);

      // Navigate back after showing success
      setTimeout(() => {
        router.push('/client');
      }, 2000);
    }, 1500);
  };
  if (isBooked) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('sessions.booked', 'Session Booked!')}</h2>
            <p className="text-muted-foreground mb-4">
              {t('sessions.bookedSuccess', "Your session has been scheduled successfully. You'll receive a confirmation email shortly.")}
            </p>
            <div className="text-sm text-muted-foreground">
              <p><strong>{t('common.labels.date', 'Date')}:</strong> {selectedDate?.toLocaleDateString()}</p>
              <p><strong>{t('common.labels.time', 'Time')}:</strong> {selectedTime}</p>
              <p><strong>{t('navigation.coaches', 'Coach')}:</strong> {coaches.find(c => c.id === selectedCoach)?.name}</p>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => router.push('/client')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-4 text-xl font-semibold flex items-center gap-2">
          <Video className="h-5 w-5" />
          {t('sessions.bookVideoCall', 'Book 1-1 Video Call')}
        </h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Select Date */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sessions.selectDate', 'Select Date')}</CardTitle>
            <CardDescription>{t('sessions.chooseDate', 'Choose your preferred date')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={date => date < new Date() || date.getDay() === 0 || date.getDay() === 6} className="rounded-md border" />
          </CardContent>
        </Card>

        {/* Select Time */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sessions.selectTime', 'Select Time')}</CardTitle>
            <CardDescription>{t('sessions.chooseTime', 'Choose your preferred time slot')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {availableSlots.map(slot => <Button key={slot} variant={selectedTime === slot ? "default" : "outline"} size="sm" onClick={() => setSelectedTime(slot)} className={`justify-center h-12 transition-all duration-200 ${selectedTime === slot ? "shadow-lg scale-105 bg-primary hover:bg-primary/90" : "hover:bg-muted hover:scale-102 hover:shadow-md"}`}>
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="font-medium">{slot}</span>
                </Button>)}
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                {t('sessions.durationNotice', '💡 Sessions are 50 minutes long. Please be ready at your scheduled time.')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Session Topic */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sessions.discussTopic', 'What would you like to discuss?')}</CardTitle>
            <CardDescription>{t('sessions.topicDescription', 'Brief topic to help me prepare for our session')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Input placeholder={t('sessions.topicPlaceholder', 'e.g., Work anxiety and coping strategies')} value={sessionTopic} onChange={e => setSessionTopic(e.target.value)} className="w-full" />
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sessions.conditions', 'Session Conditions')}</CardTitle>
            <CardDescription>{t('sessions.conditionsDescription', 'Please review and accept the terms for your 1-1 video session request.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">{t('sessions.details', 'Session Details')}:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {t('sessions.duration', 'Duration')}: {t('sessions.durationValue', '50 minutes')}</li>
                  <li>• {t('sessions.price', 'Price')}: {t('sessions.priceValue', '1,000 DKK')}</li>
                  
                  <li>• {t('sessions.cancellation', 'Cancellation')}: {t('sessions.cancellationNotice', '24 hours notice required')}</li>
                </ul>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="conditions" checked={acceptedConditions} onCheckedChange={checked => setAcceptedConditions(checked)} />
                <Label htmlFor="conditions" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t('sessions.acceptConditions', "I accept the conditions for the paid 1-1 session (1,000 DKK)")}
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Book Button */}
        <div className="pb-6">
          <Button className="w-full" size="lg" onClick={handleBookSession} disabled={!selectedDate || !selectedTime || !sessionTopic.trim() || !acceptedConditions || isBooking}>
            {isBooking ? t('sessions.booking', 'Booking...') : t('sessions.bookVideoCall', 'Book Video Call')}
          </Button>
        </div>
      </div>
    </div>;
}