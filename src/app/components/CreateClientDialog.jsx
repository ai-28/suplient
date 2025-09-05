"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, UserPlus, Phone, Mail, MapPin, Calendar as CalendarIcon2, User, Briefcase } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Calendar } from "@/app/components/ui/calendar";
import { cn } from "@/app/lib/utils";

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

export function CreateClientDialog() {
  const [isOpen, setIsOpen] = useState(false);
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

      console.log("Client created successfully:", result.client);
      
      // Show success message with temporary password
      alert(`Client created successfully!\n\nClient Details:\nName: ${result.client.name}\nEmail: ${result.client.email}\nTemporary Password: ${result.client.tempPassword}\n\nPlease share the temporary password with the client so they can log in and change it.`);
      
      setIsOpen(false);
      form.reset();
      
      // Optionally refresh the client list or trigger a callback
      // if (onClientCreated) onClientCreated(result.client);
      
    } catch (error) {
      console.error("Error creating client:", error);
      alert(`Error creating client: ${error.message}`);
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
                       </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal bg-background border-border",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            className="rounded-md border"
                          />
                        </PopoverContent>
                      </Popover>
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
                className="border-border hover:bg-muted"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-primary text-white shadow-medium hover:shadow-strong transition-all"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}