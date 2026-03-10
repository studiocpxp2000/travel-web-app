import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useGetPublicPageContentQuery } from '../../redux/slices/apiSlice';
import Loading from '../../components/common/Loading';

export default function FAQ() {
    const { orgSlug } = useParams();
    const { data, isLoading } = useGetPublicPageContentQuery(
        { orgSlug, pageType: 'faq' },
        { skip: !orgSlug }
    );

    // Use API content
    const faqContent = data?.data?.content;
    const [openItems, setOpenItems] = useState({});

    const toggleItem = (id) => {
        setOpenItems(prev => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    if (isLoading) return <Loading />;

    // If no content or no items, show empty state
    if (!faqContent || !faqContent.items || faqContent.items.length === 0) {
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
                <div className="min-h-[40vh] flex items-center justify-center bg-white">
                    <div className="text-center text-gray-500">
                        <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No FAQs available at the moment.</p>
                    </div>
                </div>
            </div>
        );
    }

    const faqData = faqContent.items;

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

