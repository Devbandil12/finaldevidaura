import React, { useState, useContext } from "react";
import { ContactContext } from "../contexts/ContactContext";
import { UserContext } from "../contexts/UserContext"; // 🟢 Import UserContext
import { Mail, Phone, MapPin, CheckCircle, Send } from "lucide-react";

const ContactUs = () => {
  // Added 'subject' to the initial state
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    subject: "", 
    message: "" 
  });
  
  const [submitted, setSubmitted] = useState(false);
  
  // Use 'createTicket' instead of the old 'addQuery'
  const { createTicket } = useContext(ContactContext);
  // 🟢 Get user details to link the ticket
  const { userdetails } = useContext(UserContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🟢 Prepare payload with userId if logged in
    const ticketPayload = {
        ...formData,
        userId: userdetails?.id || null 
    };
    
    // Call the new context function to create a ticket
    if (createTicket) {
        await createTicket(ticketPayload);
    } else {
        console.error("createTicket function is missing from ContactContext");
    }

    setSubmitted(true);
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const renderSuccessMessage = () => (
    <div className="text-center flex flex-col items-center justify-center h-full p-8 animate-in fade-in zoom-in duration-500">
      <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
      <h2 className="text-2xl font-bold text-zinc-900">Message Sent!</h2>
      <p className="mt-2 text-gray-600 max-w-sm mx-auto">
        Your support ticket has been created. You can track this conversation in your profile dashboard.
      </p>
      <button
        onClick={() => setSubmitted(false)}
        className="mt-6 inline-block bg-black text-white text-sm font-medium px-6 py-2.5 rounded-md shadow-sm hover:opacity-90 transition-opacity"
      >
        Send Another Message
      </button>
    </div>
  );

  const renderContactForm = () => (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
            />
        </div>
        <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
            />
        </div>
      </div>

      {/* New Subject Field */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
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
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
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
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
        />
      </div>

      <button
        type="submit"
        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all transform active:scale-[0.98]"
      >
        <Send size={16} />
        Submit Ticket
      </button>
    </form>
  );

  return (
    <div className="bg-gray-50 min-h-screen pt-16 sm:pt-20 lg:pt-18 pb-16 sm:pb-20 lg:pb-24 font-sans">
      <div className="max-w-6xl mx-auto px-4">

        {/* Page Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Contact Support
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
            We're here to help. Submit a ticket below and track the conversation directly in your user profile.
          </p>
        </div>

        <div className="relative bg-white w-full shadow-xl rounded-2xl overflow-hidden lg:flex border border-gray-100">
          
          {/* Information Panel (Left Side) */}
          <div className="lg:w-1/3 bg-black text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
            
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-900/30 blur-3xl"></div>
            
            <div className="relative z-10">
                <h2 className="text-2xl font-bold tracking-tight mb-6">Get in Touch</h2>
                <p className="text-gray-300 mb-8 leading-relaxed">
                Have a question about your order, our products, or just want to say hello? Use the form to send us a message.
                </p>
                
                <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Mail className="h-5 w-5 text-indigo-300" />
                    </div>
                    <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Email</h3>
                    <a href="mailto:devidauraofficial@gmail.com" className="text-white hover:text-indigo-200 transition">devidauraofficial@gmail.com</a>
                    </div>
                </div>
                
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Phone className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Phone</h3>
                    <a href="tel:+919406554414" className="text-white hover:text-emerald-200 transition">+91 9406554414</a>
                    </div>
                </div>
                
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <MapPin className="h-5 w-5 text-amber-300" />
                    </div>
                    <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Our Office</h3>
                    <p className="text-white">Gwalior, 474011</p>
                    </div>
                </div>
                </div>
            </div>

            {/* Bottom Note */}
            <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
                <p className="text-xs text-gray-400">
                    Operating Hours: Mon - Sat, 9AM - 6PM
                </p>
            </div>
          </div>

          {/* Form Panel (Right Side) */}
          <div className="lg:w-2/3 p-8 sm:p-12 bg-white">
            {submitted ? renderSuccessMessage() : renderContactForm()}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactUs;