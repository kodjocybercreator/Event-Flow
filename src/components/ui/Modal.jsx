import { motion, AnimatePresence } from 'framer-motion';

export function Modal({
  isOpen,
  onClose,
  children,
  className = '',
  title,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className={`fixed left-[50%] top-[50%] z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl p-8 text-slate-900 ${className}`}
          >
            {title && (
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">
                  {title}
                </p>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                  {title}
                </h2>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Close"
            >
              ✕
            </button>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}




