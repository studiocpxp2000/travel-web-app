import { ArrowRight, Calendar, MapPin, Users, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockPageContent } from '../../utils/mockData';
import { createMarkup } from '../../utils/helpers';

export default function Home() {
    return (
        <div>
            {/* Hero Section - Static */}
            <section className="relative bg-gradient-to-br from-dark-900 via-primary-900 to-dark-800 py-20 lg:py-32 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
                            {mockPageContent.home.hero.title}
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                            {mockPageContent.home.hero.subtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register" className="btn-primary btn-lg">
                                Register Now
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                            <Link to="/agenda" className="btn-outline btn-lg text-white border-white hover:bg-white/10">
                                View Agenda
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="relative max-w-5xl mx-auto px-4 mt-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Users, value: '500+', label: 'Attendees' },
                            { icon: Calendar, value: '3 Days', label: 'Event Duration' },
                            { icon: MapPin, value: '10+', label: 'Destinations' },
                            { icon: Star, value: '50+', label: 'Speakers' },
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                                <stat.icon className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-gray-400">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Dynamic Body Content */}
            <section className="py-16 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={createMarkup(mockPageContent.home.body)}
                    />
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-dark-900 mb-12">
                        Why Attend Our Event?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'Expert Speakers',
                                description: 'Learn from industry leaders and travel experts from around the world.',
                                icon: '🎤',
                            },
                            {
                                title: 'Networking',
                                description: 'Connect with fellow travel enthusiasts and industry professionals.',
                                icon: '🤝',
                            },
                            {
                                title: 'Exclusive Deals',
                                description: 'Get access to special travel packages and early-bird offers.',
                                icon: '✨',
                            },
                        ].map((feature, idx) => (
                            <div key={idx} className="card-hover text-center">
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-dark-900 mb-2">{feature.title}</h3>
                                <p className="text-text-light">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to Join Us?</h2>
                    <p className="text-lg text-primary-100 mb-8">
                        Register now and be part of an unforgettable travel experience.
                    </p>
                    <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg">
                        Register Today
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </div>
            </section>
        </div>
    );
}
