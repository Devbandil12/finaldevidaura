import React, { useState } from "react";

export default function AddressSelection({
  addresses,
  setSelectedAddress,
  selectedAddressIndex,
  setSelectedAddressIndex,
  newAddress,
  setNewAddress,
  handleSaveAddress,
  handlePincodeBlur,
  handleEditAddress,
  handleDeleteAddress,
  addressFieldsOrder,
  editingIndex,
  setEditingIndex,
  emptyAddress,
}) {
  const [showForm, setShowForm] = useState(false);

  const onSelectAddress = (addr, idx) => {
    setSelectedAddressIndex(idx);
    setSelectedAddress(addr);
    setEditingIndex(null);
    setNewAddress(emptyAddress);
    setShowForm(false);
  };

  const onAddNewClick = () => {
    setEditingIndex(null);
    setNewAddress(emptyAddress);
    setSelectedAddress(null);
    setSelectedAddressIndex(null);
    setShowForm(true);
  };

  const onEditClick = (idx) => {
    handleEditAddress(idx);
    setEditingIndex(idx);
    setNewAddress(addresses[idx]);
    setShowForm(true);
  };

  return (
    <div className="address-selection">
      <h2>Select or Add Delivery Address</h2>

      <button className="add-new-btn" onClick={onAddNewClick}>
        + Add New Address
      </button>

      <div className="address-selection__content">
        {/* Saved-address list */}
        <div className="address-selection__list">
          {addresses.map((addr, i) => (
            <div
              key={i}
              className={`address-card ${selectedAddressIndex === i ? "address-card--active" : ""}`}
              onClick={() => onSelectAddress(addr, i)}
            >
              <div className="address-card__header">
                <strong>{addr.name}</strong>
                <div className="address-card__actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(i);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(i);
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
              <p>{addr.address}, {addr.city}, {addr.state} – {addr.postalCode}</p>
              <p>{addr.country}</p>
              {addr.phone && <p>📞 {addr.phone}</p>}
            </div>
          ))}
        </div>

        {/* Address form */}
        {showForm && (
          <div className="address-selection__form">
            <h3>{editingIndex !== null ? "Edit Address" : "Add New Address"}</h3>
            <div className="address-form__fields">
              {addressFieldsOrder.map((field) => (
                <label key={field}>
                  <span>{field[0].toUpperCase() + field.slice(1)}</span>
                  <input
                    name={field}
                    value={newAddress[field] || ""}
                    onFocus={() => {
                      setSelectedAddress(null);
                      setSelectedAddressIndex(null);
                    }}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, [field]: e.target.value })
                    }
                    onKeyDown={
                      field === "postalCode"
                        ? (e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handlePincodeBlur();
                            }
                          }
                        : undefined
                    }
                  />
                </label>
              ))}
            </div>
            <div className="address-form__actions">
              <button
                onClick={() => {
                  handleSaveAddress();
                  setShowForm(false);
                }}
              >
                {editingIndex !== null ? "Update Address" : "Save Address"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
