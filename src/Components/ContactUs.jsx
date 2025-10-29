import React, { useState, useContext } from "react";
import { ContactContext } from "../contexts/ContactContext";
import { Mail, Phone, MapPin, CheckCircle, Send } from "lucide-react";

const ContactUs = () => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const { addQuery } = useContext(ContactContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addQuery(formData);
    setSubmitted(true);
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const renderSuccessMessage = () => (
    <div className="text-center flex flex-col items-center justify-center h-full p-8">
      <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
      <h2 className="text-2xl font-bold text-zinc-900">Message Sent!</h2>
      <p className="mt-2 text-gray-600">
        Thank you for reaching out. We'll get back to you as soon as possible.
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
    <form onSubmit={handleSubmit} className="space-y-6">
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
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        />
      </div>
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
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
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
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
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
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        />
      </div>
      <button
        type="submit"
        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-opacity"
      >
        <Send size={16} />
        Send Query
      </button>
    </form>
  );

  return (
    // Added pb-16, sm:pb-20, and lg:pb-24 for bottom padding
    <div className="bg-gray-50 min-h-screen pt-16 sm:pt-20 lg:pt-18 pb-16 sm:pb-20 lg:pb-24">
      <div className="max-w-6xl mx-auto px-4">

        {/* Page Header */}
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 drop-shadow-lg">
            Get In Touch
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-gray-600">
            We'd love to hear from you. Whether you have a question, comment, or just want to say hello, we're here to help.
          </p>
        </div>

        <div className="relative bg-white w-full shadow-lg rounded-lg overflow-hidden lg:flex">
          {/* Information Panel */}
          <div className="lg:w-1/3 bg-black text-white p-8">
            <h2 className="text-3xl font-bold tracking-tight">Get in Touch</h2>
            <p className="mt-4 text-gray-300">
              Have a question or a comment? Use the form to send us a message, or contact us directly.
            </p>
            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <a href="mailto:support@example.com" className="text-gray-300 hover:text-white transition">devidauraofficial@gmail.com</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <a href="tel:+911234567890" className="text-gray-300 hover:text-white transition">+91 9406554414</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold">Our Office</h3>
                  <p className="text-gray-300">Gwalior, 474011</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="lg:w-2/3 p-8">
            {submitted ? renderSuccessMessage() : renderContactForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;