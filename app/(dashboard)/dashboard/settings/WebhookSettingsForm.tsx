'use client';

import { useState, useEffect } from 'react';
import { saveN8nWebhook, getN8nWebhook } from '@/app/actions/settings';

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
      setMessage({ type: 'success', text: '¡Webhook guardado exitosamente!' });
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al guardar webhook' });
    }
    setLoading(false);
  };

  if (fetching) {
    return <div className="text-xs text-gray-400 font-medium">Cargando configuración...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          URL del Webhook de n8n
        </label>
        <input
          type="url"
          required
          placeholder="https://n8n.tudominio.com/webhook/..."
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          className="w-full px-5 py-3 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black text-gray-900 font-mono"
        />
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold ${
          message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md hover:scale-105 transition-all"
      >
        {loading ? 'Guardando...' : 'Guardar Webhook'}
      </button>
    </form>
  );
}
