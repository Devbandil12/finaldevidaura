import React from "react";
import "../style/PolicyStyles.css";

export default function RefundPolicy() {
  return (
    <div className="policy-content">
      <h2>Refund Policy</h2>
     <p><em>Last updated: July 18, 2025</em></p>
      <p>At Devid Aura, we strive to ensure your complete satisfaction with every purchase. Given the nature of our products (perfumes), we have the following refund and cancellation guidelines in place:</p>
      
      <h3>1. Order Cancellation &amp; Refunds Before Processing</h3>
      <ul>
        <li>
          <strong>Cancellation Window:</strong> You may cancel an order only before its status
          changes from “Order Placed” to “Processing” (automatically 12 hours after placement).
        </li>
        <li>
          <strong>How to Cancel:</strong> Go to the <em>My Orders</em> page and click the “Cancel”
          button next to your item.
        </li>
        <li>
          <strong>Cancellation Fee:</strong> 5% of the order value (non‑refundable).
        </li>
        <li>
          <strong>Refund Timeline:</strong> Remaining 95% refunded via Razorpay within
          5–7 business days (sometimes instantly).
        </li>
      </ul>

      <h3>2. No Returns or Refunds After Delivery (General)</h3>
      <p>
        Due to hygiene and safety considerations, we do <strong>not</strong> accept returns or
        process refunds once the product is delivered.
      </p>

      <h3>3. Damage or Defective Items</h3>
      <ul>
        <li>
          <strong>Eligibility:</strong> If your perfume arrives damaged or defective.
        </li>
        <li>
          <strong>Proof Required:</strong> A video showing the unboxing starting before the package
          is opened, submitted within <strong>24 hours</strong> of delivery.
        </li>
        <li>
          <strong>Claim Process:</strong> Email{" "}
          <a href="mailto:devidauraofficial@gmail.com">devidauraofficial@gmail.com</a> or call
          customer care with:
          <ol>
            <li>Order number and date</li>
            <li>Unboxing + damage video</li>
            <li>Brief description of the issue</li>
          </ol>
        </li>
        <li>
          <strong>Verification:</strong> We’ll confirm eligibility within 2 business days.
        </li>
        <li>
          <strong>Refund:</strong> Full refund via Razorpay within 5–7 business days if we’re at fault.
        </li>
      </ul>

      <h3>4. Non‑Refundable Situations</h3>
      <ul>
        <li>Change of mind after delivery</li>
        <li>Opened or partially used products (unless defect confirmed before handling)</li>
        <li>Products damaged after delivery due to customer misuse</li>
      </ul>

      <h3>5. Contact &amp; Support</h3>
      <p>
        Email: <a href="mailto:devidauraofficial@gmail.com">devidauraofficial@gmail.com</a><br />
        Customer Care: [Customer Service Number]<br />
        <a href="https://www.devidaura.com/contact-us">Contact Us Page</a>
      </p>
    </div>
  );
}
