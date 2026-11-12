import { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import { useLanguage } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL;

// Formulario
const ContactForm = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState({ nombre: '', email: '', asunto: '', mensaje: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.nombre.trim() || form.nombre.trim().length < 2)
      return 'El nombre debe tener al menos 2 caracteres.';
    if (!form.email.trim())
      return 'El email es obligatorio.';
    if (!form.asunto.trim() || form.asunto.trim().length < 3)
      return 'El asunto debe tener al menos 3 caracteres.';
    if (!form.mensaje.trim() || form.mensaje.trim().length < 10)
      return 'El mensaje debe tener al menos 10 caracteres.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setErrorMsg('');

    const validationError = validate();
    if (validationError) {
      setStatus('error');
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setForm({ nombre: '', email: '', asunto: '', mensaje: '' });
      } else {
        setStatus('error');
        setErrorMsg(data.message || t('contact.form.error'));
      }
    } catch {
      setStatus('error');
      setErrorMsg(t('contact.form.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="label">{t('contact.form.name')}</label>
          <input
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={handleChange}
            className="input"
            placeholder={t('contact.form.name_placeholder')}
            required
          />
        </div>
        <div>
          <label className="label">{t('contact.form.email')}</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="input"
            placeholder="tu@email.com"
            required
          />
        </div>
      </div>

      <div>
        <label className="label">{t('contact.form.subject')}</label>
        <input
          name="asunto"
          type="text"
          value={form.asunto}
          onChange={handleChange}
          className="input"
          placeholder={t('contact.form.subject_placeholder')}
          required
        />
      </div>

      <div>
        <label className="label">
          {t('contact.form.message')}
          <span className={`ml-2 text-xs ${form.mensaje.length < 10 ? 'text-gray-500' : 'text-green-500'}`}>
            ({form.mensaje.length}/10 mín.)
          </span>
        </label>
        <textarea
          name="mensaje"
          value={form.mensaje}
          onChange={handleChange}
          rows={5}
          className="input resize-none"
          placeholder={t('contact.form.message_placeholder')}
          required
        />
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm">
          <CheckCircle size={16} />
          {t('contact.form.success')}
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} />
          {errorMsg || t('contact.form.error')}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          t('contact.form.sending')
        ) : (
          <>
            <Send size={16} />
            {t('contact.form.submit')}
          </>
        )}
      </Button>
    </form>
  );
};

const Contacto = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-black min-h-screen">

      {/* Hero */}
      <section className="relative py-14 md:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black z-10" />
          <div className="absolute inset-0 bg-mesh" />
        </div>

        <div className="relative z-20 container-custom px-6 text-center">
          <h1 className="text-white mb-4 uppercase tracking-[0.15em] sm:tracking-[0.2em] font-light text-2xl sm:text-4xl md:text-5xl">
            {t('contact.title')}
          </h1>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent mx-auto mb-4" />
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-light">
            {t('contact.subtitle')}
          </p>
        </div>
      </section>

      {/* Contacto */}
      <section className="py-10 bg-black">
        <div className="container-custom px-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <div className="bg-[#0d0d0d] border border-[#262626] rounded-xl p-6 md:p-8">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contacto;