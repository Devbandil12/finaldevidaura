import React, { useState, useContext } from "react";
import { useUser } from "@clerk/clerk-react";
import { useCreateTicket, useCreateGuestTicket } from "../features/support/hooks/useSupport";
import { useUserDetails } from "../features/users/hooks/useUsers";
import { Mail, Phone, MapPin, CheckCircle, Send, Loader2 } from "lucide-react"; 

const ContactUs = () => {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    subject: "", 
    message: "" 
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // 🟢 1. New Loading State
  
  const { isSignedIn } = useUser();
  const { mutateAsync: createAuthTicket } = useCreateTicket();
  const { mutateAsync: createGuestTicket } = useCreateGuestTicket();
  const { data: userdetails } = useUserDetails();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // 🟢 2. Disable Button Immediately
    
    const ticketPayload = {
        ...formData,
        userId: userdetails?.id || null 
    };
    
    try {
      if (isSignedIn) {
        await createAuthTicket(ticketPayload);
      } else {
        await createGuestTicket(ticketPayload);
      }
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      console.error("Failed to submit ticket:", error);
      // Optional: Add a toast error here if you want
    } finally {
      setIsSubmitting(false); // 🟢 3. Re-enable Button (Always runs)
    }
  };

  const renderSuccessMessage = () => (
    <div className="text-center flex flex-col items-center justify-center h-full p-8 animate-in fade-in zoom-in duration-500">
      <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
      <h2 className="text-2xl font-bold text-[var(--text)]">Message Sent!</h2>
      <p className="mt-2 text-[var(--sub)] max-w-sm mx-auto">
        Your support ticket has been created. You can track this conversation in your profile dashboard.
      </p>
      <button
        onClick={() => setSubmitted(false)}
        className="mt-6 inline-block bg-[var(--brand)] text-[var(--brand-contrast)] text-sm font-medium px-6 py-2.5 rounded-md shadow-sm hover:opacity-90 transition-opacity"
      >
        Send Another Message
      </button>
    </div>
  );

  const renderContactForm = () => (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[var(--sub)] mb-1">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your name"
          required
          disabled={isSubmitting} // Disable input while sending
          className="block w-full rounded-md border-[var(--border)] shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted)]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--sub)] mb-1">
            Email Address
            </label>
            <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            disabled={isSubmitting}
            className="block w-full rounded-md border-[var(--border)] shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted)]"
            />
        </div>
        <div>
            <label htmlFor="phone" className="block text-sm font-medium text-[var(--sub)] mb-1">
            Phone Number
            </label>
            <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
            required
            disabled={isSubmitting}
            className="block w-full rounded-md border-[var(--border)] shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted)]"
            />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-[var(--sub)] mb-1">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="What is this regarding? (e.g., Order #1234, General Inquiry)"
          required
          disabled={isSubmitting}
          className="block w-full rounded-md border-[var(--border)] shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted)]"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-[var(--sub)] mb-1">
          Your Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          placeholder="Type your message here..."
          required
          disabled={isSubmitting}
          className="block w-full rounded-md border-[var(--border)] shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted)]"
        />
      </div>

      {/* 🟢 4. Button Logic: Disabled when submitting, shows Spinner */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-[var(--brand-contrast)] bg-[var(--brand)] transition-all transform ${
            isSubmitting 
            ? "opacity-75 cursor-not-allowed" 
            : "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black active:scale-[0.98]"
        }`}
      >
        {isSubmitting ? (
            <>
                <Loader2 size={16} className="animate-spin" />
                Sending...
            </>
        ) : (
            <>
                <Send size={16} />
                Submit Ticket
            </>
        )}
      </button>
    </form>
  );

  return (
    <div className="bg-[var(--surface-muted)] min-h-screen pt-16 sm:pt-20 lg:pt-18 pb-16 sm:pb-20 lg:pb-24 ">
      <div className="max-w-6xl mx-auto px-4">

        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-[var(--text)] tracking-tight">
            Contact Support
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-[var(--sub)]">
            We're here to help. Submit a ticket below and track the conversation directly in your user profile.
          </p>
        </div>

        <div className="relative bg-[var(--surface)] w-full shadow-[var(--shadow-strong)] rounded-2xl overflow-hidden lg:flex border border-[var(--border)]">
          
          <div className="lg:w-1/3 bg-[var(--brand)] text-[var(--brand-contrast)] p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-900/30 blur-3xl"></div>
            
            <div className="relative z-10">
                <h2 className="text-2xl font-bold tracking-tight mb-6">Get in Touch</h2>
                <p className="text-[var(--muted)] mb-8 leading-relaxed">
                Have a question about your order, our products, or just want to say hello? Use the form to send us a message.
                </p>
                
                <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-[var(--brand-contrast)]/10 rounded-lg">
                        <Mail className="h-5 w-5 text-indigo-300" />
                    </div>
                    <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-[var(--muted)]">Email</h3>
                    <a href="mailto:devidauraofficial@gmail.com" className="text-[var(--brand-contrast)] hover:text-[var(--surface-muted)] transition">devidauraofficial@gmail.com</a>
                    </div>
                </div>
                
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-[var(--brand-contrast)]/10 rounded-lg">
                        <Phone className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-[var(--muted)]">Phone</h3>
                    <a href="tel:+917417711915" className="text-[var(--brand-contrast)] hover:text-[var(--surface-muted)] transition">+91 7417711915</a>
                    </div>
                </div>
                
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-[var(--brand-contrast)]/10 rounded-lg">
                        <MapPin className="h-5 w-5 text-amber-300" />
                    </div>
                    <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-[var(--muted)]">Our Office</h3>
                    <p className="text-[var(--brand-contrast)]">Gwalior, 474011</p>
                    </div>
                </div>
                </div>
            </div>

            <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
                <p className="text-xs text-[var(--muted)]">
                    Operating Hours: Mon - Sat, 9AM - 6PM
                </p>
            </div>
          </div>

          <div className="lg:w-2/3 p-8 sm:p-12 bg-[var(--surface)]">
            {submitted ? renderSuccessMessage() : renderContactForm()}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactUs;