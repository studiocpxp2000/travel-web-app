import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks';
import { usePromoterAuth } from '../../hooks/useAuthHooks';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useUserLoginMutation } from '../../redux/slices/apiSlice';
import { setCredentials as setAuthCredentials } from '../../redux/slices/authSlice';
import Input from '../../components/forms/Input';

import { useOrg } from '../../context/OrgContext';

export default function Login({ userType }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentOrg } = useOrg();

    // Get both contexts, but they might be null depending on where this is rendered?
    // Actually they are both provided at root.
    const [activeUserType, setActiveUserType] = useState(userType || 'admin');

    const [login] = useLoginMutation();
    const [userLogin] = useUserLoginMutation();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        phone: '',
        org_slug: currentOrg?.slug || 'travel-adventures' // Default or derived
    });

    // Update form data when org context changes
    useEffect(() => {
        if (currentOrg?.slug) {
            setFormData(prev => ({ ...prev, org_slug: currentOrg.slug }));
        }
    }, [currentOrg]);

    const isRestricted = !!userType;
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            let result;
            if (activeUserType === 'promoter' || activeUserType === 'admin' || activeUserType === 'super_admin') {
                // Admin, Super Admin or Promoter Login
                let role = activeUserType === 'admin' ? 'admin_org' : activeUserType;
                // Handle super admin role specifically if activeUserType is just userType prop passed down
                if (activeUserType === 'super_admin') role = 'super_admin';

                result = await login({
                    username: formData.username,
                    password: formData.password,
                    role: role // Map to backend role enum
                }).unwrap();
            } else {
                // User Login (Public)
                const payload = {
                    email: formData.username,
                    password: formData.password,
                    org_slug: formData.org_slug
                };
                console.log('Login Payload:', payload);

                result = await userLogin(payload).unwrap();
            }

            // Sync with Redux Auth Slice
            if (result) {
                dispatch(setAuthCredentials({
                    user: result.user,
                    token: result.token || result.user.token // Assuming token is in user object based on mock/controller
                }));
            }

            // Redirect based on role
            const redirectPath = {
                super_admin: '/superadmin',
                admin_org: '/admin',
                promoter: '/promoter',
                user: from,
            }[result.user.role] || from;

            navigate(redirectPath, { replace: true });

        } catch (err) {
            setError(err?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-2xl">T</span>
                        </div>
                        <span className="text-white font-bold text-3xl">TravelAgency</span>
                    </Link>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-dark-900">
                            {userType === 'admin' ? 'Admin Login' :
                                userType === 'promoter' ? 'Promoter Login' :
                                    'Welcome Back'}
                        </h2>
                        <p className="text-text-light mt-1">Sign in to your account</p>
                    </div>

                    {/* User Type Tabs - ONLY show if no specific userType prop is provided */}
                    {!isRestricted && (
                        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
                            {[
                                { value: 'admin', label: 'Admin' },
                                { value: 'promoter', label: 'Promoter' },
                                { value: 'user', label: 'Public User' },
                            ].map(type => (
                                <button
                                    key={type.value}
                                    onClick={() => setActiveUserType(type.value)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeUserType === type.value
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label={activeUserType === 'user' ? 'Email or Phone' : 'Username'}
                            type="text"
                            placeholder={activeUserType === 'user' ? 'Enter your email or phone' : 'Enter your username'}
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
                            disabled={isLoading}
                            className="btn-primary w-full py-3 mt-6"
                        >
                            {isLoading ? (
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
                        <div className="text-xs text-gray-500 space-y-1">
                            {activeUserType === 'admin' && (
                                <p><span className="font-medium">Admin:</span> john / admin123</p>
                            )}
                            {activeUserType === 'promoter' && (
                                <p><span className="font-medium">Promoter:</span> arrival1 / scan123</p>
                            )}
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-500 mt-4">
                        <Link to="/superadmin/login" className="text-gray-400 hover:text-gray-600">
                            Super Admin Login →
                        </Link>
                    </p>

                    <p className="text-center text-sm text-gray-600 mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
