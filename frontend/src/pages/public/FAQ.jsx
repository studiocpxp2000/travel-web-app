import { useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import { mockPageContent } from '../../utils/mockData';
import { createMarkup } from '../../utils/helpers';

const faqData = [
    {
        category: 'Registration',
        questions: [
            {
                q: 'How do I register for the event?',
                a: 'You can register by clicking the "Register" button on our website and filling out the registration form. You will receive a confirmation email with your QR code.',
            },
            {
                q: 'Can I register on the day of the event?',
                a: 'Yes, on-site registration is available, but we recommend registering in advance to save time and ensure your spot.',
            },
            {
                q: 'Is registration free?',
                a: 'Registration fees vary by event. Please check the specific event page for pricing details.',
            },
        ],
    },
    {
        category: 'Event Details',
        questions: [
            {
                q: 'What should I bring to the event?',
                a: 'Please bring your QR code (printed or on your phone), a valid ID, and any materials mentioned in your confirmation email.',
            },
            {
                q: 'Is there a dress code?',
                a: 'The dress code is smart casual. Comfortable shoes are recommended as there will be walking involved.',
            },
            {
                q: 'Will food and beverages be provided?',
                a: 'Yes, lunch and refreshments are included with your registration. Please inform us of any dietary restrictions.',
            },
        ],
    },
    {
        category: 'Technical',
        questions: [
            {
                q: 'Is there Wi-Fi at the venue?',
                a: 'Yes, complimentary Wi-Fi is available throughout the venue. Network details will be provided at check-in.',
            },
            {
                q: 'What if I lose my QR code?',
                a: 'No worries! Visit the registration desk with your ID, and we will help you retrieve your information.',
            },
        ],
    },
    {
        category: 'Cancellation',
        questions: [
            {
                q: 'Can I cancel my registration?',
                a: 'Yes, you can cancel up to 48 hours before the event for a full refund. Please contact support@travelagency.com.',
            },
            {
                q: 'Can I transfer my registration to someone else?',
                a: 'Yes, registration transfers are allowed. Please contact us at least 24 hours before the event.',
            },
        ],
    },
];

export default function FAQ() {
    const [searchTerm, setSearchTerm] = useState('');
    const [openItems, setOpenItems] = useState({});

    const toggleItem = (categoryIdx, questionIdx) => {
        const key = `${categoryIdx}-${questionIdx}`;
        setOpenItems(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const filteredFaq = faqData.map(category => ({
        ...category,
        questions: category.questions.filter(
            q => q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.a.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    })).filter(category => category.questions.length > 0);

    return (
        <div className="py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="w-8 h-8 text-primary-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-dark-900 mb-4">Frequently Asked Questions</h1>
                    <p className="text-lg text-text-light max-w-2xl mx-auto">
                        Find answers to common questions about our events.
                    </p>
                </div>

                {/* Search */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input pl-12"
                    />
                </div>

                {/* FAQ Categories */}
                <div className="space-y-8">
                    {filteredFaq.map((category, categoryIdx) => (
                        <div key={categoryIdx}>
                            <h2 className="text-xl font-semibold text-dark-900 mb-4">{category.category}</h2>
                            <div className="space-y-3">
                                {category.questions.map((item, questionIdx) => {
                                    const key = `${categoryIdx}-${questionIdx}`;
                                    const isOpen = openItems[key];
                                    return (
                                        <div key={questionIdx} className="card p-0 overflow-hidden">
                                            <button
                                                onClick={() => toggleItem(categoryIdx, questionIdx)}
                                                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                            >
                                                <span className="font-medium text-dark-900 pr-4">{item.q}</span>
                                                <ChevronDown
                                                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''
                                                        }`}
                                                />
                                            </button>
                                            {isOpen && (
                                                <div className="px-4 pb-4 text-text-light animate-fade-in">
                                                    {item.a}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dynamic Content */}
                <div className="mt-12 pt-12 border-t">
                    <div
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={createMarkup(mockPageContent.faq.body)}
                    />
                </div>
            </div>
        </div>
    );
}
