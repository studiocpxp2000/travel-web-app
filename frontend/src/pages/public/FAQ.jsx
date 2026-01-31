import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

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
    const [openItems, setOpenItems] = useState({});

    const toggleItem = (id) => {
        setOpenItems(prev => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <div>
            {/* Hero Section with Video Background - consistent with other pages */}
            <section className="relative h-[25vh] min-h-[180px] overflow-hidden">
                {/* Video Background */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover blur-[2px]"
                >
                    <source src="/faq-video.mp4" type="video/mp4" />
                </video>

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Frequently Asked Questions</h1>
                    <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed">
                        Find answers to common questions about our events.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="py-8 md:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* FAQ List - Flat structure */}
                    <div className="space-y-2 md:space-y-3">
                        {faqData.map(item => {
                            const isOpen = openItems[item.id];
                            return (
                                <div key={item.id} className="card p-0 overflow-hidden">
                                    <button
                                        onClick={() => toggleItem(item.id)}
                                        className="w-full flex items-center justify-between p-3 md:p-4 text-left hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="font-medium text-dark-900 pr-4 text-sm md:text-base">{item.question}</span>
                                        <ChevronDown
                                            className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>
                                    <div
                                        className="grid transition-all duration-300 ease-in-out"
                                        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="px-3 md:px-4 pb-3 md:pb-4 text-text-light text-sm md:text-base">
                                                {item.answer}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
