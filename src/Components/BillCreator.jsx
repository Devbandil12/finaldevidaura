import React, { useState } from "react";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// PDF Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 12,
    padding: 30,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  brand: { fontSize: 28, color: "#b76e79", fontWeight: "bold" },
  tagline: { fontSize: 14, fontStyle: "italic", color: "#555" },
  sectionBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f2f2f2",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    padding: 5,
    marginBottom: 2,
  },
  tableRow: { flexDirection: "row", padding: 5, borderBottomWidth: 0.5, borderColor: "#ccc" },
  cell: { flex: 1 },
  total: {
    marginTop: 10,
    textAlign: "right",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    textAlign: "center",
    fontSize: 10,
    color: "#555",
    marginTop: 20,
  },
});

// PDF Document Component
const PDFInvoice = ({ user, deliveryPartner, products, invoiceNumber, invoiceDate }) => {
  const grandTotal = products.reduce(
    (sum, p) => sum + Number(p.discountedPrice || 0) * Number(p.qty || 0),
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>DEVID AURA</Text>
            <Text style={styles.tagline}>ORESENCE IN EVERY STEP</Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text>Invoice #: {invoiceNumber}</Text>
            <Text>Date: {invoiceDate}</Text>
          </View>
        </View>

        {/* User & Delivery */}
        <View style={styles.sectionBox}>
          <View>
            <Text style={{ fontWeight: "bold" }}>User Details</Text>
            <Text>{user.name}</Text>
            <Text>{user.address}</Text>
            <Text>{user.phone}</Text>
          </View>
          <View>
            <Text style={{ fontWeight: "bold" }}>Delivery Partner</Text>
            <Text>{deliveryPartner}</Text>
          </View>
        </View>

        {/* Product Table */}
        <View style={styles.tableHeader}>
          <Text style={styles.cell}>Product</Text>
          <Text style={styles.cell}>Size</Text>
          <Text style={styles.cell}>Qty</Text>
          <Text style={styles.cell}>Price</Text>
          <Text style={styles.cell}>Discounted</Text>
          <Text style={styles.cell}>Total</Text>
        </View>
        {products.map((p, i) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.cell}>{p.name}</Text>
            <Text style={styles.cell}>{p.size}</Text>
            <Text style={styles.cell}>{p.qty}</Text>
            <Text style={styles.cell}>₹{p.price}</Text>
            <Text style={styles.cell}>₹{p.discountedPrice}</Text>
            <Text style={styles.cell}>₹{Number(p.discountedPrice || 0) * Number(p.qty || 0)}</Text>
          </View>
        ))}

        {/* Grand Total */}
        <Text style={styles.total}>Grand Total: ₹{grandTotal}</Text>

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for shopping with DEVID AURA!{"\n"}
          All sales are subject to our return policy.
        </Text>
      </Page>
    </Document>
  );
};

// Main React Component
const BillCreator = () => {
  const [products, setProducts] = useState([{ name: "", size: "", price: "", discountedPrice: "", qty: 1 }]);
  const [user, setUser] = useState({ name: "", address: "", phone: "" });
  const [deliveryPartner, setDeliveryPartner] = useState("");
  const invoiceNumber = `INV-${Math.floor(Math.random() * 100000)}`;
  const invoiceDate = new Date().toLocaleDateString("en-GB");

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;
    setProducts(updatedProducts);
  };

  const addProduct = () => {
    setProducts([...products, { name: "", size: "", price: "", discountedPrice: "", qty: 1 }]);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>DEVID AURA - Bill Generator</h2>

      {/* User Inputs */}
      <div>
        <input
          placeholder="Name"
          value={user.name}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
        /><br />
        <textarea
          placeholder="Address"
          value={user.address}
          onChange={(e) => setUser({ ...user, address: e.target.value })}
        /><br />
        <input
          placeholder="Phone"
          value={user.phone}
          onChange={(e) => setUser({ ...user, phone: e.target.value })}
        /><br />
        <input
          placeholder="Delivery Partner"
          value={deliveryPartner}
          onChange={(e) => setDeliveryPartner(e.target.value)}
        /><br />
      </div>

      {/* Product Inputs */}
      <div>
        {products.map((p, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <input
              placeholder="Product Name"
              value={p.name}
              onChange={(e) => handleProductChange(i, "name", e.target.value)}
            />
            <input
              placeholder="Size"
              value={p.size}
              onChange={(e) => handleProductChange(i, "size", e.target.value)}
            />
            <input
              placeholder="Price"
              value={p.price}
              onChange={(e) => handleProductChange(i, "price", e.target.value)}
            />
            <input
              placeholder="Discounted Price"
              value={p.discountedPrice}
              onChange={(e) => handleProductChange(i, "discountedPrice", e.target.value)}
            />
            <input
              placeholder="Qty"
              value={p.qty}
              onChange={(e) => handleProductChange(i, "qty", e.target.value)}
            />
          </div>
        ))}
        <button onClick={addProduct} style={{ backgroundColor: "#b76e79", color: "#fff", padding: "5px 10px", border: "none", marginBottom: 10 }}>
          Add Another Product
        </button>
      </div>

      {/* PDF Download */}
      <PDFDownloadLink
        document={
          <PDFInvoice
            user={user}
            deliveryPartner={deliveryPartner}
            products={products}
            invoiceNumber={invoiceNumber}
            invoiceDate={invoiceDate}
          />
        }
        fileName="DEVID_AURA_Bill.pdf"
      >
        {({ loading }) => (loading ? "Generating PDF..." : <button>Download PDF</button>)}
      </PDFDownloadLink>
    </div>
  );
};

export default BillCreator;
