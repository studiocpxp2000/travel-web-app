import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks';
import Input from '../../components/forms/Input';
import { APP_CONFIG } from '../../utils/constants';

export default function SuperAdminLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData, 'superadmin');

        if (result.success) {
            navigate('/superadmin', { replace: true });
        } else {
            setError(result.error || 'Invalid credentials');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                            {APP_CONFIG.LOGO_URL ? (
                                <img src={APP_CONFIG.LOGO_URL} alt={APP_CONFIG.NAME} className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-white font-bold text-2xl">{APP_CONFIG.NAME.charAt(0)}</span>
                            )}
                        </div>
                        <span className="text-white font-bold text-3xl">{APP_CONFIG.NAME}</span>
                    </Link>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-dark-900">Super Admin</h2>
                        <p className="text-text-light mt-1">Sign in to super admin panel</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Username"
                            type="text"
                            placeholder="Enter your username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />

                        <div className="relative">
                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 mt-6"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5 mr-2" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 rounded-lg bg-gray-50 border">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Demo Credentials:</p>
                        <p className="text-xs text-gray-500">
                            <span className="font-medium">Username:</span> superadmin
                        </p>
                        <p className="text-xs text-gray-500">
                            <span className="font-medium">Password:</span> admin123
                        </p>
                    </div>

                    <p className="text-center text-sm text-gray-600 mt-6">
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                            ← Back to regular login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
