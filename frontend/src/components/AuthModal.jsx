import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const { signIn, signUp, user } = useAuth();

  // Cerrar modal automáticamente cuando el usuario se loguea
  useEffect(() => {
    if (user && isOpen) {
      setTimeout(() => {
        onClose();
        // Limpiar el formulario
        setEmail("");
        setPassword("");
        setMessage(null);
        setLoading(false);
      }, 1000);
    }
  }, [user, isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        setMessage({ type: "error", text: error.message });
        setLoading(false);
      } else {
        if (isLogin) {
          setMessage({
            type: "success",
            text: "¡Bienvenido! Iniciando sesión...",
          });
          // No setear loading a false aquí, se hará cuando se cierre el modal
        } else {
          setMessage({
            type: "success",
            text: "Cuenta creada. Revisa tu email para confirmar.",
          });
          setLoading(false);
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error de conexión" });
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Limpiar el formulario al cerrar
      setEmail("");
      setPassword("");
      setMessage(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              required
              minLength={6}
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              }`}
            >
              {message.type === "success" && loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              )}
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {loading
              ? isLogin
                ? "Iniciando sesión..."
                : "Creando cuenta..."
              : isLogin
                ? "Iniciar Sesión"
                : "Crear Cuenta"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              className="text-sm text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
