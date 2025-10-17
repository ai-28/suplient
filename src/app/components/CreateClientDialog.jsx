"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { UserPlus, Phone, Mail, MapPin, Calendar as CalendarIcon2, User, Briefcase, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";

// Force refresh to clear any cached modules

const getFormSchema = () => z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  address: z.string().min(5, "Address must be at least 5 characters"),
  concerns: z.string().optional(),
  referralSource: z.string().min(1, "Please select how you heard about us"),
});

export function CreateClientDialog({ onClientCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formSchema = getFormSchema();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      concerns: "",
      referralSource: "",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clients/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          address: data.address,
          referralSource: data.referralSource,
          concerns: data.concerns,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create client");
      }
      
      // Show success message with temporary password
      alert(`Client created successfully!\n\nClient Details:\nName: ${result.client.name}\nEmail: ${result.client.email}\nTemporary Password: ${result.client.tempPassword}\n\nPlease share the temporary password with the client so they can log in and change it.`);
      
      setIsOpen(false);
      form.reset();
      
      // Refresh the client list
      if (onClientCreated) {
        onClientCreated(result.client);
      }
      
    } catch (error) {
      console.error("Error creating client:", error);
      alert(`Error creating client: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-[#1A2D4D] shadow-medium border-1px border-[#B6D7D1] hover:shadow-medium hover:text-white transition-all">
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border shadow-strong">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            Create New Client
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-muted">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter name" 
                          className="bg-background border-border focus:border-primary" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                       <FormLabel className="text-foreground font-medium flex items-center gap-2">
                         <Mail className="h-4 w-4" />
                         Email Address
                       </FormLabel>
                       <FormControl>
                         <Input 
                           type="email" 
                           placeholder="Enter email address" 
                           className="bg-background border-border focus:border-primary" 
                           {...field} 
                         />
                       </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                       <FormLabel className="text-foreground font-medium flex items-center gap-2">
                         <Phone className="h-4 w-4" />
                         Phone Number
                       </FormLabel>
                       <FormControl>
                         <Input 
                           placeholder="Enter phone number" 
                           className="bg-background border-border focus:border-primary" 
                           {...field} 
                         />
                       </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                       <FormLabel className="text-foreground font-medium flex items-center gap-2">
                         <CalendarIcon2 className="h-4 w-4" />
                         Date of Birth
                         <span className="text-xs text-muted-foreground font-normal">(Click to open calendar)</span>
                       </FormLabel>
                          <FormControl>
                        <Input
                          type="date"
                          value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : null;
                            field.onChange(date);
                          }}
                            className="bg-background border-border pl-4 pr-4 py-2 h-10 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:border-primary/50 cursor-pointer"
                          max={format(new Date(), "yyyy-MM-dd")}
                          min="1900-01-01"
                          placeholder="Select your date of birth"
                        />
                      </FormControl>
                      {field.value && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Selected: {format(field.value, "EEEE, MMMM do, yyyy")}
                          </div>
                          <div className="text-xs text-primary font-medium">
                            Age: {Math.floor((new Date() - field.value) / (365.25 * 24 * 60 * 60 * 1000))} years old
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                     <FormLabel className="text-foreground font-medium flex items-center gap-2">
                       <MapPin className="h-4 w-4" />
                       Address
                     </FormLabel>
                     <FormControl>
                       <Input 
                         placeholder="Enter full address" 
                         className="bg-background border-border focus:border-primary" 
                         {...field} 
                       />
                     </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Session Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-muted">
                <Briefcase className="h-5 w-5 text-accent" />
                <h3 className="text-lg font-semibold text-foreground">Session Information</h3>
              </div>
              
              <FormField
                control={form.control}
                name="referralSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">How did you hear about us?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select referral source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="google">Google Search</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="doctor">Doctor Recommendation</SelectItem>
                        <SelectItem value="insurance">Insurance Provider</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="concerns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Primary Concerns</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the primary concerns or goals for therapy"
                        className="bg-background border-border focus:border-primary min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-primary text-[#1A2D4D] shadow-medium hover:shadow-strong border-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Client...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Client
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}