import { Calendar, Clock, MapPin } from 'lucide-react';
import { mockPageContent } from '../../utils/mockData';
import { createMarkup } from '../../utils/helpers';

const schedule = [
    {
        day: 'Day 1',
        date: 'January 15, 2026',
        events: [
            { time: '9:00 AM', title: 'Registration & Check-in', location: 'Main Lobby', type: 'general' },
            { time: '10:00 AM', title: 'Opening Ceremony', location: 'Grand Hall', type: 'ceremony' },
            { time: '11:30 AM', title: 'Keynote: Future of Travel', location: 'Grand Hall', type: 'keynote' },
            { time: '1:00 PM', title: 'Lunch Break', location: 'Dining Area', type: 'break' },
            { time: '2:30 PM', title: 'Session 1: Sustainable Travel', location: 'Room A', type: 'session' },
            { time: '4:00 PM', title: 'Session 2: Adventure Tourism', location: 'Room B', type: 'session' },
            { time: '6:00 PM', title: 'Networking Dinner', location: 'Rooftop Terrace', type: 'networking' },
        ],
    },
    {
        day: 'Day 2',
        date: 'January 16, 2026',
        events: [
            { time: '9:00 AM', title: 'Morning Yoga', location: 'Garden', type: 'wellness' },
            { time: '10:00 AM', title: 'Session 3: Luxury Destinations', location: 'Room A', type: 'session' },
            { time: '11:30 AM', title: 'Session 4: Budget Travel Tips', location: 'Room B', type: 'session' },
            { time: '1:00 PM', title: 'Lunch Break', location: 'Dining Area', type: 'break' },
            { time: '2:30 PM', title: 'Session 5: Travel Photography', location: 'Room C', type: 'session' },
            { time: '4:00 PM', title: 'Panel Discussion', location: 'Grand Hall', type: 'panel' },
            { time: '7:00 PM', title: 'Gala Night', location: 'Ballroom', type: 'ceremony' },
        ],
    },
    {
        day: 'Day 3',
        date: 'January 17, 2026',
        events: [
            { time: '9:00 AM', title: 'Session 6: Digital Nomads', location: 'Room A', type: 'session' },
            { time: '10:30 AM', title: 'Session 7: Family Travel', location: 'Room B', type: 'session' },
            { time: '12:00 PM', title: 'Closing Ceremony', location: 'Grand Hall', type: 'ceremony' },
            { time: '1:30 PM', title: 'Farewell Lunch', location: 'Garden', type: 'break' },
        ],
    },
];

const typeColors = {
    general: 'bg-gray-100 text-gray-700',
    ceremony: 'bg-purple-100 text-purple-700',
    keynote: 'bg-blue-100 text-blue-700',
    session: 'bg-green-100 text-green-700',
    break: 'bg-yellow-100 text-yellow-700',
    networking: 'bg-pink-100 text-pink-700',
    wellness: 'bg-teal-100 text-teal-700',
    panel: 'bg-indigo-100 text-indigo-700',
};

export default function Agenda() {
    return (
        <div className="py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-dark-900 mb-4">Event Agenda</h1>
                    <p className="text-lg text-text-light max-w-2xl mx-auto">
                        Three days of inspiring sessions, networking opportunities, and unforgettable experiences.
                    </p>
                </div>

                {/* Schedule */}
                <div className="space-y-12">
                    {schedule.map((day, dayIdx) => (
                        <div key={dayIdx}>
                            {/* Day Header */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary-500 flex items-center justify-center">
                                    <Calendar className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-dark-900">{day.day}</h2>
                                    <p className="text-text-light">{day.date}</p>
                                </div>
                            </div>

                            {/* Events */}
                            <div className="space-y-4 ml-8 border-l-2 border-gray-200 pl-8">
                                {day.events.map((event, eventIdx) => (
                                    <div
                                        key={eventIdx}
                                        className="card-hover relative before:absolute before:-left-[2.6rem] before:top-6 before:w-4 before:h-4 before:rounded-full before:bg-primary-500"
                                    >
                                        <div className="flex flex-wrap items-start gap-4">
                                            <div className="flex items-center gap-2 text-sm text-text-light">
                                                <Clock className="w-4 h-4" />
                                                {event.time}
                                            </div>
                                            <span className={`badge ${typeColors[event.type]}`}>
                                                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-dark-900 mt-2">{event.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-text-light mt-1">
                                            <MapPin className="w-4 h-4" />
                                            {event.location}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dynamic Content */}
                <div className="mt-12 pt-12 border-t">
                    <div
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={createMarkup(mockPageContent.agenda.body)}
                    />
                </div>
            </div>
        </div>
    );
}
