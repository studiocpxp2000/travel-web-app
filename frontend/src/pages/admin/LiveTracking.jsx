import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useGetLocationsQuery } from '../../redux/slices/apiSlice';
import { getSocket } from '../../services/socket';
import { useSelector } from 'react-redux';
import { MapPin, RefreshCw } from 'lucide-react';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

// Default center (can be overridden by actual user data)
const defaultCenter = {
    lat: 37.7749,
    lng: -122.4194,
};

const LiveTracking = () => {
    const { data: initialData, isLoading, refetch, isFetching } = useGetLocationsQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const auth = useSelector((state) => state.auth);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '', 
    });

    const [map, setMap] = useState(null);
    const [locations, setLocations] = useState(new Map());

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    // Initialize state from API
    useEffect(() => {
        if (initialData?.success && initialData.data) {
            const newLocations = new Map();
            initialData.data.forEach((loc) => {
                if (loc.location && loc.location.coordinates && loc.user_id) {
                    const userId = loc.user_id._id || loc.user_id;
                    newLocations.set(userId, {
                        userId: userId,
                        name: loc.user_id.name || 'Unknown',
                        email: loc.user_id.email || '',
                        lat: loc.location.coordinates[1],
                        lng: loc.location.coordinates[0],
                        timestamp: loc.lastUpdated,
                        isOnline: true,
                    });
                }
            });
            setLocations(newLocations);

            // Center map on first user if available
            if (newLocations.size > 0 && map) {
                const firstLoc = newLocations.values().next().value;
                map.panTo({ lat: firstLoc.lat, lng: firstLoc.lng });
                map.setZoom(14);
            }
        }
    }, [initialData, map]);

    const handleUserClick = (loc) => {
        if (map && loc.lat && loc.lng) {
            map.panTo({ lat: loc.lat, lng: loc.lng });
            map.setZoom(16);
        }
    };

    // Handle Socket events
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        // Ensure socket is joined to admin room if needed, though backend handles emit to "admins" directly
        if (auth?.user?.org_id || auth?.user?.orgId) {
            const orgId = auth.user.org_id || auth.user.orgId;
            socket.emit('join_admin_room', orgId); 
            // Our backend broadcasts to 'admins' globally for simplicity, 
            // but joining org_id or admin_orgSlug allows for scoped broadcasting in the future.
        }

        const handleLocationUpdated = (data) => {
            const { userId, latitude, longitude, timestamp } = data;
            setLocations((prev) => {
                const newLocs = new Map(prev);
                const existing = newLocs.get(userId) || {
                    userId,
                    name: 'Unknown User',
                    isOnline: true,
                };
                newLocs.set(userId, {
                    ...existing,
                    lat: latitude,
                    lng: longitude,
                    timestamp,
                    isOnline: true,
                });
                return newLocs;
            });
        };

        const handleUserOnline = ({ userId }) => {
            setLocations((prev) => {
                if (!prev.has(userId)) return prev;
                const newLocs = new Map(prev);
                newLocs.set(userId, { ...newLocs.get(userId), isOnline: true });
                return newLocs;
            });
        };

        const handleUserOffline = ({ userId }) => {
            setLocations((prev) => {
                if (!prev.has(userId)) return prev;
                const newLocs = new Map(prev);
                newLocs.set(userId, { ...newLocs.get(userId), isOnline: false });
                return newLocs;
            });
        };

        socket.on('userLocationUpdated', handleLocationUpdated);
        socket.on('userOnline', handleUserOnline);
        socket.on('userOffline', handleUserOffline);

        return () => {
            socket.off('userLocationUpdated', handleLocationUpdated);
            socket.off('userOnline', handleUserOnline);
            socket.off('userOffline', handleUserOffline);
        };
    }, [auth]);

    // Render Markers
    const renderMarkers = () => {
        const markers = [];
        locations.forEach((loc) => {
            if (loc.lat && loc.lng) {
                const iconUrl = loc.isOnline 
                    ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' 
                    : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';

                markers.push(
                    <Marker
                        key={loc.userId}
                        position={{ lat: loc.lat, lng: loc.lng }}
                        icon={{ url: iconUrl }}
                        title={`${loc.name || 'User'}\n${loc.isOnline ? 'Online' : 'Offline'}\nLast updated: ${new Date(loc.timestamp).toLocaleTimeString()}`}
                    />
                );
            }
        });
        return markers;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] p-6 bg-slate-50 dark:bg-slate-900">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Live Tracking</h1>
                    <p className="text-slate-500 dark:text-slate-400">Monitor active users on the map in real-time</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 mr-4">
                        <img src="http://maps.google.com/mapfiles/ms/icons/green-dot.png" className="w-5 h-5" alt="Online" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Online</span>
                        
                        <img src="http://maps.google.com/mapfiles/ms/icons/red-dot.png" className="w-5 h-5 ml-2" alt="Offline" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Offline (Last Known)</span>
                    </div>
                    
                    <button 
                        onClick={refetch} 
                        disabled={isFetching}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
                    >
                        <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
                {/* Users List Sidebar */}
                <div className="w-80 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden hidden md:flex shrink-0">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h2 className="font-semibold text-slate-800 dark:text-white flex items-center justify-between">
                            Active Users
                            <span className="text-xs font-normal bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 px-2 py-1 rounded-full">
                                {locations.size}
                            </span>
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        {Array.from(locations.values()).map(loc => (
                            <button
                                key={loc.userId}
                                onClick={() => handleUserClick(loc)}
                                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left mb-1 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            >
                                <div className="flex-1 min-w-0 pr-3">
                                    <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{loc.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{loc.email || 'No email'}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Updated: {new Date(loc.timestamp).toLocaleTimeString()}</p>
                                </div>
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${loc.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                            </button>
                        ))}
                        {locations.size === 0 && !isLoading && (
                            <div className="text-center p-6">
                                <p className="text-slate-500 dark:text-slate-400 text-sm">No users found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Area */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                    {!isLoaded || isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 z-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={defaultCenter}
                            zoom={10}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
                            options={{
                                mapTypeControl: true,
                                streetViewControl: true,
                                fullscreenControl: true,
                            }}
                        >
                            {renderMarkers()}
                        </GoogleMap>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveTracking;
