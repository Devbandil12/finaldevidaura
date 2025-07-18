import React from "react";
import "../style/PolicyStyles.css";

export default function PrivacyPolicy() {
  return (
    <div className="policy-content">
      <h2>Privacy Policy</h2>
     <p><em>Last updated: July 18, 2025</em></p>

      <h3>1. Introduction</h3>
      <p>
        Welcome to Devid Aura ("we," "our," "us"). This Privacy Policy explains how we collect, use, disclose,
        and safeguard your personal information when you visit our e‑commerce website{" "}
        <a href="https://www.devidaura.com">www.devidaura.com</a> (the "Site"). By accessing or using the Site,
        you agree to the terms of this Privacy Policy.
      </p>

      <h3>2. Information We Collect</h3>
      <h4>2.1 Personal Information You Provide</h4>
      <ul>
        <li>Name, billing/shipping address, email address, phone number</li>
        <li>Payment information (credit/debit card details) processed securely through Razorpay</li>
        <li>Account credentials (username and password) when you register via Clerk</li>
        <li>Customer service communications (support requests, survey responses)</li>
      </ul>
      <h4>2.2 Automatically Collected Information</h4>
      <ul>
        <li>Log data: IP address, browser type &amp; version, pages visited, time &amp; date, referral URL</li>
        <li>Device data: device model, operating system, unique device identifiers</li>
        <li>Cookies and similar tracking technologies</li>
      </ul>

      <h3>3. How We Use Your Information</h3>
      <ul>
        <li>Process and fulfill your orders</li>
        <li>Manage your account and customer service inquiries</li>
        <li>Personalize your shopping experience and recommend products</li>
        <li>Communicate promotional offers, newsletters, updates (you may opt out anytime)</li>
        <li>Protect against fraud and maintain site security</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h3>4. Cookies &amp; Tracking Technologies</h3>
      <p>
        We use cookies, web beacons, and similar technologies to remember your preferences, analyze site traffic,
        and serve targeted advertisements. You can disable cookies in your browser settings.
      </p>

      <h3>5. Third‑Party Services</h3>
      <p>
        We share your information with:
      </p>
      <ul>
        <li>Razorpay (payments)</li>
        <li>Clerk (authentication)</li>
        <li>Google Analytics (analytics)</li>
      </ul>
      <p>We currently do not use any delivery partners or email service providers.</p>

      <h3>6. Data Security</h3>
      <p>
        We implement SSL encryption, firewalls, and access controls to protect your personal information from
        unauthorized access, alteration, or destruction.
      </p>

      <h3>7. Data Retention</h3>
      <p>
        We retain your personal information only as long as necessary to fulfill the purposes outlined here
        or as required by law.
      </p>

      <h3>8. Your Rights</h3>
      <p>
        Depending on your jurisdiction, you may have rights to access, correct, delete, object to processing,
        or port your personal data. To exercise these rights, contact us (see Section 12).
      </p>

      <h3>9. Children’s Privacy</h3>
      <p>
        The Site is not directed at children under 16. We do not knowingly collect data from minors; any
        such data will be promptly deleted.
      </p>

      <h3>10. International Data Transfers</h3>
      <p>
        If you are located outside India, your data may be transferred to and processed in India. We ensure
        appropriate safeguards.
      </p>

      <h3>11. Changes to This Privacy Policy</h3>
      <p>
        We may update this policy from time to time. Changes will be posted here with a new “Last updated” date.
      </p>

      <h3>12. Contact Us</h3>
      <p>
        Devid Aura<br />
        Email: <a href="mailto:devidauraofficial@gmail.com">devidauraofficial@gmail.com</a><br />
        Address: [Company Address]<br />
        Phone: [Customer Service Number]
      </p>
    </div>
  );
}
