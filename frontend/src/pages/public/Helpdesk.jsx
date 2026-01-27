import { useState } from 'react';
import { Headphones, MessageSquare, Phone, Mail, Send, CheckCircle } from 'lucide-react';
import Input, { Textarea, Select } from '../../components/forms/Input';

const faqQuickHelp = [
    { q: 'How do I get my QR code?', a: 'Check your registration confirmation email.' },
    { q: 'What are the event timings?', a: 'Events run from 9 AM to 10 PM daily.' },
    { q: 'Is parking available?', a: 'Yes, free parking is available at the venue.' },
];

export default function Helpdesk() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        category: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Helpdesk form:', formData);
        setSubmitted(true);
    };

    const categoryOptions = [
        { value: 'registration', label: 'Registration Issues' },
        { value: 'technical', label: 'Technical Support' },
        { value: 'event', label: 'Event Information' },
        { value: 'other', label: 'Other' },
    ];

    if (submitted) {
        return (
            <div className="py-12">
                <div className="max-w-md mx-auto px-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-dark-900 mb-4">Message Sent!</h1>
                    <p className="text-text-light mb-6">
                        Thank you for reaching out. Our team will get back to you within 24 hours.
                    </p>
                    <button
                        onClick={() => {
                            setSubmitted(false);
                            setFormData({ name: '', email: '', category: '', message: '' });
                        }}
                        className="btn-primary"
                    >
                        Send Another Message
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                        <Headphones className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-dark-900 mb-4">Help Desk</h1>
                    <p className="text-lg text-text-light max-w-2xl mx-auto">
                        Need assistance? We're here to help. Contact us or check our quick answers below.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Contact Form */}
                    <div className="card">
                        <h2 className="text-xl font-semibold text-dark-900 mb-6 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary-500" />
                            Send us a Message
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Your Name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <Select
                                label="Category"
                                placeholder="Select a category"
                                options={categoryOptions}
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            />
                            <Textarea
                                label="Message"
                                placeholder="Describe your issue or question"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={4}
                                required
                            />
                            <button type="submit" className="btn-primary w-full">
                                <Send className="w-4 h-4 mr-2" />
                                Send Message
                            </button>
                        </form>
                    </div>

                    {/* Quick Help & Contact */}
                    <div className="space-y-6">
                        {/* Contact Info */}
                        <div className="card">
                            <h2 className="text-xl font-semibold text-dark-900 mb-4">Contact Information</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-light">Phone</p>
                                        <p className="font-medium text-dark-900">+1 (555) 123-4567</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-light">Email</p>
                                        <p className="font-medium text-dark-900">support@travelagency.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Answers */}
                        <div className="card">
                            <h2 className="text-xl font-semibold text-dark-900 mb-4">Quick Answers</h2>
                            <div className="space-y-4">
                                {faqQuickHelp.map((item, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-gray-50">
                                        <p className="font-medium text-dark-900 text-sm">{item.q}</p>
                                        <p className="text-text-light text-sm mt-1">{item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Support Hours */}
                        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                            <h3 className="font-semibold mb-2">Support Hours</h3>
                            <p className="text-primary-100 text-sm">
                                Monday - Friday: 9:00 AM - 6:00 PM<br />
                                Saturday: 10:00 AM - 4:00 PM<br />
                                Sunday: Closed
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
