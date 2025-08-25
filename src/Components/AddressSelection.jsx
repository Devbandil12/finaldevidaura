// AddressSelection.tailwind.jsx
// Tailwind version — drop into your components folder and import where needed.

import React, { useEffect, useState } from 'react';
import { MapPin, PlusCircle, Trash2, Edit2 } from 'lucide-react';

export default function AddressSelection({ userId, onSelect, onAddressesChange }) {
  const API_BASE = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '') + '/api/address';
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${API_BASE}/user/${userId}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setAddresses(json.data || []);
          onAddressesChange?.(json.data || []);
        } else {
          console.error('Failed to fetch addresses:', json);
        }
      })
      .catch(err => console.error('Address fetch err', err))
      .finally(() => setLoading(false));
  }, [userId]);

  async function saveAddress(payload) {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/`, {
        method: payload.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.msg || 'Failed');

      if (payload.id) {
        setAddresses(prev => {
          const updated = prev.map(a => a.id === json.data.id ? json.data : a);
          onAddressesChange?.(updated);
          return updated;
        });
      } else {
        setAddresses(prev => {
          const updated = [json.data, ...prev];
          onAddressesChange?.(updated);
          return updated;
        });
      }

      setShowForm(false);
      setEditing(null);
      setSelectedId(json.data.id);
      onSelect?.(json.data);
      return json.data;
    } catch (err) {
      console.error('saveAddress error', err);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function removeAddress(addr) {
    try {
      const res = await fetch(`${API_BASE}/${addr.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error('Delete failed');
      setAddresses(prev => {
        const filtered = prev.filter(a => a.id !== addr.id);
        onAddressesChange?.(filtered);
        return filtered;
      });
      if (selectedId === addr.id) { setSelectedId(null); onSelect?.(null); }
      setConfirmTarget(null);
      return true;
    } catch (err) {
      console.error('delete err', err);
      return false;
    }
  }

  async function setDefault(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}/default`, { method: 'PUT' });
      const json = await res.json();
      if (!json.success) throw new Error('Failed to set default');
      setAddresses(prev => {
        const updated = prev.map(a => ({ ...a, isDefault: a.id === json.data.id }));
        onAddressesChange?.(updated);
        return updated;
      });
    } catch (err) { console.error(err); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Your Addresses</h3>
        <div className="flex items-center gap-3">
          <button onClick={() => { setShowForm(true); setEditing(null); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition">
            <PlusCircle className="w-4 h-4"/> Add Address
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showForm && (
          <div className="col-span-1 md:col-span-2 bg-white rounded-2xl shadow-md p-4">
            <AddressForm initial={editing} onCancel={() => { setShowForm(false); setEditing(null); }} onSave={saveAddress} saving={saving} />
          </div>
        )}

        {loading ? (
          <div className="col-span-1 md:col-span-2 bg-white rounded-2xl shadow-sm p-6 text-center text-sm text-slate-500">Loading addresses...</div>
        ) : (
          addresses.length === 0 ? (
            <div className="col-span-1 md:col-span-2 bg-white rounded-2xl shadow-sm p-6 text-center text-sm text-slate-500">No saved addresses yet.</div>
          ) : (
            addresses.map(addr => (
              <div key={addr.id} className={`bg-white rounded-2xl shadow-sm p-4 flex gap-4 items-start ${selectedId === addr.id ? 'ring-2 ring-slate-100' : ''}`}>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">{addr.name} {addr.isDefault && <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded-full">Default</span>}</div>
                      <div className="text-sm text-slate-600 mt-1">{addr.address}, {addr.city} - {addr.postalCode}</div>
                      <div className="text-sm text-slate-500 mt-1">Phone: {addr.phone}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        {!addr.isDefault && (
                          <button onClick={() => setDefault(addr.id)} className="text-sm px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50">Set Default</button>
                        )}
                        <button onClick={() => { setEditing(addr); setShowForm(true); }} aria-label="Edit" className="p-2 rounded-md hover:bg-slate-50"><Edit2 className="w-4 h-4 text-slate-600"/></button>
                        <button onClick={() => setConfirmTarget(addr)} aria-label="Delete" className="p-2 rounded-md hover:bg-slate-50 text-red-600"><Trash2 className="w-4 h-4"/></button>
                      </div>
                      <button onClick={() => { setSelectedId(addr.id); onSelect?.(addr); }} className="text-sm text-slate-600 underline">Use this</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-lg p-6 w-full max-w-md mx-4">
            <h4 className="text-lg font-semibold text-slate-900">Remove address</h4>
            <p className="text-sm text-slate-600 mt-2">Are you sure you want to remove the address "{confirmTarget.name}"? This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmTarget(null)} className="px-4 py-2 rounded-lg border">Cancel</button>
              <button onClick={() => removeAddress(confirmTarget)} className="px-4 py-2 rounded-lg bg-red-600 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddressForm({ initial, onCancel, onSave, saving }){
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', state: '', postalCode: '', landmark: '', ...initial });
  useEffect(()=> setForm({ name: '', phone: '', address: '', city: '', state: '', postalCode: '', landmark: '', ...initial }), [initial]);
  const update = (k,v) => setForm(prev=> ({...prev, [k]:v}));
  const valid = form.name && form.phone && form.address && form.city && form.postalCode;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="border rounded-lg p-3" placeholder="Name (eg. Home, Work)" value={form.name} onChange={e=>update('name', e.target.value)} />
        <input className="border rounded-lg p-3" placeholder="Phone" value={form.phone} onChange={e=>update('phone', e.target.value)} />
        <input className="border rounded-lg p-3 md:col-span-2" placeholder="Address line" value={form.address} onChange={e=>update('address', e.target.value)} />
        <input className="border rounded-lg p-3" placeholder="City" value={form.city} onChange={e=>update('city', e.target.value)} />
        <input className="border rounded-lg p-3" placeholder="State" value={form.state} onChange={e=>update('state', e.target.value)} />
        <input className="border rounded-lg p-3" placeholder="Postal Code" value={form.postalCode} onChange={e=>update('postalCode', e.target.value)} />
        <input className="border rounded-lg p-3 md:col-span-2" placeholder="Landmark (optional)" value={form.landmark} onChange={e=>update('landmark', e.target.value)} />
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border">Cancel</button>
        <button disabled={!valid || saving} onClick={()=>onSave(form)} className={`px-4 py-2 rounded-lg ${valid? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
          {saving? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
