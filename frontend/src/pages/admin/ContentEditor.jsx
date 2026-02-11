import { useState, useEffect } from 'react';
import { FileText, Save, Eye, Upload, Globe, Loader, X } from 'lucide-react';
import HomeEditor from './editors/HomeEditor';
import AgendaEditor from './editors/AgendaEditor';
import VenueEditor from './editors/VenueEditor';
import FaqEditor from './editors/FaqEditor';
import FunzoneEditor from './editors/FunzoneEditor';
import HelpdeskEditor from './editors/HelpdeskEditor';
import Input, { Textarea } from '../../components/forms/Input';
import { useAuth } from '../../hooks/useAuthHooks';
import { createMarkup, generateId } from '../../utils/helpers';
import {
    useGetPageContentQuery,
    useUpdatePageContentMutation,
    usePublishPageContentMutation,
    useUnpublishPageContentMutation,
    useGetOrgPageContentQuery,
    useUpdateOrgPageContentMutation,
    useUploadPageContentImageMutation,
    useDeletePageContentImageMutation
} from '../../redux/slices/apiSlice';
import { useOrg } from '../../context/OrgContext';

// Page options - removed gallery, leaderboard, notifications (separate pages)
const pageOptions = [
    { id: 'home', name: 'Home Page', type: 'structured' },
    { id: 'agenda', name: 'Agenda', type: 'structured' },
    { id: 'venue', name: 'Venue', type: 'structured' },
    { id: 'faq', name: 'FAQs', type: 'structured' },
    { id: 'funzone', name: 'Fun Zone', type: 'structured' },
    { id: 'helpdesk', name: 'Helpdesk', type: 'structured' },
];



// Initial empty content structure
const initialContent = {
    home: {
        heroText: '',
        countdownDate: '',
        aboutTitle: '',
        aboutDescription: '',
        cards: []
    },
    agenda: {
        heroText: '',
        days: []
    },
    venue: {
        eventVenue: {
            title: '',
            address: '',
            googleMapsLink: '',
            appleMapsLink: '',
        },
        accommodation: {
            title: '',
            description: '',
            details: '',
            disclaimer: '',
            hotelLink: '',
            images: ['', '', '', ''],
        },
        inclusions: [],
        exclusions: [],
        exclusionDisclaimer: '',
        complimentaryFacilities: {
            title: '',
            items: [],
        },
    },
    faq: {
        items: []
    },
    funzone: {
        description: '',
        activities: []
    },
    helpdesk: {
        phone: '',
        email: ''
    }
};

const emojiOptions = ['🌍', '🗺️', '🧳', '✈️', '📸', '💱', '🎮', '🏆', '🎯', '🎲', '🃏', '🎪'];

