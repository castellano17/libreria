import { useState } from "react";

export default function Settings({
  isOpen,
  onClose,
  kindleEmail,
  onSaveKindleEmail,
}) {
  const [email, setEmail] = useState(kindleEmail || "");
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKindleEmail(email);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Configuración
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email de Kindle
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tunombre@kindle.com"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Encuentra tu email de Kindle en Amazon → Gestionar contenido y
              dispositivos → Preferencias → Configuración de documentos
              personales
            </p>
            <a
              href="https://www.amazon.com/hz/mycd/preferences"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Ir a configuración de Amazon Kindle
            </a>
          </div>

          {/* Warning sobre correos aprobados */}
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <svg
              className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Importante
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Para recibir libros debes agregar{" "}
                <strong>librosbiblioteca35@gmail.com</strong> a tu lista de
                correos aprobados en Amazon.
              </p>
              <a
                href="https://www.amazon.com/hz/mycd/preferences"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 font-medium"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Configurar correos aprobados en Amazon
              </a>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Ve a: Preferencias → Configuración de documentos personales →
                Lista de correos aprobados
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-xl font-medium transition-colors ${
              saved
                ? "bg-green-500 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {saved ? "✓ Guardado" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
