import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import Input from '../../components/forms/Input';
import { Select } from '../../components/forms/Input';
import { isValidEmail, generateId } from '../../utils/helpers';
import { mockOrganizations } from '../../utils/mockData';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        organization: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!isValidEmail(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.organization) newErrors.organization = 'Please select an organization';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In a real app, this would make an API call
        const newUser = {
            id: generateId('user'),
            org_id: formData.organization,
            name: formData.name,
            email: formData.email,
            qr_code_data: `QR-${formData.organization}-${Date.now()}`,
            arrival_status: false,
            session_1_status: false,
            session_2_status: false,
            session_3_status: false,
            session_4_status: false,
            session_5_status: false,
            session_6_status: false,
            session_7_status: false,
            session_8_status: false,
            session_9_status: false,
        };

        console.log('New user registered:', newUser);
        setSuccess(true);
        setLoading(false);

        // Redirect to login after 2 seconds
        setTimeout(() => {
            navigate('/login');
        }, 2000);
    };

    const orgOptions = mockOrganizations.map(org => ({
        value: org.id,
        label: org.name,
    }));

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-dark-900 mb-2">Registration Successful!</h2>
                    <p className="text-gray-600 mb-4">Your QR code has been generated and sent to your email.</p>
                    <p className="text-sm text-gray-500">Redirecting to login...</p>
                </div>
            </div>
        );
    }

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

                {/* Register Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-dark-900">Create Account</h2>
                        <p className="text-text-light mt-1">Register for the event</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={errors.name}
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            error={errors.email}
                        />

                        <Select
                            label="Organization"
                            placeholder="Select an organization"
                            options={orgOptions}
                            value={formData.organization}
                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                            error={errors.organization}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 mt-6"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5 mr-2" />
                                    Register
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-600 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
