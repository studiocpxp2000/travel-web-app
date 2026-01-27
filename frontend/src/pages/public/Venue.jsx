import { MapPin, Phone, Mail, Clock, Car, Train, Plane } from 'lucide-react';
import { mockPageContent } from '../../utils/mockData';
import { createMarkup } from '../../utils/helpers';

export default function Venue() {
    return (
        <div className="py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-dark-900 mb-4">Event Venue</h1>
                    <p className="text-lg text-text-light max-w-2xl mx-auto">
                        Join us at our premium venue for an unforgettable travel experience.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Map Placeholder */}
                    <div className="card p-0 overflow-hidden">
                        <div className="h-80 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <div className="text-center">
                                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">Interactive Map</p>
                                <p className="text-sm text-gray-400">Coming Soon</p>
                            </div>
                        </div>
                    </div>

                    {/* Venue Details */}
                    <div className="space-y-6">
                        <div className="card">
                            <h2 className="text-2xl font-bold text-dark-900 mb-4">Grand Convention Center</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-primary-500 mt-1" />
                                    <div>
                                        <p className="font-medium text-dark-900">Address</p>
                                        <p className="text-text-light">123 Travel Street, Adventure City, AC 12345</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-primary-500 mt-1" />
                                    <div>
                                        <p className="font-medium text-dark-900">Phone</p>
                                        <p className="text-text-light">+1 (555) 123-4567</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-primary-500 mt-1" />
                                    <div>
                                        <p className="font-medium text-dark-900">Email</p>
                                        <p className="text-text-light">venue@travelagency.com</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-primary-500 mt-1" />
                                    <div>
                                        <p className="font-medium text-dark-900">Event Hours</p>
                                        <p className="text-text-light">8:00 AM - 10:00 PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Getting There */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-dark-900 mb-4">Getting There</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 rounded-lg bg-gray-50">
                                    <Car className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                                    <p className="text-sm font-medium">By Car</p>
                                    <p className="text-xs text-text-light">Free Parking</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-gray-50">
                                    <Train className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                                    <p className="text-sm font-medium">By Train</p>
                                    <p className="text-xs text-text-light">5 min walk</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-gray-50">
                                    <Plane className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                                    <p className="text-sm font-medium">By Air</p>
                                    <p className="text-xs text-text-light">20 min drive</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dynamic Content */}
                <div className="mt-12 pt-12 border-t">
                    <div
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={createMarkup(mockPageContent.venue.body)}
                    />
                </div>
            </div>
        </div>
    );
}
