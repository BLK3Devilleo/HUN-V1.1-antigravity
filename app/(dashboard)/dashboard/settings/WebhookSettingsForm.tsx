'use client';

import { useState, useEffect } from 'react';
import { saveN8nWebhook, getN8nWebhook } from '@/app/actions/settings';
import { Zap, CheckCircle2, AlertCircle, RefreshCw, Link as LinkIcon } from 'lucide-react';

export default function WebhookSettingsForm() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadWebhook() {
      const data = await getN8nWebhook();
      if (data.url) setWebhookUrl(data.url);
      setFetching(false);
    }
    loadWebhook();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await saveN8nWebhook(webhookUrl);
    if (res.success) {
      setMessage({ type: 'success', text: '¡Endpoint Webhook guardado exitosamente!' });
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al guardar webhook' });
    }
    setLoading(false);
  };

  if (fetching) {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 py-4">
        <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
        <span>Cargando configuración del orquestador...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
          URL Endpoint del Webhook (n8n)
        </label>
        <input
          type="url"
          required
          placeholder="https://n8n.tudominio.com/webhook/..."
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:bg-white transition-all shadow-sm"
        />
        <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
          Asegúrate de que la URL empiece con <code className="bg-slate-100 text-purple-700 px-1 py-0.5 rounded font-mono text-[10px]">https://</code> y apunte al disparador del flujo en n8n.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="pt-1">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" />
              <span>Guardar Webhook n8n</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
