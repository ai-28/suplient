"use client"

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Loader2, CreditCard, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomPaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [coachName, setCoachName] = useState('');
  const [coachId, setCoachId] = useState(null);
  const [hasCoach, setHasCoach] = useState(true);
  const [loadingCoach, setLoadingCoach] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'client') {
      router.push('/access-denied');
    }
  }, [status, session, router]);

  useEffect(() => {
    // Check for coach parameter in URL first, then fall back to logged-in client's coach
    const fetchCoachInfo = async () => {
      try {
        setLoadingCoach(true);
        
        // Check URL for coach parameter
        const urlParams = new URLSearchParams(window.location.search);
        const coachIdFromUrl = urlParams.get('coach');
        
        let coachData = null;
        
        if (coachIdFromUrl) {
          // Fetch coach by ID from URL parameter
          const response = await fetch(`/api/coach/info?coachId=${coachIdFromUrl}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.coach) {
              coachData = data.coach;
              setCoachId(coachIdFromUrl);
            }
          }
        }
        
        // If no coach from URL, try to get from logged-in client's assigned coach
        if (!coachData && session?.user?.id) {
          const response = await fetch('/api/client/coach');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.coach && data.coach.id) {
              coachData = data.coach;
              setCoachId(data.coach.id);
            }
          }
        }
        
        if (coachData && coachData.name) {
          setCoachName(coachData.name);
          setHasCoach(true);
        } else {
          setHasCoach(false);
        }
      } catch (error) {
        console.error('Error fetching coach info:', error);
        setHasCoach(false);
      } finally {
        setLoadingCoach(false);
      }
    };

    if (status === 'authenticated' || status === 'loading') {
      fetchCoachInfo();
    }
  }, [session, status]);

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch('/api/client/custom-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(parseFloat(amount) * 100), // Convert to øre
          description: description || 'Custom payment',
          coachId: coachId, // Include coach ID from URL or assigned coach
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment');
      }

      const data = await response.json();

      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  if (status === 'loading' || loadingCoach) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!hasCoach) {
    const urlParams = new URLSearchParams(window.location.search);
    const coachIdFromUrl = urlParams.get('coach');
    
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/client/profile?tab=billing')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Custom Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {coachIdFromUrl 
                  ? 'Coach not found or payment account not set up. Please contact the coach directly.'
                  : 'You don\'t have a coach assigned. Please contact support to get assigned to a coach.'}
              </p>
              <Button onClick={() => router.push('/client/profile?tab=billing')}>
                Go to Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => router.push('/client/profile?tab=billing')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Custom Payment
          </CardTitle>
          <CardDescription>
            Make a custom payment to {coachName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="amount">Amount (DKK) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Enter the amount you want to pay
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Payment description or note"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          <Button
            onClick={handlePayment}
            disabled={processing || !amount || parseFloat(amount) <= 0}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {amount ? `${parseFloat(amount).toFixed(2)} DKK` : ''}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

