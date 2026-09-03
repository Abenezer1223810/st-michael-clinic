import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  Send,
  Stethoscope,
  FlaskConical,
  Clock,
  Sparkles,
  RefreshCw,
  User,
} from 'lucide-react';
import { laboratoryService } from '../../services/laboratoryService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/format';

export function LabDoctorCommunication({ requestId, patientName, doctorName }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const isDoctor = user?.role === 'doctor';
  const isLab = user?.role === 'laboratory' || user?.role === 'administrator';

  const loadMessages = async () => {
    if (!requestId) return;
    try {
      const res = await laboratoryService.getMessages(requestId);
      setMessages(res.data?.messages || res.messages || []);
    } catch (_) {
      // Background poll failure
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 6000);
    return () => clearInterval(interval);
  }, [requestId]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !requestId) return;

    setSending(true);
    try {
      const res = await laboratoryService.sendMessage(requestId, text);
      const newMsg = res.data?.message || res.message;
      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
      toast.success(t('Clinical note transmitted.'));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t('Failed to send message.'));
    } finally {
      setSending(false);
    }
  };

  const quickTemplates = isDoctor
    ? [
        'STAT: Patient febrile & acutely ill, please prioritize.',
        'Please specifically check for blood film / malarial parasites.',
        'Patient is on anticoagulants; note any specimen clotting.',
      ]
    : [
        'Specimen received in lab; processing on analyzer now.',
        'CBC completed; abnormal parameters noted in report.',
        'Specimen hemolyzed; requested recollection if possible.',
      ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {t('Doctor & Lab Clinical Communication')}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {patientName ? `${t('Patient')}: ${patientName}` : t('Direct clinical notes for this encounter')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadMessages}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          title={t('Refresh messages')}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Message List */}
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20 text-xs">
        {messages.length === 0 ? (
          <div className="py-6 text-center text-slate-400">
            <MessageSquare className="mx-auto mb-1.5 h-6 w-6 text-slate-300 dark:text-slate-700" />
            <p className="font-semibold">{t('No clinical notes yet')}</p>
            <p className="text-[11px]">{t('Use the box below to transmit instructions or questions between Doctor and Lab.')}</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMsgDoctor = msg.senderRole === 'doctor';
            const isMyMsg = msg.senderId === user?.id || (isDoctor && isMsgDoctor) || (isLab && !isMsgDoctor);

            return (
              <div
                key={msg.id || idx}
                className={`flex flex-col ${isMyMsg ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                  {isMsgDoctor ? (
                    <span className="inline-flex items-center gap-1 rounded bg-sky-100 px-1.5 py-0.2 font-bold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                      <Stethoscope className="h-2.5 w-2.5" /> Dr. {msg.senderName.replace('Dr. ', '')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.2 font-bold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                      <FlaskConical className="h-2.5 w-2.5" /> Lab: {msg.senderName}
                    </span>
                  )}
                  <span className="font-mono">{formatDateTime(msg.timestamp)}</span>
                </div>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] leading-relaxed ${
                    isMyMsg
                      ? 'bg-brand-600 text-white shadow-xs rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 shadow-2xs rounded-tl-xs'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Templates */}
      <div className="border-t border-slate-100 px-3 py-2 bg-white dark:border-slate-800 dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <Sparkles className="h-3 w-3 text-amber-500" /> Templates:
        </span>
        {quickTemplates.map((tmpl, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInputText(tmpl)}
            className="shrink-0 truncate max-w-[200px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {tmpl}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="border-t border-slate-100 p-3 bg-white dark:border-slate-800 dark:bg-slate-900 flex items-center gap-2">
        <input
          type="text"
          className="input flex-1 text-xs"
          placeholder={
            isDoctor
              ? t('Type clinical instruction or inquiry for Laboratory…')
              : t('Type remark or specimen update for Doctor…')
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
        >
          {sending ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Send className="h-3.5 w-3.5" /> {t('Send')}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default LabDoctorCommunication;