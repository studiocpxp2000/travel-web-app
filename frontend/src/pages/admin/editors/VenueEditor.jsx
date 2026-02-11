import React, { memo } from 'react';
import { MapPin, Building, Image, Trash2, Check, Plus, X } from 'lucide-react';
import Input, { Textarea } from '../../../components/forms/Input';

const VenueEditor = memo(({
    content,
    updateVenueEventVenue,
    updateVenueAccommodation,
    updateVenueAccommodationImage,
    handleVenueImageUpload,
    removeVenueImage,
    updateVenueInclusion,
    removeVenueInclusion,
    addVenueInclusion,
    updateVenueExclusion,
    removeVenueExclusion,
    addVenueExclusion,
    updateVenueExclusionDisclaimer,
    updateVenueComplimentary,
    updateVenueComplimentaryItem,
    removeVenueComplimentaryItem,
    addVenueComplimentaryItem
}) => {
    return (
        <div className="space-y-8">
            {/* Event Venue Section */}
            <div className="border-b pb-6">
                <h4 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    Event Venue
                </h4>
                <div className="grid gap-4">
                    <Input
                        label="Section Title"
                        value={content.eventVenue.title}
                        onChange={(e) => updateVenueEventVenue('title', e.target.value)}
                        placeholder="Event Venue"
                    />
                    <Textarea
                        label="Address"
                        value={content.eventVenue.address}
                        onChange={(e) => updateVenueEventVenue('address', e.target.value)}
                        placeholder="Enter venue address"
                        rows={2}
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input
                            label="Google Maps Link (optional)"
                            value={content.eventVenue.googleMapsLink}
                            onChange={(e) => updateVenueEventVenue('googleMapsLink', e.target.value)}
                            placeholder="https://maps.google.com/..."
                        />
                        <Input
                            label="Apple Maps Link (optional)"
                            value={content.eventVenue.appleMapsLink}
                            onChange={(e) => updateVenueEventVenue('appleMapsLink', e.target.value)}
                            placeholder="https://maps.apple.com/..."
                        />
                    </div>
                </div>
            </div>

            {/* Accommodation Section */}
            <div className="border-b pb-6">
                <h4 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary-500" />
                    Accommodation / Hotel
                </h4>
                <div className="grid gap-4">
                    <Input
                        label="Title"
                        value={content.accommodation.title}
                        onChange={(e) => updateVenueAccommodation('title', e.target.value)}
                        placeholder="Accommodation: Hotel Name"
                    />
                    <Textarea
                        label="Description"
                        value={content.accommodation.description}
                        onChange={(e) => updateVenueAccommodation('description', e.target.value)}
                        placeholder="Describe the hotel..."
                        rows={3}
                    />
                    <Textarea
                        label="Details"
                        value={content.accommodation.details}
                        onChange={(e) => updateVenueAccommodation('details', e.target.value)}
                        placeholder="Check-in details, what's included..."
                        rows={3}
                    />
                    <Textarea
                        label="Disclaimer"
                        value={content.accommodation.disclaimer}
                        onChange={(e) => updateVenueAccommodation('disclaimer', e.target.value)}
                        placeholder="Any disclaimers about the accommodation..."
                        rows={2}
                    />
                    <Input
                        label="Hotel Website Link"
                        value={content.accommodation.hotelLink}
                        onChange={(e) => updateVenueAccommodation('hotelLink', e.target.value)}
                        placeholder="https://hotel-website.com"
                    />

                    {/* Images */}
                    <div>
                        <label className="form-label flex items-center gap-2 mb-3">
                            <Image className="w-4 h-4" />
                            Hotel Images (Max 4)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {content.accommodation.images.map((img, idx) => (
                                <div key={idx} className="border p-4 rounded-lg bg-gray-50">
                                    <div className="mb-3">
                                        <label className="text-xs font-medium text-gray-700 block mb-1">Image {idx + 1}</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Input
                                                    value={img?.length > 50 ? '(Uploaded Image Data)' : img}
                                                    onChange={(e) => updateVenueAccommodationImage(idx, e.target.value)}
                                                    placeholder="https://..."
                                                    disabled={img?.startsWith('data:')}
                                                />
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleVenueImageUpload(idx, e)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <button className="btn-secondary h-full px-3">
                                                    Upload
                                                </button>
                                            </div>
                                            {img && (
                                                <button
                                                    onClick={() => removeVenueImage(idx)}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded"
                                                    title="Remove Image"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="aspect-video bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                                        {img ? (
                                            <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                        ) : (
                                            <span className="text-xs text-gray-400">No image selected</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="border-b pb-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Inclusions */}
                    <div>
                        <h4 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            Room Inclusions
                        </h4>
                        <div className="space-y-2">
                            {content.inclusions.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        value={item}
                                        onChange={(e) => updateVenueInclusion(idx, e.target.value)}
                                        placeholder="e.g., Complimentary Breakfast"
                                    />
                                    <button
                                        onClick={() => removeVenueInclusion(idx)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addVenueInclusion}
                                className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Inclusion
                            </button>
                        </div>
                    </div>

                    {/* Exclusions */}
                    <div>
                        <h4 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
                            <X className="w-4 h-4 text-red-500" />
                            Room Exclusions
                        </h4>
                        <div className="space-y-2">
                            {content.exclusions.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        value={item}
                                        onChange={(e) => updateVenueExclusion(idx, e.target.value)}
                                        placeholder="e.g., Mini Bar"
                                    />
                                    <button
                                        onClick={() => removeVenueExclusion(idx)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addVenueExclusion}
                                className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Exclusion
                            </button>
                        </div>
                        <div className="mt-4">
                            <Textarea
                                label="Exclusion Disclaimer"
                                value={content.exclusionDisclaimer}
                                onChange={(e) => updateVenueExclusionDisclaimer(e.target.value)}
                                placeholder="e.g., Additional services will be payable..."
                                rows={2}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Complimentary Facilities */}
            <div>
                <h4 className="font-semibold text-dark-900 mb-4">Complimentary Facilities</h4>
                <div className="grid gap-4">
                    <Input
                        label="Section Title"
                        value={content.complimentaryFacilities.title}
                        onChange={(e) => updateVenueComplimentary('title', e.target.value)}
                        placeholder="e.g., Complimentary Breakfast"
                    />
                    <div>
                        <label className="form-label mb-2">Facility Details</label>
                        <div className="space-y-2">
                            {content.complimentaryFacilities.items.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <select
                                        value={item.icon}
                                        onChange={(e) => updateVenueComplimentaryItem(idx, 'icon', e.target.value)}
                                        className="form-input w-32"
                                    >
                                        <option value="location">📍 Location</option>
                                        <option value="time">🕐 Time</option>
                                        <option value="info">ℹ️ Info</option>
                                    </select>
                                    <Input
                                        value={item.text}
                                        onChange={(e) => updateVenueComplimentaryItem(idx, 'text', e.target.value)}
                                        placeholder="e.g., Location: Restaurant Name"
                                        className="flex-1"
                                    />
                                    <button
                                        onClick={() => removeVenueComplimentaryItem(idx)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addVenueComplimentaryItem}
                                className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Detail
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default VenueEditor;
