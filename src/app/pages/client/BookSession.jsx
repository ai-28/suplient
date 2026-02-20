"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Calendar } from "@/app/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { ArrowLeft, Clock, User, CheckCircle, Video, Loader2, AlertCircle, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/context/LanguageContext";
import { useClientCoach } from "@/app/hooks/useClientCoach";
import { useSession } from "next-auth/react";
import { toast } from 'sonner';
import { format } from "date-fns";
import { timezones, getTimezoneOffset } from "@/app/lib/timezones";
import { isIOS } from "@/lib/capacitor";

// Time slots available (same as coach side)
// Generate time slots from 01:00 to 23:30 (30-minute intervals)
const generateTimeSlots = () => {
  const slots = [];
  // Hours 1-22: each has :00 and :30
  for (let hour = 1; hour < 23; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  // Hour 23: has :00 and :30
  slots.push('23:00');
  slots.push('23:30');
  return slots;
};

const timeSlots = generateTimeSlots();

export default function BookSession() {
  const router = useRouter();
  const t = useTranslation();
  const { data: session } = useSession();
  const { coach, loading: coachLoading, error: coachError } = useClientCoach();
  
  // Check if running on iOS native app
  const [isIOSNative, setIsIOSNative] = useState(false);
  
  useEffect(() => {
    setIsIOSNative(isIOS());
  }, []);
  
  const [selectedDate, setSelectedDate] = useState();
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionTopic, setSessionTopic] = useState(""); // Not shown in UI, but used for booking
  const [isBooking, setIsBooking] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [meetingType, setMeetingType] = useState("none");
  const [selectedTimezone, setSelectedTimezone] = useState("UTC");
  
  // Payment state
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [sessionPrice, setSessionPrice] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Availability state
  const [availableTimes, setAvailableTimes] = useState([]);
  const [timesLoading, setTimesLoading] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [coachSessions, setCoachSessions] = useState([]);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState([]);

  // Set current date after hydration
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  // Set default timezone and meeting type to coach's settings when coach loads
  useEffect(() => {
    if (coach?.timezone) {
      setSelectedTimezone(coach.timezone);
    } else {
      // Fallback to browser timezone
      setSelectedTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    }
    
    // Set default meeting type from coach's settings
    if (coach?.defaultMeetingType) {
      setMeetingType(coach.defaultMeetingType);
    }
  }, [coach?.timezone, coach?.defaultMeetingType]);

  // Check payment requirement and handle payment success callback
  useEffect(() => {
    const checkPaymentRequirement = async () => {
      if (!coach?.id || !session?.user?.id) return;

      try {
        // Check URL params for payment success
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');
        const coachIdFromUrl = urlParams.get('coachId');

        if (paymentStatus === 'success' && coachIdFromUrl === coach.id) {
          // Payment was successful, get payment intent ID from recent payment
          setCheckingPayment(true);
          const paymentResponse = await fetch(`/api/client/payments?coachId=${coach.id}&productType=one_to_one&limit=1`);
          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            if (paymentData.payments && paymentData.payments.length > 0) {
              const latestPayment = paymentData.payments[0];
              if (latestPayment.status === 'succeeded') {
                setPaymentIntentId(latestPayment.paymentIntentId);
                setPaymentRequired(false); // Payment completed
                toast.success(t('sessions.paymentSuccessful', 'Payment successful! You can now book your session.'));
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
              }
            }
          }
          setCheckingPayment(false);
          return;
        }

        if (paymentStatus === 'canceled') {
          toast.error(t('sessions.paymentCanceled', 'Payment was canceled. Please complete payment to book a session.'));
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        }

        // Check if payment is required
        const productResponse = await fetch(`/api/client/coach/products`);
        if (productResponse.ok) {
          const productData = await productResponse.json();
          const oneToOneProduct = productData.products?.find(p => p.productType === 'one_to_one');
          
          if (oneToOneProduct && oneToOneProduct.amount > 0) {
            setPaymentRequired(true);
            setSessionPrice(oneToOneProduct.amount / 100); // Convert from øre to DKK
            
            // Check if client has a successful payment for this session
            const paymentCheck = await fetch(`/api/client/payments?coachId=${coach.id}&productType=one_to_one&status=succeeded&limit=1`);
            if (paymentCheck.ok) {
              const paymentData = await paymentCheck.json();
              if (paymentData.payments && paymentData.payments.length > 0) {
                const latestPayment = paymentData.payments[0];
                // Check if payment is recent (within last hour) and not linked to a session
                const paymentDate = new Date(latestPayment.createdAt);
                const now = new Date();
                const hoursDiff = (now - paymentDate) / (1000 * 60 * 60);
                
                if (hoursDiff < 1 && !latestPayment.sessionId) {
                  setPaymentIntentId(latestPayment.paymentIntentId);
                  setPaymentRequired(false); // Payment already completed
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking payment requirement:', error);
      }
    };

    checkPaymentRequirement();
  }, [coach?.id, session?.user?.id]);

  // Fetch coach's available times when date changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDate || !coach?.id) {
        setAvailableTimes([]);
        return;
      }

      setTimesLoading(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const response = await fetch(
          `/api/integrations/calendar/availability/coach?date=${dateStr}&coachId=${coach.id}`
        );

        if (response.ok) {
          const data = await response.json();
          
          // Parse working hours if it's a string
          let parsedWorkingHours = data.workingHours;
          let parsedCoachTimezone = data.coachTimezone;
          
          if (typeof parsedWorkingHours === 'string') {
            try {
              const parsed = JSON.parse(parsedWorkingHours);
              if (parsed.hours) {
                parsedWorkingHours = parsed.hours;
                parsedCoachTimezone = parsed.timezone || parsedCoachTimezone;
              } else {
                parsedWorkingHours = parsed;
              }
            } catch (e) {
              parsedWorkingHours = null;
            }
          } else if (parsedWorkingHours && parsedWorkingHours.hours) {
            // If it's an object with hours property
            parsedCoachTimezone = parsedWorkingHours.timezone || parsedCoachTimezone;
            parsedWorkingHours = parsedWorkingHours.hours;
          }
          
          setCoachSessions(data.coachSessions || []);
          setGoogleCalendarEvents(data.googleCalendarEvents || []);
          setCalendarConnected(data.calendarConnected || false);
          
          // Compute available times (including working hours)
          computeAvailableTimes(
            data.coachSessions || [], 
            data.googleCalendarEvents || [],
            parsedWorkingHours || null,
            parsedCoachTimezone || null
          );
        } else {
          setAvailableTimes([]);
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error);
        setAvailableTimes([]);
      } finally {
        setTimesLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, coach?.id, selectedTimezone]);

  const computeAvailableTimes = (dbSessions, calendarEvents, workingHours, coachTimezone) => {
    if (!selectedDate || !selectedTimezone) {
      setAvailableTimes([]);
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    const viewerTZ = selectedTimezone; // Use selected timezone instead of browser timezone
    const coachTZ = coachTimezone || viewerTZ; // Use coach's timezone or fallback to viewer's

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dateObj = new Date(selectedDate);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = dayNames[dayOfWeek];

    // Parse working hours if it's still a string (defensive check)
    let parsedWorkingHours = workingHours;
    if (typeof parsedWorkingHours === 'string') {
      try {
        const parsed = JSON.parse(parsedWorkingHours);
        if (parsed.hours) {
          parsedWorkingHours = parsed.hours;
        } else {
          parsedWorkingHours = parsed;
        }
      } catch (e) {
        parsedWorkingHours = null;
      }
    } else if (parsedWorkingHours && parsedWorkingHours.hours) {
      parsedWorkingHours = parsedWorkingHours.hours;
    }

    // Check if current day has working hours enabled
    let dayWorkingHours = null;
    if (parsedWorkingHours && Array.isArray(parsedWorkingHours) && parsedWorkingHours.length > 0) {
      dayWorkingHours = parsedWorkingHours.find(wh => wh.day === currentDayName);
      
      // If working hours are configured but this day is not found, treat as disabled
      if (!dayWorkingHours) {
        setAvailableTimes([]);
        return;
      }
      
      // If day is disabled in working hours, return empty slots immediately
      if (!dayWorkingHours.enabled) {
        setAvailableTimes([]);
        return;
      }
    }

    // Convert UTC to local for database sessions
    const utcToLocalParts = (dateStrUTC, timeHHMMUTC) => {
      try {
        const iso = `${String(dateStrUTC).slice(0,10)}T${(timeHHMMUTC||'').substring(0,5)}:00Z`;
        const d = new Date(iso);
        const fmt = new Intl.DateTimeFormat('en-CA', {
          timeZone: viewerTZ,
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false
        });
        const parts = Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]));
        return { localDate: `${parts.year}-${parts.month}-${parts.day}`, localTime: `${parts.hour}:${parts.minute}` };
      } catch {
        return { localDate: String(dateStrUTC).slice(0,10), localTime: (timeHHMMUTC||'').substring(0,5) };
      }
    };

    const daySessions = dbSessions
      .map(s => {
        const { localDate, localTime } = utcToLocalParts(s.sessionDate, s.sessionTime);
        return { ...s, _localDate: localDate, _localTime: localTime };
      })
      .filter(s => s._localDate === dateStr);

    // Convert Google Calendar events to time slots (with proper timezone conversion)
    const calendarBusySlots = calendarEvents
      .filter(event => {
        if (event.allDay) return true;
        try {
          // Convert event start to selected timezone for date comparison
          const eventStart = new Date(event.start);
          const fmt = new Intl.DateTimeFormat('en-CA', {
            timeZone: viewerTZ,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false
          });
          const parts = Object.fromEntries(fmt.formatToParts(eventStart).map(p => [p.type, p.value]));
          const eventDate = `${parts.year}-${parts.month}-${parts.day}`;
          return eventDate === dateStr;
        } catch {
          return false;
        }
      })
      .map(event => {
        if (event.allDay) {
          return { start: 0, end: 24 * 60 };
        }
        try {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          
          // Convert to selected timezone for hour/minute extraction
          const startFmt = new Intl.DateTimeFormat('en-US', {
            timeZone: viewerTZ,
            hour: '2-digit', minute: '2-digit', hour12: false
          });
          const endFmt = new Intl.DateTimeFormat('en-US', {
            timeZone: viewerTZ,
            hour: '2-digit', minute: '2-digit', hour12: false
          });
          
          const startParts = Object.fromEntries(startFmt.formatToParts(eventStart).map(p => [p.type, p.value]));
          const endParts = Object.fromEntries(endFmt.formatToParts(eventEnd).map(p => [p.type, p.value]));
          
          const startMinutes = parseInt(startParts.hour) * 60 + parseInt(startParts.minute);
          const endMinutes = parseInt(endParts.hour) * 60 + parseInt(endParts.minute);
          
          return { start: startMinutes, end: endMinutes };
        } catch {
          return null;
        }
      })
      .filter(slot => slot !== null);

    const toMinutes = (hhmm) => {
      if (!hhmm) return 0;
      const [h, m] = hhmm.substring(0, 5).split(':').map(Number);
      return (h * 60) + (m || 0);
    };

    const overlaps = (start, dur) => {
      const end = start + dur;
      
      // Check if outside working hours (convert from coach's timezone to viewer's timezone)
      // Only filter by working hours if they are configured and day is enabled
      // (We already checked for disabled days earlier, so if we get here and workingHours exist, day is enabled)
      // Use parsedWorkingHours instead of workingHours state
      const effectiveWorkingHours = typeof workingHours === 'string' ? parsedWorkingHours : workingHours;
      if (effectiveWorkingHours && Array.isArray(effectiveWorkingHours) && effectiveWorkingHours.length > 0 && dayWorkingHours && dayWorkingHours.enabled) {
        // Convert working hours from coach's timezone to viewer's timezone
        const convertTimeToViewerTZ = (timeHHMM, fromTZ, toTZ, dateStr) => {
          try {
            if (fromTZ === toTZ) {
              return timeHHMM; // No conversion needed
            }
            
            const [hh, mm] = timeHHMM.split(':').map(Number);
            const dateParts = dateStr.split('-');
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            const day = parseInt(dateParts[2]);
            
            // Create a date string representing the time in coach's timezone
            const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`;
            
            // Calculate timezone offset difference
            const refDate = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00Z`);
            
            // Get offset in milliseconds for each timezone
            const getOffset = (tz) => {
              const testUTC = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00Z`);
              const testTZ = new Date(testUTC.toLocaleString('en-US', { timeZone: tz }));
              return testTZ.getTime() - testUTC.getTime();
            };
            
            const offsetFrom = getOffset(fromTZ);
            const offsetTo = getOffset(toTZ);
            const offsetDiff = offsetTo - offsetFrom;
            
            // Create date as if the time is in UTC
            const coachTimeUTC = new Date(`${isoStr}Z`);
            // Adjust by the offset difference to get the equivalent time in viewer's TZ
            const viewerTimeUTC = new Date(coachTimeUTC.getTime() - offsetDiff);
            
            // Format in viewer's timezone
            const viewerFmt = new Intl.DateTimeFormat('en-US', {
              timeZone: toTZ,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
            const viewerParts = Object.fromEntries(viewerFmt.formatToParts(viewerTimeUTC).map(p => [p.type, p.value]));
            return `${viewerParts.hour}:${viewerParts.minute}`;
          } catch (error) {
            console.warn('Timezone conversion failed, using original time:', error);
            return timeHHMM; // Fallback to original time if conversion fails
          }
        };
        
        const workStartViewer = convertTimeToViewerTZ(dayWorkingHours.startTime, coachTZ, viewerTZ, dateStr);
        const workEndViewer = convertTimeToViewerTZ(dayWorkingHours.endTime, coachTZ, viewerTZ, dateStr);
        
        const workStart = toMinutes(workStartViewer);
        const workEnd = toMinutes(workEndViewer);
        
        // If session starts before working hours or ends after working hours
        if (start < workStart || end > workEnd) {
          return true; // Outside working hours
        }
      }
      
      // Check database sessions
      const dbOverlap = daySessions.some(s => {
        const sStart = toMinutes((s._localTime||'').substring(0,5));
        const sEnd = sStart + (s.duration || 60);
        return (start < sEnd) && (end > sStart);
      });
      
      if (dbOverlap) return true;
      
      // Check Google Calendar events
      const calendarOverlap = calendarBusySlots.some(slot => {
        return (start < slot.end) && (end > slot.start);
      });
      
      return calendarOverlap;
    };

    // Generate time slots from 01:00 to 23:30 (30-minute intervals)
    const generateTimeSlots = () => {
      const slots = [];
      // Hours 1-22: each has :00 and :30
      for (let hour = 1; hour < 23; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
      // Hour 23: has :00 and :30
      slots.push('23:00');
      slots.push('23:30');
      return slots;
    };

    const allTimeSlots = generateTimeSlots();
    const dur = 60; // Fixed duration of 60 minutes
    const slots = allTimeSlots.filter(t => {
      const start = toMinutes(t);
      return !overlaps(start, dur);
    });

    setAvailableTimes(slots);

    // Clear selected time if it's no longer available
    if (selectedTime && !slots.includes(selectedTime)) {
      setSelectedTime("");
    }
  };

  const handlePayment = async () => {
    if (!coach?.id) {
      toast.error(t('sessions.coachInfoNotAvailable', "Coach information not available. Please try again."));
      return;
    }

    setProcessingPayment(true);

    try {
      const response = await fetch('/api/payments/create-session-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coachId: coach.id,
          returnUrl: '/client/book-session'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('sessions.failedToCreatePayment', 'Failed to create payment'));
      }

      const data = await response.json();

      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(t('sessions.noCheckoutUrl', 'No checkout URL returned'));
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.message || t('sessions.failedToProcessPayment', 'Failed to process payment'));
      setProcessingPayment(false);
    }
  };

  const handleBookSession = async () => {
    // On iOS native, skip payment checks
    if (!isIOSNative && (!selectedDate || !selectedTime)) {
      toast.error(t('sessions.fillRequiredFields', "Please fill in all required fields."));
      return;
    }
    
    // On iOS native, still require basic fields
    if (isIOSNative && (!selectedDate || !selectedTime)) {
      toast.error(t('sessions.fillRequiredFields', "Please fill in all required fields."));
      return;
    }

    if (!coach?.id) {
      toast.error(t('sessions.coachInfoNotAvailable', "Coach information not available. Please try again."));
      return;
    }

    // On iOS native, skip payment check
    if (!isIOSNative && paymentRequired && !paymentIntentId) {
      if (sessionPrice) {
        toast.info(`Please complete payment of ${sessionPrice.toFixed(2)} DKK to book your session.`);
        await handlePayment();
      } else {
        toast.error(t('sessions.paymentPriceNotAvailable', "Payment is required but price information is not available. Please try again."));
      }
      return;
    }

    setIsBooking(true);

    try {
      const sessionData = {
        title: sessionTopic || t('sessions.sessionWith', 'Session with {name}', { name: coach.name }),
        description: sessionTopic,
        sessionDate: selectedDate.toISOString().split('T')[0],
        sessionTime: selectedTime,
        duration: 60, // Fixed duration of 60 minutes
        meetingType: meetingType,
        notes: sessionTopic,
        timeZone: selectedTimezone,
        paymentIntentId: paymentIntentId // Include payment intent ID if available
      };

      const response = await fetch('/api/sessions/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // If payment is required, redirect to payment instead of showing error
        if (response.status === 402 && errorData.requiresPayment) {
          setIsBooking(false);
          if (sessionPrice) {
            toast.info(`Please complete payment of ${sessionPrice.toFixed(2)} DKK to book your session.`);
            await handlePayment();
          } else {
            toast.error(errorData.message || t('sessions.paymentRequiredBeforeBooking', 'Payment is required before booking'));
            setPaymentRequired(true);
          }
          return;
        }
        
        throw new Error(errorData.error || t('sessions.failedToBookSession', 'Failed to book session'));
      }

      const result = await response.json();

      if (result.success) {
        setIsBooking(false);
        setIsBooked(true);
        toast.success(t('sessions.sessionBookedSuccessfully', "Session booked successfully!"));

        // Navigate back after showing success
        setTimeout(() => {
          router.push('/client');
        }, 3000);
      } else {
        throw new Error(t('sessions.failedToBookSession', 'Failed to book session'));
      }
    } catch (error) {
      console.error('Error booking session:', error);
      toast.error(error.message || t('sessions.failedToBookSessionTryAgain', 'Failed to book session. Please try again.'));
      setIsBooking(false);
    }
  };

  // Loading state
  if (coachLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error state
  if (coachError || !coach) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('sessions.noCoachAssigned', 'No Coach Assigned')}</h2>
            <p className="text-muted-foreground mb-4">
              {coachError || t('sessions.noCoachAssignedMessage', "You don't have a coach assigned. Please contact support.")}
            </p>
            <Button onClick={() => router.push('/client')}>{t('common.actions.goBack', 'Go Back')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isBooked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('sessions.booked', 'Session Booked!')}</h2>
            <p className="text-muted-foreground mb-4">
              {t('sessions.bookedSuccess', "Your session has been scheduled successfully. You'll receive a confirmation email shortly.")}
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>{t('common.labels.date', 'Date')}:</strong> {selectedDate?.toLocaleDateString()}</p>
              <p><strong>{t('common.labels.time', 'Time')}:</strong> {selectedTime}</p>
              <p><strong>{t('navigation.coaches', 'Coach')}:</strong> {coach.name}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - Sticky */}
      <div className="flex items-center p-4 border-b border-border bg-card flex-shrink-0" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}>
        <Button variant="ghost" size="icon" onClick={() => router.push('/client')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-4 text-xl font-semibold flex items-center gap-2">
          <Video className="h-5 w-5" />
          {t('sessions.bookVideoCall', 'Book 1-1 Video Call')}
        </h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="p-4 space-y-6">
        {/* Coach Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sessions.yourCoach', 'Your Coach')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={coach.avatar} />
                <AvatarFallback>{coach.name?.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{coach.name}</p>
                <p className="text-sm text-muted-foreground">{coach.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Select Date */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sessions.selectDate', 'Select Date')}</CardTitle>
            <CardDescription>{t('sessions.chooseDate', 'Choose your preferred date')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar 
              mode="single" 
              selected={selectedDate} 
              onSelect={setSelectedDate} 
              disabled={date => date < new Date()} 
              className="rounded-md border" 
            />
            
            {/* Timezone Selector */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="timezone-select">{t('sessions.timezone', 'Timezone')}</Label>
              <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                <SelectTrigger id="timezone-select">
                  <SelectValue>
                    {timezones.find(tz => tz.value === selectedTimezone)?.label || selectedTimezone} ({getTimezoneOffset(selectedTimezone)})
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {timezones.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Select Time */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('sessions.selectTime', 'Select Time')}</CardTitle>
                <CardDescription>{t('sessions.chooseTime', 'Choose your preferred time slot')}</CardDescription>
              </div>
              {calendarConnected && selectedDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>{t('sessions.syncedWithCoachCalendar', "Synced with Coach's Calendar")}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('sessions.selectDateFirst', 'Please select a date first')}
              </p>
            ) : timesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">{t('sessions.loadingAvailableTimes', 'Loading available times...')}</span>
              </div>
            ) : availableTimes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('sessions.noAvailableTimes', 'No available times for this date. Please select another date.')}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {availableTimes.map(slot => (
                    <Button 
                      key={slot} 
                      variant={selectedTime === slot ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setSelectedTime(slot)} 
                      className={`justify-center h-12 transition-all duration-200 ${
                        selectedTime === slot 
                          ? "shadow-lg scale-105 bg-primary hover:bg-primary/90" 
                          : "hover:bg-muted hover:scale-102 hover:shadow-md"
                      }`}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">{slot}</span>
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  {t('sessions.timesShownIn', 'Times shown in {timezone} ({offset})', { 
                    timezone: timezones.find(tz => tz.value === selectedTimezone)?.label || selectedTimezone,
                    offset: getTimezoneOffset(selectedTimezone)
                  })}
                </p>
              </>
            )}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                {t('sessions.durationNotice', '💡 Sessions are 50 minutes long. Please be ready at your scheduled time.')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Section - Hidden on iOS native */}
        {!isIOSNative && paymentRequired && (
          <Card className={paymentIntentId ? "border-green-500" : "border-orange-500"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {paymentIntentId ? t('sessions.paymentCompleted', 'Payment Completed') : t('sessions.paymentRequired', 'Payment Required')}
              </CardTitle>
              <CardDescription>
                {paymentIntentId 
                  ? t('sessions.paymentCompletedMessage', "Payment completed! You can now book your session.")
                  : sessionPrice 
                    ? `Payment of ${sessionPrice.toFixed(2)} DKK is required before booking a 1-to-1 session. Click the button below to proceed to payment.`
                    : t('sessions.loadingPaymentInfo', "Loading payment information...")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentIntentId ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{t('sessions.paymentSuccessfulLabel', 'Payment Successful')}</span>
                </div>
              ) : sessionPrice ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={processingPayment || checkingPayment}
                >
                  {processingPayment || checkingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('sessions.processing', 'Processing...')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {`Pay ${sessionPrice.toFixed(2)} DKK`}
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">{t('sessions.loadingPaymentInfo', "Loading payment information...")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Book Button */}
        <div>
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleBookSession} 
            disabled={
              !selectedDate || 
              !selectedTime || 
              isBooking || 
              (!isIOSNative && paymentRequired && !paymentIntentId) ||
              checkingPayment
            }
          >
            {isBooking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('sessions.booking', 'Booking...')}
              </>
            ) : (
              t('sessions.bookVideoCall', 'Book Video Call')
            )}
          </Button>
          {!isIOSNative && paymentRequired && !paymentIntentId && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              {t('sessions.completePaymentAbove', 'Please complete payment above to book your session')}
            </p>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

