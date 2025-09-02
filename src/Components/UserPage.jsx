import React, { useState, useContext, useEffect, useRef, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import FocusLock from "react-focus-lock";
import { UserContext } from "../contexts/UserContext";
import { OrderContext } from "../contexts/OrderContext";
import { CartContext } from "../contexts/CartContext";
import { ProductContext } from "../contexts/productContext";
import { ContactContext } from "../contexts/ContactContext";
import { ReviewContext } from "../contexts/ReviewContext";
import useCloudinary from "../utils/useCloudinary";
import { Pencil, Plus, ChevronRight, Star } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

/* ============================
   Small UI atoms
   ============================ */
const IconBtn = ({ children, onClick, title = "", className = "" }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-md hover:bg-gray-100 transition ${className}`}
  >
    {children}
  </button>
);

const FloatingInput = React.forwardRef(({ label, error, className = "", ...props }, ref) => (
  <div className={`relative w-full ${className}`}>
    <input
      ref={ref}
      placeholder=" "
      className={`peer w-full rounded-lg border px-3 pt-5 pb-2 text-sm placeholder-transparent focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none ${error ? "border-red-400" : "border-slate-200"}`}
      {...props}
    />
    <label
      className="absolute left-3 -top-2 bg-white px-1 text-slate-500 text-sm transition-all pointer-events-none
      peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-400 peer-placeholder-shown:text-base
      peer-focus:-top-2 peer-focus:text-sm peer-focus:text-slate-900"
    >
      {label}
    </label>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
));

const FloatingDropdown = ({ label, value, onChange, options = [] }) => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative w-full" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="peer w-full rounded-lg border px-3 pt-5 pb-2 text-sm text-left cursor-pointer bg-white focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`${!value ? "text-slate-400" : ""}`}>{value || "Select..."}</span>
      </button>
      <label className="absolute left-3 -top-2 bg-white px-1 text-slate-500 text-sm">{label}</label>
      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
        >
          {options.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={value === opt}
              onClick={() => {
                onChange({ target: { value: opt } });
                setOpen(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer ${
                value === opt ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// deterministic avatar color
const getDeterministicColor = (s) => {
  const colors = ["#EEF2FF", "#FEF3C7", "#ECFCCB", "#FFF1F2", "#EFF6FF", "#FEFCE8", "#F8FAFC"];
  if (!s) return colors[0];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
};

// helpers for DOB persistence/format
const toInputDate = (val) => {
  if (!val) return "";
  try {
    // supports ISO or Date-compatible strings
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
};

/* ============================
   Components
   ============================ */

const ProfileCard = ({
  userdetails,
  wishlist = [],
  cart = [],
  onEdit,
  onProfileImageChange,
  onGoWishlist,
  onGoCart,
}) => {
  const { uploadImage } = useCloudinary();
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileRef = useRef(null);
  const popRef = useRef(null);
  const [localUrl, setLocalUrl] = useState(userdetails.profileImage || null);

  useEffect(() => setLocalUrl(userdetails.profileImage || null), [userdetails.profileImage]);

  const initials =
    (userdetails?.name || "U")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") || "U";
  const bg = getDeterministicColor(userdetails?.email || userdetails?.name || "u");

  useEffect(() => {
    const onDoc = (e) => {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handleSelectFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setUploading(true);
      const { uploadImage: doUpload } = useCloudinary();
      const url = await doUpload(f);
      await onProfileImageChange(url);
      setLocalUrl(url);
      toast.success("Profile updated");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setMenuOpen(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    const prev = localUrl;
    setLocalUrl(null);
    try {
      await onProfileImageChange(null);
      toast.success("Profile removed");
    } catch (e) {
      setLocalUrl(prev);
      toast.error("Failed to remove");
    } finally {
      setMenuOpen(false);
    }
  };

  return (
    <aside className="bg-white rounded-2xl shadow p-6 flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div
            className="w-18 h-18 rounded-full overflow-hidden flex items-center justify-center ring-1 ring-slate-200"
            style={{ background: bg }}
          >
            {localUrl ? (
              <img src={localUrl} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-slate-800">{initials}</span>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs">
                Uploading…
              </div>
            )}
          </div>

          {/* Pencil overlay */}
          <button
            className="absolute -bottom-1 -right-1 bg-white border border-slate-200 p-1.5 rounded-full shadow hover:bg-slate-50"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Popover menu */}
          {menuOpen && (
            <div
              ref={popRef}
              className="absolute z-30 mt-2 right-0 left-10 w-44 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
              role="menu"
            >
              {localUrl ? (
                <>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm"
                  >
                    Change profile
                  </button>
                  <button
                    onClick={handleRemove}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-red-600"
                  >
                    Remove profile
                  </button>
                </>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm"
                >
                  Add profile
                </button>
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSelectFile}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold">{userdetails.name}</h3>
          <p className="text-sm text-slate-500">{userdetails.email}</p>
          <p className="text-sm text-slate-500">{userdetails.phone || "Phone not set"}</p>
        </div>
      </div>

      {/* Stats — now clickable */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onGoWishlist}
          className="bg-slate-50 p-3 rounded-lg text-center hover:bg-slate-100 transition"
        >
          <div className="text-sm text-slate-500">Wishlist</div>
          <div className="font-semibold">{wishlist.length}</div>
        </button>
        <button
          onClick={onGoCart}
          className="bg-slate-50 p-3 rounded-lg text-center hover:bg-slate-100 transition"
        >
          <div className="text-sm text-slate-500">Cart</div>
          <div className="font-semibold">{cart.length}</div>
        </button>
      </div>

      <div className="mt-1">
        <button onClick={onEdit} className="w-full px-4 py-2 bg-slate-900 text-white rounded-md">
          Edit Profile
        </button>
      </div>
    </aside>
  );
};

const AddressCard = ({ addr, onEdit, onDelete, onSetDefault }) => (
  <div className="bg-white rounded-lg p-4 shadow-sm flex flex-col gap-2">
    <div className="flex items-start justify-between">
      <div>
        <div className="font-medium">{addr.name}</div>
        <div className="text-sm text-slate-500">
          {addr.address}, {addr.city}
        </div>
      </div>
      <div className="text-right">
        {addr.isDefault && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-white">Default</span>
        )}
      </div>
    </div>
    <div className="text-sm text-slate-600">
      📞 {addr.phone}{" "}
      {addr.altPhone && <span className="text-slate-500">(Alt: {addr.altPhone})</span>}
    </div>
    <div className="flex gap-2 mt-2">
      {!addr.isDefault && (
        <button onClick={() => onSetDefault(addr.id)} className="px-3 py-1 rounded-md border text-sm">
          Set Default
        </button>
      )}
      <button onClick={() => onEdit(addr)} className="px-3 py-1 rounded-md border text-sm">
        Edit
      </button>
      <button
        onClick={() => onDelete(addr.id)}
        className="px-3 py-1 rounded-md border text-sm text-red-600"
      >
        Delete
      </button>
    </div>
  </div>
);

const OrderRow = ({ o, onOpen }) => (
  <div className="p-4 bg-white rounded-lg shadow-sm flex items-center justify-between">
    <div>
      <div className="font-medium">Order #{o.id}</div>
      <div className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</div>
    </div>
    <div className="text-right">
      <div className="font-semibold">₹{o.totalAmount}</div>
      <div className="text-sm text-slate-500">{o.status}</div>
      <button
        onClick={() => onOpen(o)}
        className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700"
      >
        Details <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

/* ============================
   Main Page
   ============================ */
export default function UserPage() {
  const {
    userdetails,
    address = [],
    updateUser,
    addAddress,
    editAddress,
    deleteAddress,
    setDefaultAddress,
  } = useContext(UserContext);
  const { orders = [], loadingOrders, getorders } = useContext(OrderContext);
  const { cart = [], wishlist = [], isWishlistLoading } = useContext(CartContext);
  const { products = [], loading: productsLoading } = useContext(ProductContext);
  const { queries = [], getQueriesByUser } = useContext(ContactContext);
  const { userReviews = [], loadingReviews, getReviewsByUser } = useContext(ReviewContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("orders");
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [drawerOrder, setDrawerOrder] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // forms
  const {
    register: regProfile,
    handleSubmit: submitProfile,
    reset: resetProfile,
    setValue: setProfileValue,
    watch: watchProfile,
    formState: { errors: profileErrors },
  } = useForm({ defaultValues: { name: "", phone: "", dob: "", gender: "" } });

  const {
    register: regAddr,
    handleSubmit: submitAddr,
    reset: resetAddr,
    setValue: setAddrValue,
    watch: watchAddr,
    formState: { errors: addrErrors },
  } = useForm({
    defaultValues: {
      name: "",
      phone: "",
      altPhone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      landmark: "",
      addressType: "",
    },
  });

  const productMap = useMemo(() => {
    const m = new Map();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);
  const findProduct = useCallback((id) => productMap.get(id), [productMap]);

  // set form defaults when user changes (incl. DOB formatting)
  useEffect(() => {
    if (!userdetails) return;
    resetProfile({
      name: userdetails.name || "",
      phone: userdetails.phone || "",
      dob: toInputDate(userdetails.dob),
      gender: userdetails.gender || "",
    });
    getorders && getorders();
    getReviewsByUser && getReviewsByUser();
    getQueriesByUser && getQueriesByUser(userdetails.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userdetails]);

  useEffect(() => {
    if (editingAddr) resetAddr(editingAddr);
  }, [editingAddr, resetAddr]);

  if (!userdetails || productsLoading || loadingOrders || isWishlistLoading || loadingReviews) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Handlers
  const onProfileSave = async (data) => {
    try {
      // ensure dob is in YYYY-MM-DD for backend or convert to ISO if your API expects ISO
      const payload = {
        ...data,
        dob: data.dob || null, // keep as YYYY-MM-DD (input gives this)
      };
      const ok = await updateUser(payload);
      if (ok) {
        toast.success("Profile updated");
        // re-apply formatted DOB to keep it visible immediately
        resetProfile({
          name: payload.name,
          phone: payload.phone || "",
          dob: toInputDate(payload.dob),
          gender: payload.gender || "",
        });
        setShowProfileModal(false);
      } else toast.error("Failed");
    } catch (e) {
      toast.error("Error");
    }
  };

  const onProfileImageChange = async (urlOrNull) => {
    try {
      const ok = await updateUser({ profileImage: urlOrNull });
      if (!ok) toast.error("Failed to save profile image");
    } catch (e) {
      toast.error("Error");
    }
  };

  const onAddAddress = async (data) => {
    try {
      const ok = await addAddress(data);
      if (ok) {
        toast.success("Address added");
        setIsAdding(false);
        resetAddr();
      } else toast.error("Failed");
    } catch (e) {
      toast.error("Error");
    }
  };

  const onEditAddressSave = async (data) => {
    if (!editingAddr) return;
    try {
      const ok = await editAddress(editingAddr.id, data);
      if (ok) {
        toast.success("Address updated");
        setEditingAddr(null);
        resetAddr();
      } else toast.error("Failed");
    } catch (e) {
      toast.error("Error");
    }
  };

  const onDeleteAddress = async (id) => {
    if (!confirm("Delete this address?")) return;
    try {
      await deleteAddress(id);
      toast.success("Deleted");
    } catch (e) {
      toast.error("Failed");
    }
  };
  const onSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      toast.success("Default set");
    } catch (e) {
      toast.error("Failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-4">
          <ProfileCard
            userdetails={userdetails}
            wishlist={wishlist}
            cart={cart}
            onEdit={() => setShowProfileModal(true)}
            onProfileImageChange={onProfileImageChange}
            onGoWishlist={() => navigate("/wishlist")}
            onGoCart={() => navigate("/cart")}
          />

          <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Shortcuts</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/orders")}
                className="w-full text-left px-4 py-2 rounded-md hover:bg-slate-50"
              >
                View all orders
              </button>
              <button
                onClick={() => navigate("/wishlist")}
                className="w-full text-left px-4 py-2 rounded-md hover:bg-slate-50"
              >
                Wishlist
              </button>
              <button
                onClick={() => navigate("/cart")}
                className="w-full text-left px-4 py-2 rounded-md hover:bg-slate-50"
              >
                Cart
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="w-full text-left px-4 py-2 rounded-md hover:bg-slate-50"
              >
                Security & Settings
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">My Account</h2>
              <div className="flex items-center gap-2">
                {["orders", "addresses", "reviews", "queries"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeTab === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div>
              {activeTab === "orders" && (
                <div className="grid grid-cols-1 gap-4">
                  {orders.length === 0 ? (
                    <div className="text-slate-500">No orders found</div>
                  ) : (
                    orders.map((o) => <OrderRow key={o.id} o={o} onOpen={setDrawerOrder} />)
                  )}
                </div>
              )}

              {activeTab === "addresses" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Addresses</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsAdding((v) => !v);
                          setEditingAddr(null);
                        }}
                        className="px-3 py-1 rounded-md border"
                      >
                        {isAdding ? "Close" : "Add Address"}
                      </button>
                    </div>
                  </div>

                  {isAdding && (
                    <form
                      onSubmit={submitAddr(onAddAddress)}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 bg-slate-50 p-4 rounded-md"
                    >
                      <FloatingInput
                        label="Full name"
                        {...regAddr("name", { required: "Name required" })}
                        error={addrErrors.name?.message}
                      />
                      <FloatingInput
                        label="Phone"
                        {...regAddr("phone", {
                          required: "Phone required",
                          minLength: { value: 6, message: "Phone too short" },
                        })}
                        error={addrErrors.phone?.message}
                      />
                      <FloatingInput
                        label="Address"
                        className="md:col-span-2"
                        {...regAddr("address", { required: "Address required" })}
                        error={addrErrors.address?.message}
                      />
                      <FloatingInput
                        label="City"
                        {...regAddr("city", { required: "City required" })}
                        error={addrErrors.city?.message}
                      />
                      <FloatingInput label="State" {...regAddr("state")} error={addrErrors.state?.message} />
                      <FloatingInput
                        label="Postal Code"
                        {...regAddr("postalCode", { required: "Postal code required" })}
                        error={addrErrors.postalCode?.message}
                      />
                      <FloatingDropdown
                        label="Address Type"
                        value={watchAddr("addressType")}
                        onChange={(e) => setAddrValue("addressType", e.target.value)}
                        options={["Home", "Work", "Other"]}
                      />

                      <div className="md:col-span-2 flex gap-2 mt-2">
                        <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-md">
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAdding(false);
                            resetAddr();
                          }}
                          className="px-4 py-2 rounded-md border"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {address.map((a) => (
                      <AddressCard
                        key={a.id}
                        addr={a}
                        onEdit={(x) => {
                          setEditingAddr(x);
                          setIsAdding(false);
                        }}
                        onDelete={onDeleteAddress}
                        onSetDefault={onSetDefault}
                      />
                    ))}
                  </div>

                  {editingAddr && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-md">
                      <h4 className="font-medium mb-2">Edit Address</h4>
                      <form
                        onSubmit={submitAddr(onEditAddressSave)}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3"
                      >
                        <FloatingInput
                          label="Full name"
                          {...regAddr("name", { required: "Name required" })}
                          error={addrErrors.name?.message}
                        />
                        <FloatingInput
                          label="Phone"
                          {...regAddr("phone", { required: "Phone required" })}
                          error={addrErrors.phone?.message}
                        />
                        <FloatingInput
                          label="Address"
                          className="md:col-span-2"
                          {...regAddr("address", { required: "Address required" })}
                          error={addrErrors.address?.message}
                        />
                        <div className="md:col-span-2 flex gap-2 mt-2">
                          <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-md">
                            Update
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAddr(null);
                              resetAddr();
                            }}
                            className="px-4 py-2 rounded-md border"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="grid grid-cols-1 gap-3">
                  {userReviews.length === 0 ? (
                    <div className="text-slate-500">No reviews</div>
                  ) : (
                    userReviews.map((r) => (
                      <div key={r.id} className="p-4 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{findProduct(r.productId)?.name || "Product"}</div>
                            <div className="text-xs text-slate-400">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < r.rating ? "text-amber-400" : "text-slate-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="mt-2 text-slate-700">{r.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "queries" && (
                <div className="grid gap-3">
                  {queries.length === 0 ? (
                    <div className="text-slate-500">No queries</div>
                  ) : (
                    queries.map((q) => (
                      <div key={q.id || q.createdAt} className="p-4 bg-white rounded-lg shadow-sm">
                        <div className="font-semibold">Message</div>
                        <div className="text-slate-700 mt-1">{q.message}</div>
                        <div className="text-xs text-slate-400 mt-2">Submitted on {q.createdAt}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Drawer */}
      {drawerOrder && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-full lg:w-1/3 ml-auto bg-white shadow-xl p-6 overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Order #{drawerOrder.id}</h3>
              <button onClick={() => setDrawerOrder(null)} className="text-slate-500">
                Close
              </button>
            </div>
            <div className="mt-4">
              {drawerOrder.items?.map((it) => (
                <div key={it.id} className="flex items-center gap-3 py-3 border-b">
                  <img
                    src={
                      (findProduct(it.productId)?.imageurl &&
                        (Array.isArray(findProduct(it.productId)?.imageurl)
                          ? findProduct(it.productId)?.imageurl?.[0]
                          : findProduct(it.productId)?.imageurl)) || ""
                    }
                    alt=""
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div>
                    <div className="font-medium">{findProduct(it.productId)?.name}</div>
                    <div className="text-sm text-slate-500">Qty: {it.qty}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1" onClick={() => setDrawerOrder(null)} aria-hidden></div>
        </div>
      )}

      {/* Profile Modal (centered card, not fullscreen) */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <FocusLock returnFocus autoFocus>
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
              <form onSubmit={submitProfile(onProfileSave)} className="grid gap-3">
                <FloatingInput
                  label="Name"
                  {...regProfile("name", { required: "Name required" })}
                  error={profileErrors.name?.message}
                />
                <FloatingInput
                  label="Phone"
                  {...regProfile("phone", { minLength: { value: 6, message: "Phone too short" } })}
                  error={profileErrors.phone?.message}
                />
                <FloatingInput
                  label="Date of Birth"
                  type="date"
                  {...regProfile("dob")}
                />
                <FloatingDropdown
                  label="Gender"
                  value={watchProfile("gender")}
                  onChange={(e) => setProfileValue("gender", e.target.value)}
                  options={["Male", "Female", "Other"]}
                />

                <div className="flex gap-2 mt-3">
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-md">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2 rounded-md border"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </FocusLock>
        </div>
      )}
    </div>
  );
}
