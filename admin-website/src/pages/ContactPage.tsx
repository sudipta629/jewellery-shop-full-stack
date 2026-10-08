import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Mail, Phone, Clock, CheckCircle,
  Eye, RefreshCw, Search, Filter, X, User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { contactApi } from '../api/services';

interface ContactMsg {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gold-500/20 text-gold-400 border border-gold-500/40',
  read: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  replied: 'bg-green-500/20 text-green-400 border border-green-500/30',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function ContactPage() {
  const queryClient = useQueryClient();
  const [selectedMsg, setSelectedMsg] = useState<ContactMsg | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQ, setSearchQ] = useState('');

  const { data: messages = [], isLoading, refetch } = useQuery<ContactMsg[]>({
    queryKey: ['admin-contact'],
    queryFn: () => contactApi.list(),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      contactApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contact-unread'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Could not update status'),
  });

  // Mark as read when opening
  const openMessage = (msg: ContactMsg) => {
    setSelectedMsg(msg);
    if (msg.status === 'new') {
      updateStatus.mutate({ id: msg.id, status: 'read' });
    }
  };

  const filtered = messages.filter((m) => {
    const matchStatus = !statusFilter || m.status === statusFilter;
    const q = searchQ.toLowerCase();
    const matchSearch = !q ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const newCount = messages.filter((m) => m.status === 'new').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display text-cream">Contact Messages</h1>
          <p className="text-cream/40 text-sm font-sans mt-0.5">
            {isLoading ? '…' : `${messages.length} total · `}
            {newCount > 0 && (
              <span className="text-gold-400 font-semibold">{newCount} new</span>
            )}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 btn-ghost text-xs py-2 px-3"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search name, email, message…"
            className="admin-input pl-9 w-full text-sm"
          />
          {searchQ && (
            <button
              onClick={() => setSearchQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-gold-500"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {['', 'new', 'read', 'replied'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-sans border transition-all ${
                statusFilter === s
                  ? 'bg-gold-500 text-dark-800 border-gold-500'
                  : 'border-gold-500/20 text-cream/60 hover:border-gold-500/60'
              }`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main content — two-pane layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-[500px]">
        {/* Left: list */}
        <div className="xl:col-span-1 space-y-2 overflow-y-auto max-h-[70vh]">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="admin-card p-4 space-y-2 animate-pulse">
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-full" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="admin-card p-10 text-center">
              <MessageSquare size={32} className="text-gold-500/20 mx-auto mb-3" />
              <p className="text-cream/30 text-sm font-sans">No messages found</p>
            </div>
          ) : (
            filtered.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => openMessage(msg)}
                className={`admin-card p-4 cursor-pointer transition-all hover:border-gold-500/40 ${
                  selectedMsg?.id === msg.id ? 'border-gold-500/60 bg-gold-500/5' : ''
                } ${msg.status === 'new' ? 'border-l-2 border-l-gold-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                      <User size={13} className="text-gold-500" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${msg.status === 'new' ? 'text-cream' : 'text-cream/70'}`}>
                        {msg.name}
                      </p>
                      <p className="text-cream/40 text-[10px] truncate">{msg.email}</p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-sans ${STATUS_COLORS[msg.status]}`}>
                    {msg.status}
                  </span>
                </div>
                <p className="text-cream/50 text-xs font-sans line-clamp-2 leading-relaxed">
                  {msg.message}
                </p>
                <p className="text-cream/25 text-[10px] font-sans mt-2 flex items-center gap-1">
                  <Clock size={10} /> {formatDate(msg.created_at)}
                </p>
              </motion.div>
            ))
          )}
        </div>

        {/* Right: detail */}
        <div className="xl:col-span-2">
          <AnimatePresence mode="wait">
            {selectedMsg ? (
              <motion.div
                key={selectedMsg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="admin-card p-6 h-full"
              >
                {/* Detail header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                      <User size={18} className="text-gold-500" />
                    </div>
                    <div>
                      <p className="text-cream font-semibold">{selectedMsg.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans ${STATUS_COLORS[selectedMsg.status]}`}>
                        {selectedMsg.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMsg(null)}
                    className="text-cream/30 hover:text-cream"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Contact info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 bg-dark-700/50 px-4 py-3 border border-gold-500/10">
                    <Mail size={15} className="text-gold-500/60" />
                    <div>
                      <p className="text-cream/40 text-[10px] font-sans uppercase tracking-widest">Email</p>
                      <a href={`mailto:${selectedMsg.email}`} className="text-cream text-sm hover:text-gold-500 transition-colors">
                        {selectedMsg.email}
                      </a>
                    </div>
                  </div>
                  {selectedMsg.phone && (
                    <div className="flex items-center gap-3 bg-dark-700/50 px-4 py-3 border border-gold-500/10">
                      <Phone size={15} className="text-gold-500/60" />
                      <div>
                        <p className="text-cream/40 text-[10px] font-sans uppercase tracking-widest">Phone</p>
                        <a href={`tel:${selectedMsg.phone}`} className="text-cream text-sm hover:text-gold-500 transition-colors">
                          {selectedMsg.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 bg-dark-700/50 px-4 py-3 border border-gold-500/10 sm:col-span-2">
                    <Clock size={15} className="text-gold-500/60" />
                    <div>
                      <p className="text-cream/40 text-[10px] font-sans uppercase tracking-widest">Received</p>
                      <p className="text-cream text-sm">{formatDate(selectedMsg.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Message body */}
                <div className="mb-6">
                  <p className="text-cream/40 text-[10px] font-sans uppercase tracking-widest mb-3">Message</p>
                  <div className="bg-dark-700/40 border border-gold-500/10 p-5 rounded-sm">
                    <p className="text-cream/80 text-sm font-sans leading-relaxed whitespace-pre-wrap">
                      {selectedMsg.message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`mailto:${selectedMsg.email}?subject=Re: Your message to Jewélia`}
                    className="btn-primary text-xs py-2 px-4"
                  >
                    <Mail size={13} /> Reply via Email
                  </a>
                  {selectedMsg.status !== 'replied' && (
                    <button
                      onClick={() => {
                        updateStatus.mutate({ id: selectedMsg.id, status: 'replied' });
                        setSelectedMsg({ ...selectedMsg, status: 'replied' });
                      }}
                      disabled={updateStatus.isPending}
                      className="btn-ghost text-xs py-2 px-4"
                    >
                      <CheckCircle size={13} /> Mark as Replied
                    </button>
                  )}
                  {selectedMsg.status !== 'read' && selectedMsg.status !== 'replied' && (
                    <button
                      onClick={() => {
                        updateStatus.mutate({ id: selectedMsg.id, status: 'read' });
                        setSelectedMsg({ ...selectedMsg, status: 'read' });
                      }}
                      disabled={updateStatus.isPending}
                      className="btn-ghost text-xs py-2 px-4"
                    >
                      <Eye size={13} /> Mark as Read
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="admin-card h-full flex items-center justify-center p-16"
              >
                <div className="text-center">
                  <MessageSquare size={40} className="text-gold-500/20 mx-auto mb-4" />
                  <p className="text-cream/30 text-sm font-sans">Select a message to view details</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
