"use client"

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Eye, EyeOff, Brain, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const loginImage = "/assets/login.webp";
export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [isClient, setIsClient] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Registration form state
  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState(1); // 1 = basic info, 2 = questionnaire
  
  // Questionnaire state
  const [expectedPlatformBestAt, setExpectedPlatformBestAt] = useState("");
  const [currentClientsPerMonth, setCurrentClientsPerMonth] = useState("");
  const [currentPlatform, setCurrentPlatform] = useState("");

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle redirect when authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      console.log("session", session);
      // Redirect based on user role
      if (session.user.role === 'admin') {
        router.push("/admin/dashboard");
      } else if (session.user.role === 'coach') {
        router.push("/coach/dashboard");
      } else if (session.user.role === 'client') {
        router.push("/client/dashboard");
      } else {
        router.push("/coach/dashboard"); // Default fallback
      }
    }
  }, [status, session, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render the form if already authenticated
  if (status === "authenticated" && session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    
    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        // Handle specific error messages
        console.log('Login error:', result.error);
        if (result.error === "Invalid email" || result.error.includes("Invalid email")) {
          toast.error("❌ Email not found. Please check your email address.", { duration: 5000 });
        } else if (result.error === "Invalid password" || result.error.includes("Invalid password")) {
          toast.error("❌ Incorrect password. Please try again.", { duration: 5000 });
        } else if (result.error === "User is not active" || result.error.includes("not active")) {
          toast.error("❌ Account is deactivated. Please contact support.", { duration: 5000 });
        } else {
          toast.error("❌ Invalid email or password. Please try again.", { duration: 5000 });
        }
      } else if (result?.ok) {
        toast.success("✅ Login successful! Redirecting...", { duration: 3000 });
        // The redirect will be handled by the useEffect above
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("❌ An error occurred during login. Please try again.", { duration: 5000 });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (registerPassword !== confirmPassword) {
      toast.error("❌ Passwords do not match", { duration: 5000 });
      return;
    }

    // Validate password length
    if (registerPassword.length < 8) {
      toast.error("❌ Password must be at least 8 characters long", { duration: 5000 });
      return;
    }
    
    // Move to questionnaire step
    setRegisterStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    
    // Validate questionnaire fields
    if (!expectedPlatformBestAt.trim()) {
      toast.error("❌ Please answer all questions", { duration: 5000 });
      setRegisterLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: registerEmail,
          password: registerPassword,
          phone,
          role: "coach",
          expectedPlatformBestAt,
          currentClientsPerMonth: currentClientsPerMonth ? parseInt(currentClientsPerMonth) : null,
          currentPlatform: currentPlatform || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("✅ Registration successful! We'll review your application and notify you via email.", { duration: 5000 });
      setActiveTab("login");
      
      // Clear form
      setName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");
      setPhone("");
      setExpectedPlatformBestAt("");
      setCurrentClientsPerMonth("");
      setCurrentPlatform("");
      setRegisterStep(1);
      
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(`❌ ${error.message || "Registration failed"}`, { duration: 5000 });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 pl-8">
          <div className="space-y-6">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Brain className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Suplient</h1>
                <p className="text-muted-foreground">Scale your practice, amplify your impact</p>
              </div>
            </div>

            {/* Login Image */}
            <div className="relative w-full max-w-md mx-auto">
              <img 
                src={loginImage} 
                alt="Mental Health Support" 
                className="w-full h-auto rounded-2xl shadow-lg object-cover"
                style={{ maxHeight: '400px' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
            
            <div className="space-y-5">
              <h3 className="text-lg font-medium text-foreground">
                Scaling therapy without losing the human touch
              </h3>
              
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  Suplient helps therapists and coaches scale their impact without sacrificing quality or connection. 
                  Unlike other platforms that focus on automation, we prioritize outcomes and the therapist-client relationship.
                </p>

                <p>
                  We digitize proven therapeutic tools to reduce time per client while increasing care quality. 
                  Serve more clients consistently without burning out.
                </p>

                <p>
                  We're not replacing therapists with AI. We're giving them superpowers. Therapy is evolving — 
                  make sure your practice evolves with it.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex justify-center lg:justify-end lg:pr-8">
          <Card className="w-full max-w-md shadow-2xl border-0">
            <CardHeader className="space-y-4 pb-6">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Suplient</h1>
              </div>
              <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Sign in to your account to continue your mental health journey
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Coach Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="loginEmail">Email</Label>
                      <Input
                        id="loginEmail"
                        type="email"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="loginPassword">Password</Label>
                      <div className="relative">
                        <Input
                          id="loginPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    
                    <Button type="submit" className="w-full h-11" disabled={loginLoading}>
                      {loginLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4">
                  {registerStep === 1 ? (
                    <form onSubmit={handleNextStep} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="registerEmail">Email</Label>
                        <Input
                          id="registerEmail"
                          type="email"
                          placeholder="Enter your email"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="registerPassword">Password</Label>
                        <div className="relative">
                          <Input
                            id="registerPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password (min. 8 characters)"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            required
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <Button type="submit" className="w-full h-11">
                        Next
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          Step 2 of 2: Tell us about yourself
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setRegisterStep(1)}
                          className="p-0 h-auto text-xs"
                        >
                          ← Back
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="expectedPlatformBestAt">
                          What do you expect this platform to be the best at? *
                        </Label>
                        <textarea
                          id="expectedPlatformBestAt"
                          placeholder="Tell us what you're looking for in a coaching platform..."
                          value={expectedPlatformBestAt}
                          onChange={(e) => setExpectedPlatformBestAt(e.target.value)}
                          required
                          rows={4}
                          className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="currentClientsPerMonth">
                          How many clients do you currently have per month?
                        </Label>
                        <Input
                          id="currentClientsPerMonth"
                          type="number"
                          min="0"
                          placeholder="e.g., 10"
                          value={currentClientsPerMonth}
                          onChange={(e) => setCurrentClientsPerMonth(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="currentPlatform">
                          Which platform are you currently using if any?
                        </Label>
                        <Input
                          id="currentPlatform"
                          type="text"
                          placeholder="e.g., Calendly, Zoom, Google Calendar, etc."
                          value={currentPlatform}
                          onChange={(e) => setCurrentPlatform(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      
                      <Button type="submit" className="w-full h-11" disabled={registerLoading}>
                        {registerLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Coach Account"
                        )}
                      </Button>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 text-center text-sm text-muted-foreground">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}