export default function ContentEditor() {
    const { user, isSuperAdmin: authIsSuperAdmin } = useAuth();
    const { currentOrg } = useOrg();

    // Determine context
    // If super admin is strictly in "manage org" mode, currentOrg should be populated by OrgProvider/DashboardLayout
    // But we need to be careful: if a super admin is just on their own dashboard (no org context), this shouldn't break.
    // The route for this page is /superadmin/manage/:orgSlug/content or /admin/content

    const isSuperAdminManaging = authIsSuperAdmin && currentOrg?._id;
    const targetOrgId = isSuperAdminManaging ? currentOrg._id : user?.org_id;

    const [selectedPage, setSelectedPage] = useState('home');
    const [content, setContent] = useState(initialContent);
    const [showPreview, setShowPreview] = useState(false);
    const [saved, setSaved] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    // RTK Query hooks - Conditional skipping
    // Regular Admin Hooks
    const {
        data: adminPageData,
        isLoading: isAdminLoading,
        refetch: refetchAdmin
    } = useGetPageContentQuery(selectedPage, { skip: isSuperAdminManaging });

    const [updateContentAdmin, { isLoading: isSavingAdmin }] = useUpdatePageContentMutation();
    const [publishContentAdmin, { isLoading: isPublishingAdmin }] = usePublishPageContentMutation();
    const [unpublishContentAdmin, { isLoading: isUnpublishingAdmin }] = useUnpublishPageContentMutation();

    // Super Admin Hooks
    const {
        data: superAdminPageData,
        isLoading: isSuperAdminLoading,
        refetch: refetchSuperAdmin
    } = useGetOrgPageContentQuery(
        { orgId: targetOrgId, pageType: selectedPage },
        { skip: !isSuperAdminManaging }
    );

    const [updateOrgContent, { isLoading: isSavingSuperAdmin }] = useUpdateOrgPageContentMutation();
    const [uploadImage, { isLoading: isUploading }] = useUploadPageContentImageMutation();
    const [deleteImage] = useDeletePageContentImageMutation();

    // Unified Data & State
    const pageData = isSuperAdminManaging ? superAdminPageData : adminPageData;
    const isLoading = isSuperAdminManaging ? isSuperAdminLoading : isAdminLoading;
    const isSaving = isSuperAdminManaging ? isSavingSuperAdmin : isSavingAdmin;
    const isPublishing = isSuperAdminManaging ? isSavingSuperAdmin : isPublishingAdmin; // Super admin publish is same mutation
    const isUnpublishing = isSuperAdminManaging ? isSavingSuperAdmin : isUnpublishingAdmin; // Super admin unpublish is same mutation

    const refetch = isSuperAdminManaging ? refetchSuperAdmin : refetchAdmin;

    const currentPageConfig = pageOptions.find(p => p.id === selectedPage);

    // Load content from API when page changes or data updates
    useEffect(() => {
        if (pageData?.data) {
            const apiContent = pageData.data.content || {};

            // Merge with initial structure to ensure all fields exist (prevent white screen crash)
            let mergedContent = { ...initialContent[selectedPage], ...apiContent };

            // Deep merge for nested objects specifically for Venue (multi-level deep)
            if (selectedPage === 'venue') {
                mergedContent = {
                    ...mergedContent,
                    eventVenue: { ...initialContent.venue.eventVenue, ...(apiContent.eventVenue || {}) },
                    accommodation: { ...initialContent.venue.accommodation, ...(apiContent.accommodation || {}) },
                    complimentaryFacilities: { ...initialContent.venue.complimentaryFacilities, ...(apiContent.complimentaryFacilities || {}) }
                };
            }
            // Ensure arrays exist for others if API returns them as undefined
            if (selectedPage === 'agenda' && !mergedContent.days) mergedContent.days = [];
            if (selectedPage === 'faq' && !mergedContent.items) mergedContent.items = [];
            if (selectedPage === 'funzone' && !mergedContent.activities) mergedContent.activities = [];
            if (selectedPage === 'home' && !mergedContent.cards) mergedContent.cards = [];

            setContent(prev => ({
                ...prev,
                [selectedPage]: mergedContent
            }));
            setHasChanges(false);
        }
    }, [pageData, selectedPage]);

    // Refetch when page changes
    useEffect(() => {
        refetch();
    }, [selectedPage, refetch]);

    // Track changes
    const markAsChanged = () => {
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            if (isSuperAdminManaging) {
                await updateOrgContent({
                    orgId: targetOrgId,
                    pageType: selectedPage,
                    content: content[selectedPage]
                    // publish undefined -> preserves current state or defaults false on create
                }).unwrap();
            } else {
                await updateContentAdmin({
                    pageType: selectedPage,
                    content: content[selectedPage]
                }).unwrap();
            }
            setSaved(true);
            setHasChanges(false);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save content. Please try again.');
        }
    };

    const handlePublish = async () => {
        try {
            // Save first if there are changes
            if (hasChanges) {
                if (isSuperAdminManaging) {
                    await updateOrgContent({
                        orgId: targetOrgId,
                        pageType: selectedPage,
                        content: content[selectedPage],
                        // No publish arg here, letting the next call handle it or doing it all in one?
                        // Actually super admin mutation can do both.
                        // But let's follow the pattern: save then publish.
                        publish: true
                    }).unwrap();
                    // For super admin, updateOrgContent with publish:true does both.
                } else {
                    await updateContentAdmin({
                        pageType: selectedPage,
                        content: content[selectedPage]
                    }).unwrap();
                    await publishContentAdmin(selectedPage).unwrap();
                }
            } else {
                // No changes, just publish
                if (isSuperAdminManaging) {
                    await updateOrgContent({
                        orgId: targetOrgId,
                        pageType: selectedPage,
                        content: content[selectedPage],
                        publish: true
                    }).unwrap();
                } else {
                    await publishContentAdmin(selectedPage).unwrap();
                }
            }

            alert(`${currentPageConfig?.name || selectedPage} published successfully!`);
            refetch();
        } catch (error) {
            console.error('Failed to publish:', error);
            alert('Failed to publish content. Please try again.');
        }
    };

    const handleUnpublish = async () => {
        try {
            if (isSuperAdminManaging) {
                await updateOrgContent({
                    orgId: targetOrgId,
                    pageType: selectedPage,
                    content: content[selectedPage], // Need to send content to satisfy validator?
                    publish: false
                }).unwrap();
            } else {
                await unpublishContentAdmin(selectedPage).unwrap();
            }
            alert(`${currentPageConfig?.name || selectedPage} unpublished.`);
            refetch();
        } catch (error) {
            console.error('Failed to unpublish:', error);
            alert('Failed to unpublish content. Please try again.');
        }
    };

    const isPublished = pageData?.data?.isPublished || false;
    const lastUpdated = pageData?.data?.updatedAt ? new Date(pageData.data.updatedAt).toLocaleString() : null;

    // Home handlers
    const updateHome = (field, value) => {
        setContent({
            ...content,
            home: {
                ...content.home,
                [field]: value
            }
        });
    };

    const addHomeCard = () => {
        const newCard = {
            id: generateId('card'),
            icon: 'calendar',
            title: '',
            description: ''
        };
        setContent({
            ...content,
            home: {
                ...content.home,
                cards: [newCard, ...content.home.cards]
            }
        });
    };

    const updateHomeCard = (id, field, value) => {
        setContent({
            ...content,
            home: {
                ...content.home,
                cards: content.home.cards.map(card =>
                    card.id === id ? { ...card, [field]: value } : card
                )
            }
        });
    };

    const removeHomeCard = (id) => {
        setContent({
            ...content,
            home: {
                ...content.home,
                cards: content.home.cards.filter(card => card.id !== id)
            }
        });
    };

    // FAQ handlers
    const addFaqItem = () => {
        const newItem = { id: generateId('faq'), question: '', answer: '' };
        setContent({
            ...content,
            faq: {
                ...content.faq,
                items: [newItem, ...content.faq.items]
            }
        });
        setExpandedFaq(newItem.id);
    };

    const updateFaqItem = (id, field, value) => {
        setContent({
            ...content,
            faq: {
                ...content.faq,
                items: content.faq.items.map(item =>
                    item.id === id ? { ...item, [field]: value } : item
                )
            }
        });
    };

    const removeFaqItem = (id) => {
        setContent({
            ...content,
            faq: {
                ...content.faq,
                items: content.faq.items.filter(item => item.id !== id)
            }
        });
    };

    // Activity handlers
    const addActivity = () => {
        const newActivity = {
            id: generateId('act'),
            title: '',
            description: '',
            icon: '🎮',
            type: 'online',
            link: '',
            duration: '5 min',
            players: '1'
        };
        setContent({
            ...content,
            funzone: {
                ...content.funzone,
                activities: [newActivity, ...content.funzone.activities]
            }
        });
    };

    const updateActivity = (id, field, value) => {
        setContent({
            ...content,
            funzone: {
                ...content.funzone,
                activities: content.funzone.activities.map(act =>
                    act.id === id ? { ...act, [field]: value } : act
                )
            }
        });
    };

    const removeActivity = (id) => {
        setContent({
            ...content,
            funzone: {
                ...content.funzone,
                activities: content.funzone.activities.filter(act => act.id !== id)
            }
        });
    };

    // Helpdesk handlers
    const updateHelpdesk = (field, value) => {
        setContent({
            ...content,
            helpdesk: {
                ...content.helpdesk,
                [field]: value
            }
        });
    };
    const updateAgendaHeroText = (value) => {
        setContent({ ...content, agenda: { ...content.agenda, heroText: value } });
    };

    // Venue handlers
    const updateVenueEventVenue = (field, value) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                eventVenue: {
                    ...content.venue.eventVenue,
                    [field]: value
                }
            }
        });
    };

    const updateVenueAccommodation = (field, value) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                accommodation: {
                    ...content.venue.accommodation,
                    [field]: value
                }
            }
        });
    };

    const updateVenueAccommodationImage = (index, value) => {
        setContent(prev => {
            const newImages = [...prev.venue.accommodation.images];
            newImages[index] = value;
            return {
                ...prev,
                venue: {
                    ...prev.venue,
                    accommodation: {
                        ...prev.venue.accommodation,
                        images: newImages
                    }
                }
            };
        });
    };

    const handleVenueImageUpload = async (idx, e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const oldUrl = content.venue.accommodation.images[idx];
                if (oldUrl && (oldUrl.startsWith('http') || oldUrl.startsWith('https'))) {
                    await deleteImage(oldUrl).unwrap().catch(err => console.warn('Failed to delete old image', err));
                }

                const formData = new FormData();
                formData.append('file', file);
                const res = await uploadImage(formData).unwrap();

                if (res.success) {
                    updateVenueAccommodationImage(idx, res.url);
                }
            } catch (err) {
                console.error('Upload failed:', err);
                alert('Failed to upload image. Please try again.');
            }
        }
    };

    const removeVenueImage = async (idx) => {
        const oldUrl = content.venue.accommodation.images[idx];
        if (oldUrl && (oldUrl.startsWith('http') || oldUrl.startsWith('https'))) {
            await deleteImage(oldUrl).unwrap().catch(err => console.warn('Failed to delete old image', err));
        }
        updateVenueAccommodationImage(idx, '');
    };

    const updateVenueInclusion = (index, value) => {
        const newInclusions = [...content.venue.inclusions];
        newInclusions[index] = value;
        setContent({
            ...content,
            venue: {
                ...content.venue,
                inclusions: newInclusions
            }
        });
    };

    const addVenueInclusion = () => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                inclusions: [...content.venue.inclusions, '']
            }
        });
    };

    const removeVenueInclusion = (index) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                inclusions: content.venue.inclusions.filter((_, i) => i !== index)
            }
        });
    };

    const updateVenueExclusion = (index, value) => {
        const newExclusions = [...content.venue.exclusions];
        newExclusions[index] = value;
        setContent({
            ...content,
            venue: {
                ...content.venue,
                exclusions: newExclusions
            }
        });
    };

    const addVenueExclusion = () => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                exclusions: [...content.venue.exclusions, '']
            }
        });
    };

    const removeVenueExclusion = (index) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                exclusions: content.venue.exclusions.filter((_, i) => i !== index)
            }
        });
    };

    const updateVenueExclusionDisclaimer = (value) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                exclusionDisclaimer: value
            }
        });
    };

    const updateVenueComplimentary = (field, value) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                complimentaryFacilities: {
                    ...content.venue.complimentaryFacilities,
                    [field]: value
                }
            }
        });
    };

    const updateVenueComplimentaryItem = (index, field, value) => {
        const newItems = [...content.venue.complimentaryFacilities.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setContent({
            ...content,
            venue: {
                ...content.venue,
                complimentaryFacilities: {
                    ...content.venue.complimentaryFacilities,
                    items: newItems
                }
            }
        });
    };

    const addVenueComplimentaryItem = () => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                complimentaryFacilities: {
                    ...content.venue.complimentaryFacilities,
                    items: [...content.venue.complimentaryFacilities.items, { icon: 'location', text: '' }]
                }
            }
        });
    };

    const removeVenueComplimentaryItem = (index) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                complimentaryFacilities: {
                    ...content.venue.complimentaryFacilities,
                    items: content.venue.complimentaryFacilities.items.filter((_, i) => i !== index)
                }
            }
        });
    };

    // Save venue content to localStorage
    const handleSaveVenue = () => {
        localStorage.setItem('venueContent', JSON.stringify(content.venue));
        handleSave();
    };

    // Agenda Handlers
    const addAgendaDay = () => {
        const newDay = { id: generateId(), title: `Day ${content.agenda.days.length + 1}`, date: '', events: [] };
        setContent({ ...content, agenda: { ...content.agenda, days: [...content.agenda.days, newDay] } });
    };
    const updateAgendaDay = (dayId, field, value) => {
        const days = content.agenda.days.map(d => d.id === dayId ? { ...d, [field]: value } : d);
        setContent({ ...content, agenda: { ...content.agenda, days } });
    };
    const removeAgendaDay = (dayId) => {
        setContent({ ...content, agenda: { ...content.agenda, days: content.agenda.days.filter(d => d.id !== dayId) } });
    };
    const addAgendaEvent = (dayId) => {
        const newEvent = { id: generateId(), time: '', title: '', location: '', description: '', dressCode: '', images: [] };
        const days = content.agenda.days.map(d => d.id === dayId ? { ...d, events: [...d.events, newEvent] } : d);
        setContent({ ...content, agenda: { ...content.agenda, days } });
    };
    const updateAgendaEvent = (dayId, evtId, field, value) => {
        const days = content.agenda.days.map(d => d.id === dayId ? { ...d, events: d.events.map(e => e.id === evtId ? { ...e, [field]: value } : e) } : d);
        setContent({ ...content, agenda: { ...content.agenda, days } });
    };
    const removeAgendaEvent = async (dayId, evtId) => {
        // Delete images from S3 if they exist (Optimistic deletion or async)
        const day = content.agenda.days.find(d => d.id === dayId);
        const evt = day?.events.find(ev => ev.id === evtId);

        if (evt?.images && evt.images.length > 0) {
            for (const imgUrl of evt.images) {
                if (imgUrl && (imgUrl.startsWith('http') || imgUrl.startsWith('https'))) {
                    deleteImage(imgUrl).unwrap().catch(e => console.warn('Cleanup failed', e));
                }
            }
        }

        setContent(prev => ({
            ...prev,
            agenda: {
                ...prev.agenda,
                days: prev.agenda.days.map(d =>
                    d.id === dayId
                        ? { ...d, events: d.events.filter(e => e.id !== evtId) }
                        : d
                )
            }
        }));
    };

    const handleAgendaImageUpload = async (dayId, evtId, idx, e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Find existing image to delete if replacing
                const day = content.agenda.days.find(d => d.id === dayId);
                const evt = day?.events.find(ev => ev.id === evtId);
                const oldUrl = evt?.images?.[idx];

                if (oldUrl && (oldUrl.startsWith('http') || oldUrl.startsWith('https'))) {
                    await deleteImage(oldUrl).unwrap().catch(err => console.warn('Failed to delete old image', err));
                }

                const formData = new FormData();
                formData.append('file', file);
                const res = await uploadImage(formData).unwrap();

                if (res.success) {
                    updateAgendaEventImage(dayId, evtId, idx, res.url);
                }
            } catch (err) {
                console.error('Upload failed:', err);
                alert('Failed to upload image. Please try again.');
            }
        }
    };

    const updateAgendaEventImage = (dayId, evtId, idx, value) => {
        // If value is empty string, checks if we need to delete from S3? 
        // No, the caller (AgendaEditor) calls this with empty string on delete click.
        // We should handle deletion here if value is empty!

        // Wait, AgendaEditor calls this directly on X button.
        // I should check if we are clearing an image and if so delete it from S3.

        // However, I can't access 'oldUrl' easily inside setContent without logic.
        // So let's handle the delete logic in a wrapper or check before setContent.

        setContent(prev => {
            // Side effect: Check and delete if needed? 
            // Ideally side effects shouldn't be in setContent.
            // But let's check current state 'content' (which might be stale? no, we have 'content' in scope).
            // Better to find it from 'prev'. But we can't do async inside setContent.

            // So I should separate the logic.
            // But 'updateAgendaEventImage' is called by AgendaEditor.

            return {
                ...prev,
                agenda: {
                    ...prev.agenda,
                    days: prev.agenda.days.map(d => {
                        if (d.id !== dayId) return d;
                        const events = d.events.map(e => {
                            if (e.id !== evtId) return e;
                            const images = [...(e.images || [])];
                            while (images.length <= idx) images.push('');
                            images[idx] = value;
                            return { ...e, images };
                        });
                        return { ...d, events };
                    })
                }
            };
        });

        // If clearing image, delete from S3
        if (value === '') {
            const day = content.agenda.days.find(d => d.id === dayId);
            const evt = day?.events.find(ev => ev.id === evtId);
            const oldUrl = evt?.images?.[idx];
            if (oldUrl && (oldUrl.startsWith('http') || oldUrl.startsWith('https'))) {
                deleteImage(oldUrl).unwrap().catch(err => console.warn('Failed to delete old image', err));
            }
        }
    };

    const renderEditor = () => {
        switch (selectedPage) {
            case 'agenda':
                return (
                    <AgendaEditor
                        content={content.agenda}
                        updateAgendaHeroText={updateAgendaHeroText}
                        addAgendaDay={addAgendaDay}
                        updateAgendaDay={updateAgendaDay}
                        removeAgendaDay={removeAgendaDay}
                        addAgendaEvent={addAgendaEvent}
                        updateAgendaEvent={updateAgendaEvent}
                        removeAgendaEvent={removeAgendaEvent}
                        handleAgendaImageUpload={handleAgendaImageUpload}
                        updateAgendaEventImage={updateAgendaEventImage}
                    />
                );
            case 'home':
                return (
                    <HomeEditor
                        content={content.home}
                        updateHome={updateHome}
                        addHomeCard={addHomeCard}
                        updateHomeCard={updateHomeCard}
                        removeHomeCard={removeHomeCard}
                    />
                );
            case 'venue':
                return (
                    <VenueEditor
                        content={content.venue}
                        updateVenueEventVenue={updateVenueEventVenue}
                        updateVenueAccommodation={updateVenueAccommodation}
                        updateVenueAccommodationImage={updateVenueAccommodationImage}
                        handleVenueImageUpload={handleVenueImageUpload}
                        removeVenueImage={removeVenueImage}
                        updateVenueInclusion={updateVenueInclusion}
                        removeVenueInclusion={removeVenueInclusion}
                        addVenueInclusion={addVenueInclusion}
                        updateVenueExclusion={updateVenueExclusion}
                        removeVenueExclusion={removeVenueExclusion}
                        addVenueExclusion={addVenueExclusion}
                        updateVenueExclusionDisclaimer={updateVenueExclusionDisclaimer}
                        updateVenueComplimentary={updateVenueComplimentary}
                        updateVenueComplimentaryItem={updateVenueComplimentaryItem}
                        removeVenueComplimentaryItem={removeVenueComplimentaryItem}
                        addVenueComplimentaryItem={addVenueComplimentaryItem}
                    />
                );
            case 'faq':
                return (
                    <FaqEditor
                        content={content.faq}
                        addFaqItem={addFaqItem}
                        updateFaqItem={updateFaqItem}
                        removeFaqItem={removeFaqItem}
                        expandedFaq={expandedFaq}
                        setExpandedFaq={setExpandedFaq}
                    />
                );
            case 'funzone':
                return (
                    <FunzoneEditor
                        content={content.funzone}
                        addActivity={addActivity}
                        updateActivity={updateActivity}
                        removeActivity={removeActivity}
                    />
                );
            case 'helpdesk':
                return (
                    <HelpdeskEditor
                        content={content.helpdesk}
                        updateHelpdesk={updateHelpdesk}
                    />
                );
            default:
                return renderHtmlEditor();
        }
    };

    const renderHtmlEditor = () => (
        <>
            <Textarea
                rows={15}
                value={content[selectedPage] || ''}
                onChange={(e) => setContent({
                    ...content,
                    [selectedPage]: e.target.value
                })}
                placeholder="Enter HTML content for this page..."
                className="font-mono text-sm"
            />
            <div className="mt-4 p-3 rounded-lg bg-blue-50 text-sm text-blue-700">
                <p className="font-medium mb-1">HTML Supported:</p>
                <p>You can use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.</p>
            </div>
        </>
    );

    // Editors extracted to sub-components

    const renderAgendaEditor = () => (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h4 className="font-semibold text-dark-900 mb-4">Hero Section</h4>
                <Textarea
                    label="Hero Text"
                    value={content.agenda.heroText || ''}
                    onChange={(e) => updateAgendaHeroText(e.target.value)}
                    placeholder="Text displayed below 'Event Agenda'"
                    rows={2}
                />
            </div>

            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="font-medium text-gray-700">Agenda Management</p>
                    <p className="text-sm text-gray-500">Manage days and timeline events</p>
                </div>
                <button onClick={addAgendaDay} className="btn-secondary btn-sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Day
                </button>
            </div>
            {content.agenda.days.map((day, dayIdx) => (
                <div key={day.id} className="border rounded-lg p-6 bg-white mb-6">
                    <div className="flex justify-between items-start mb-4 border-b pb-4">
                        <div className="grid md:grid-cols-2 gap-4 flex-1 mr-4">
                            <Input label="Day Title" value={day.title} onChange={(e) => updateAgendaDay(day.id, 'title', e.target.value)} placeholder="Day 1" />
                            <Input label="Date" value={day.date} onChange={(e) => updateAgendaDay(day.id, 'date', e.target.value)} placeholder="January 15, 2026" />
                        </div>
                        <button onClick={() => removeAgendaDay(day.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-4">
                        {day.events.map((evt, evtIdx) => (
                            <div key={evt.id} className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-500">Event #{evtIdx + 1}</span>
                                    <button onClick={() => removeAgendaEvent(day.id, evt.id)} className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-3 mb-3">
                                    <Input label="Time" value={evt.time} onChange={(e) => updateAgendaEvent(day.id, evt.id, 'time', e.target.value)} placeholder="09:00 - 10:00" />
                                    <Input label="Title" value={evt.title} onChange={(e) => updateAgendaEvent(day.id, evt.id, 'title', e.target.value)} placeholder="Event Title" />
                                    <Input label="Location" value={evt.location} onChange={(e) => updateAgendaEvent(day.id, evt.id, 'location', e.target.value)} placeholder="Location" />
                                    <Input label="Dress Code" value={evt.dressCode} onChange={(e) => updateAgendaEvent(day.id, evt.id, 'dressCode', e.target.value)} placeholder="Casual" />
                                    <div className="md:col-span-2">
                                        <Input label="Description" value={evt.description} onChange={(e) => updateAgendaEvent(day.id, evt.id, 'description', e.target.value)} placeholder="Event details..." />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-2 block">Images (Max 4)</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {[0, 1, 2, 3].map(imgIdx => (
                                            <div key={imgIdx} className="relative aspect-square bg-gray-200 rounded overflow-hidden">
                                                {(evt.images && evt.images[imgIdx]) ? (
                                                    <>
                                                        <img src={evt.images[imgIdx]} className="w-full h-full object-cover" />
                                                        <button onClick={() => updateAgendaEventImage(day.id, evt.id, imgIdx, '')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><X className="w-3 h-3" /></button>
                                                    </>
                                                ) : (
                                                    <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-gray-300">
                                                        <Plus className="w-4 h-4 text-gray-500" />
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAgendaImageUpload(day.id, evt.id, imgIdx, e)} />
                                                    </label>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => addAgendaEvent(day.id)} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Add Event
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const handleImageUpload = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateVenueAccommodationImage(index, reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const renderVenueEditor = () => (
        <div className="space-y-8">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                    Configure venue and accommodation details.
                    <br />
                    <strong>Note:</strong> You can upload up to 4 images max. Images can be uploaded directly or provided as URLs.
                </p>
            </div>

            {/* Event Venue Section */}
            <div className="border-b pb-6">
                <h4 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    Event Venue
                </h4>
                <div className="grid gap-4">
                    <Input
                        label="Section Title"
                        value={content.venue.eventVenue.title}
                        onChange={(e) => updateVenueEventVenue('title', e.target.value)}
                        placeholder="Event Venue"
                    />
                    <Textarea
                        label="Address"
                        value={content.venue.eventVenue.address}
                        onChange={(e) => updateVenueEventVenue('address', e.target.value)}
                        placeholder="Enter venue address"
                        rows={2}
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input
                            label="Google Maps Link (optional)"
                            value={content.venue.eventVenue.googleMapsLink}
                            onChange={(e) => updateVenueEventVenue('googleMapsLink', e.target.value)}
                            placeholder="https://maps.google.com/..."
                        />
                        <Input
                            label="Apple Maps Link (optional)"
                            value={content.venue.eventVenue.appleMapsLink}
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
                        value={content.venue.accommodation.title}
                        onChange={(e) => updateVenueAccommodation('title', e.target.value)}
                        placeholder="Accommodation: Hotel Name"
                    />
                    <Textarea
                        label="Description"
                        value={content.venue.accommodation.description}
                        onChange={(e) => updateVenueAccommodation('description', e.target.value)}
                        placeholder="Describe the hotel..."
                        rows={3}
                    />
                    <Textarea
                        label="Details"
                        value={content.venue.accommodation.details}
                        onChange={(e) => updateVenueAccommodation('details', e.target.value)}
                        placeholder="Check-in details, what's included..."
                        rows={3}
                    />
                    <Textarea
                        label="Disclaimer"
                        value={content.venue.accommodation.disclaimer}
                        onChange={(e) => updateVenueAccommodation('disclaimer', e.target.value)}
                        placeholder="Any disclaimers about the accommodation..."
                        rows={2}
                    />
                    <Input
                        label="Hotel Website Link"
                        value={content.venue.accommodation.hotelLink}
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
                            {content.venue.accommodation.images.map((img, idx) => (
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
                            {content.venue.inclusions.map((item, idx) => (
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
                            {content.venue.exclusions.map((item, idx) => (
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
                                value={content.venue.exclusionDisclaimer}
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
                        value={content.venue.complimentaryFacilities.title}
                        onChange={(e) => updateVenueComplimentary('title', e.target.value)}
                        placeholder="e.g., Complimentary Breakfast"
                    />
                    <div>
                        <label className="form-label mb-2">Facility Details</label>
                        <div className="space-y-2">
                            {content.venue.complimentaryFacilities.items.map((item, idx) => (
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Content Editor</h1>
                    <p className="text-text-light">Edit dynamic content for public pages</p>
                </div>
                {lastUpdated && (
                    <div className="text-sm text-gray-500">
                        Last updated: {lastUpdated}
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Page Selector */}
                <div className="lg:col-span-1">
                    <div className="card">
                        <h3 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary-500" />
                            Pages
                        </h3>
                        <div className="space-y-1">
                            {pageOptions.map(page => (
                                <button
                                    key={page.id}
                                    onClick={() => { setSelectedPage(page.id); setShowPreview(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedPage === page.id
                                        ? 'bg-primary-100 text-primary-700 font-medium'
                                        : 'text-text-light hover:bg-gray-100'
                                        }`}
                                >
                                    {page.name}
                                    {page.type === 'structured' && (
                                        <span className="ml-2 text-xs text-gray-400">(Structured)</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <div className="lg:col-span-3">
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-dark-900">
                                    Editing: {currentPageConfig?.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    {isPublished ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <Globe className="w-3 h-3 mr-1" />
                                            Published
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Draft
                                        </span>
                                    )}
                                    {hasChanges && (
                                        <span className="text-xs text-amber-600">• Unsaved changes</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {currentPageConfig?.type === 'html' && (
                                    <button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className={`btn-secondary btn-sm ${showPreview ? 'bg-primary-100' : ''}`}
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        {showPreview ? 'Edit' : 'Preview'}
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || isLoading}
                                    className="btn-secondary btn-sm"
                                >
                                    {isSaving ? (
                                        <Loader className="w-4 h-4 mr-1 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-1" />
                                    )}
                                    {saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Draft'}
                                </button>
                                {isPublished ? (
                                    <button
                                        onClick={handleUnpublish}
                                        disabled={isUnpublishing}
                                        className="btn-secondary btn-sm text-amber-600 border-amber-300 hover:bg-amber-50"
                                    >
                                        {isUnpublishing ? (
                                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                                        ) : (
                                            <X className="w-4 h-4 mr-1" />
                                        )}
                                        Unpublish
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePublish}
                                        disabled={isPublishing}
                                        className="btn-primary btn-sm"
                                    >
                                        {isPublishing ? (
                                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                                        ) : (
                                            <Upload className="w-4 h-4 mr-1" />
                                        )}
                                        {isPublishing ? 'Publishing...' : 'Publish'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {currentPageConfig?.type === 'html' && showPreview ? (
                        <div className="border rounded-lg p-6 min-h-[400px] bg-gray-50">
                            <div
                                className="prose max-w-none"
                                dangerouslySetInnerHTML={createMarkup(content[selectedPage])}
                            />
                            {!content[selectedPage]?.trim() && (
                                <p className="text-text-muted italic">No content to preview</p>
                            )}
                        </div>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader className="w-8 h-8 animate-spin text-primary-500" />
                            <span className="ml-2 text-gray-500">Loading content...</span>
                        </div>
                    ) : (
                        renderEditor()
                    )}
                </div>
            </div>
        </div>
    );
}
