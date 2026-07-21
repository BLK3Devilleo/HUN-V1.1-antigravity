'use client';

import { useState, useEffect } from 'react';
import { saveN8nWebhook, getN8nWebhook } from '@/app/actions/settings';

export default function WebhookSettingsForm() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    getN8nWebhook().then(res => {
      setWebhookUrl(res.url || '');
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const res = await saveN8nWebhook(webhookUrl);
    setSaving(false);

    if (res.success) {
      setMessage({ text: 'Webhook guardado exitosamente.', type: 'success' });
    } else {
      setMessage({ text: res.error || 'Error desconocido', type: 'error' });
    }
  };

  if (loading) {
    return <div className="text-white/40 text-sm animate-pulse">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs text-white/50 font-medium">URL de Webhook (n8n)</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            placeholder="https://tu-n8n.com/webhook/..."
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`text-xs font-medium px-4 py-2 rounded-lg border ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
