import { useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';

// FAQ data - flat list without categories
const faqData = [
    {
        id: 'faq-1',
        question: 'How do I register for the event?',
        answer: 'You can register by clicking the "Register" button on our website and filling out the registration form. You will receive a confirmation email with your QR code.',
    },
    {
        id: 'faq-2',
        question: 'Can I register on the day of the event?',
        answer: 'Yes, on-site registration is available, but we recommend registering in advance to save time and ensure your spot.',
    },
    {
        id: 'faq-3',
        question: 'Is registration free?',
        answer: 'Registration fees vary by event. Please check the specific event page for pricing details.',
    },
    {
        id: 'faq-4',
        question: 'What should I bring to the event?',
        answer: 'Please bring your QR code (printed or on your phone), a valid ID, and any materials mentioned in your confirmation email.',
    },
    {
        id: 'faq-5',
        question: 'Is there a dress code?',
        answer: 'The dress code is smart casual. Comfortable shoes are recommended as there will be walking involved.',
    },
    {
        id: 'faq-6',
        question: 'Will food and beverages be provided?',
        answer: 'Yes, lunch and refreshments are included with your registration. Please inform us of any dietary restrictions.',
    },
    {
        id: 'faq-7',
        question: 'Is there Wi-Fi at the venue?',
        answer: 'Yes, complimentary Wi-Fi is available throughout the venue. Network details will be provided at check-in.',
    },
    {
        id: 'faq-8',
        question: 'What if I lose my QR code?',
        answer: 'No worries! Visit the registration desk with your ID, and we will help you retrieve your information.',
    },
    {
        id: 'faq-9',
        question: 'Can I cancel my registration?',
        answer: 'Yes, you can cancel up to 48 hours before the event for a full refund. Please contact support@travelagency.com.',
    },
    {
        id: 'faq-10',
        question: 'Can I transfer my registration to someone else?',
        answer: 'Yes, registration transfers are allowed. Please contact us at least 24 hours before the event.',
    },
];

export default function FAQ() {
    const [searchTerm, setSearchTerm] = useState('');
    const [openItems, setOpenItems] = useState({});

    const toggleItem = (id) => {
        setOpenItems(prev => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const filteredFaq = faqData.filter(
        item => item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

                {/* FAQ List - Flat structure */}
                <div className="space-y-3">
                    {filteredFaq.map(item => {
                        const isOpen = openItems[item.id];
                        return (
                            <div key={item.id} className="card p-0 overflow-hidden">
                                <button
                                    onClick={() => toggleItem(item.id)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-medium text-dark-900 pr-4">{item.question}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-4 pb-4 text-text-light animate-fade-in">
                                        {item.answer}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* No results */}
                {filteredFaq.length === 0 && (
                    <div className="text-center py-12">
                        <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No matching questions found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
