import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { contactApi } from '../api/services';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await contactApi.submit({ name: form.name, email: form.email, phone: form.phone || undefined, message: form.message });
      setSent(true);
      toast.success('Message sent! We\'ll get back to you soon.');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Could not send message. Please try again.');
    } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-dark-800 page-enter">
      <div className="bg-dark-900/60 border-b border-gold-500/10 py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="section-subtitle mb-2">Get in Touch</p>
          <h1 className="section-title">Contact Us</h1>
          <div className="gold-divider mt-4" />
          <p className="text-cream/50 font-sans text-sm mt-6 max-w-lg mx-auto leading-relaxed">
            We'd love to hear from you. Whether you have a question about our collection or need help with an order.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Contact info */}
        <div className="space-y-8">
          {[
            { icon: Mail, title: 'Email', value: 'hello@jewelia.in', link: 'mailto:hello@jewelia.in' },
            { icon: Phone, title: 'Phone', value: '+91 98765 43210', link: 'tel:+919876543210' },
            { icon: MapPin, title: 'Address', value: '123 Jewellery Lane\nMumbai, Maharashtra\n400001', link: null },
          ].map(({ icon: Icon, title, value, link }) => (
            <div key={title} className="flex gap-4">
              <div className="w-10 h-10 bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-gold-500" />
              </div>
              <div>
                <p className="text-cream/50 text-xs font-sans uppercase tracking-widest mb-1">{title}</p>
                {link ? (
                  <a href={link} className="text-cream text-sm hover:text-gold-500 transition-colors whitespace-pre-line">{value}</a>
                ) : (
                  <p className="text-cream text-sm whitespace-pre-line">{value}</p>
                )}
              </div>
            </div>
          ))}

          <div className="border-t border-gold-500/10 pt-8">
            <p className="text-cream/40 text-xs font-sans uppercase tracking-widest mb-3">Business Hours</p>
            <p className="text-cream/60 text-sm font-sans">Monday – Saturday</p>
            <p className="text-cream text-sm">10:00 AM – 7:00 PM IST</p>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          {sent ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-10 text-center">
              <div className="w-16 h-16 bg-gold-500/10 border border-gold-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Send size={28} className="text-gold-500" />
              </div>
              <h2 className="font-serif text-cream text-xl mb-3">Message Sent!</h2>
              <p className="text-cream/50 font-sans text-sm">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-cream/50 text-xs font-sans uppercase tracking-widest mb-2">Your Name *</label>
                  <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" className="input w-full" />
                </div>
                <div>
                  <label className="block text-cream/50 text-xs font-sans uppercase tracking-widest mb-2">Email *</label>
                  <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" className="input w-full" />
                </div>
              </div>
              <div>
                <label className="block text-cream/50 text-xs font-sans uppercase tracking-widest mb-2">Phone <span className="text-cream/30 normal-case">(optional)</span></label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 00000 00000" className="input w-full" />
              </div>
              <div>
                <label className="block text-cream/50 text-xs font-sans uppercase tracking-widest mb-2">Message *</label>
                <textarea required value={form.message} onChange={e => set('message', e.target.value)} placeholder="How can we help you?" rows={5} className="input w-full resize-none" />
              </div>
              <button type="submit" disabled={sending} className="btn-primary w-full justify-center">
                {sending ? 'Sending…' : <><Send size={16} /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}