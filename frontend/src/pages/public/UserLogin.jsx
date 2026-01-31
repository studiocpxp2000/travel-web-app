import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';
import Input from '../../components/forms/Input';
import StatusModal from '../../components/common/StatusModal';

export default function UserLogin() {
    const { orgSlug } = useParams();
    const navigate = useNavigate();
    const { login } = useUserAuth();

    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: '', title: '', message: '' });

    const pathPrefix = orgSlug ? `/${orgSlug}` : '';

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.identifier || !formData.password) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Missing Fields',
                message: 'Please enter your email/phone and password.'
            });
            return;
        }

        setLoading(true);

        const result = await login(formData, orgSlug);

        if (result.success) {
            navigate(`${pathPrefix}/profile`);
        } else {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Login Failed',
                message: result.error || 'Invalid credentials. Please try again.'
            });
        }

        setLoading(false);
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-4">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-dark-900 mb-2">Welcome Back</h1>
                    <p className="text-text-light">Sign in to access your profile and bookings</p>
                </div>

                {/* Login Form */}
                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="form-label flex items-center gap-2">
                                <Mail className="w-4 h-4" /> Email or Phone
                            </label>
                            <Input
                                type="text"
                                placeholder="Enter your email or phone"
                                value={formData.identifier}
                                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="form-label flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-text-light">
                            Don't have an account?{' '}
                            <Link
                                to={`${pathPrefix}/register`}
                                className="text-primary-600 font-medium hover:underline"
                            >
                                Register here
                            </Link>
                        </p>
                    </div>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-800 mb-2">Demo Credentials</p>
                        <div className="text-sm text-blue-700 space-y-1">
                            <p><span className="font-medium">Email:</span> demo@example.com</p>
                            <p><span className="font-medium">Password:</span> {orgSlug}123</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ identifier: 'demo@example.com', password: `${orgSlug}123` })}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                            Fill Demo Credentials
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Modal */}
            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />
        </div>
    );
}
