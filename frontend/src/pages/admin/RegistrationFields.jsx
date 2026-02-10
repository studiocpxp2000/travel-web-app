import { useState, useEffect, useContext } from 'react';
import { Save, ToggleLeft, ToggleRight, Info, Loader } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks';
import OrgContext from '../../context/OrgContext';
import { useGetRegistrationFieldsQuery, useUpdateRegistrationFieldsMutation } from '../../redux/slices/apiSlice';

import { USER_FIELDS } from '../../utils/constants';
import StatusModal from '../../components/common/StatusModal';

export default function RegistrationFields() {
    const { organization: authOrg, user } = useAuth();
    const orgContext = useContext(OrgContext);
    const organization = orgContext?.currentOrg || authOrg;

    // Fetch registration fields from API - don't skip if user is authenticated
    // API uses req.user.org_id from the token, or query param for Super Admin
    const { data: fieldsData, isLoading, error, refetch } = useGetRegistrationFieldsQuery(
        organization?._id ? { org_id: organization._id } : undefined,
        {
            refetchOnMountOrArgChange: true
        }
    );

    // Mutation for updating fields
    const [updateRegistrationFields, { isLoading: isSaving }] = useUpdateRegistrationFieldsMutation();

    const [enabledFields, setEnabledFields] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [initialFields, setInitialFields] = useState([]);

    // Status modal state
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    // Load data from API when it arrives
    useEffect(() => {
        if (fieldsData?.data?.registration_fields) {
            const fields = fieldsData.data.registration_fields;
            setEnabledFields(fields);
            setInitialFields(fields);
            setHasChanges(false);
        }
    }, [fieldsData]);

    // Debug logging
    useEffect(() => {
        console.log('Registration Fields Debug:', {
            fieldsData,
            organization,
            user,
            isLoading,
            error,
            enabledFields
        });
    }, [fieldsData, organization, user, isLoading, error, enabledFields]);

    const toggleField = (fieldKey) => {
        // 'name' is always required and cannot be disabled
        if (fieldKey === 'name') return;

        setEnabledFields(prev => {
            const newFields = prev.includes(fieldKey)
                ? prev.filter(f => f !== fieldKey)
                : [...prev, fieldKey];

            // Check if there are changes compared to initial - create copies before sorting
            const hasChanged = JSON.stringify([...newFields].sort()) !== JSON.stringify([...initialFields].sort());
            setHasChanges(hasChanged);

            return newFields;
        });
    };

    const handleSave = async () => {
        try {
            await updateRegistrationFields({
                registration_fields: enabledFields,
                // Pass org_id for Super Admin context
                ...(organization?._id && { org_id: organization._id })
            }).unwrap();
            setInitialFields(enabledFields);
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Saved!',
                message: 'Registration fields have been updated successfully.'
            });
            setHasChanges(false);
        } catch (err) {
            console.error('Save error:', err);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Error!',
                message: err?.data?.message || 'Failed to save registration fields.'
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary-500" />
                <span className="ml-2 text-gray-500">Loading registration fields...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-red-500 mb-4">Failed to load registration fields: {error?.data?.message || 'Unknown error'}</p>
                <button onClick={() => refetch()} className="btn-primary">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Registration Fields</h1>
                    <p className="text-text-light">Configure which fields are collected during user registration</p>
                    {fieldsData?.data?.org_name && (
                        <p className="text-sm text-primary-500 mt-1">Organization: {fieldsData.data.org_name}</p>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className={`btn-primary ${(!hasChanges || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isSaving ? (
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5 mr-2" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Some fields are always collected (Name) or automatically generated by the system (OTP, QR Code, Arrival Status, Sessions).
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                        Toggle fields on/off to customize what information is requested from users during registration.
                    </p>
                </div>
            </div>

            {/* Configurable Fields */}
            <div className="card">
                <h2 className="text-lg font-semibold text-dark-900 mb-4">User Profile Fields</h2>
                <div className="space-y-3">
                    {USER_FIELDS.configurable.map(field => {
                        const isEnabled = enabledFields.includes(field.key);
                        const isRequired = field.key === 'name'; // Name is always required

                        return (
                            <div
                                key={field.key}
                                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div>
                                        <p className="font-medium text-dark-900 flex items-center gap-2">
                                            {field.label}
                                            {isRequired && (
                                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Required</span>
                                            )}
                                        </p>
                                        <p className="text-sm text-text-light">
                                            Type: {field.type}
                                            {field.options && ` (${field.options.join(', ')})`}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleField(field.key)}
                                    disabled={isRequired}
                                    className={`p-1 rounded transition-colors ${isRequired ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/50'
                                        }`}
                                >
                                    {isEnabled ? (
                                        <ToggleRight className="w-10 h-10 text-green-500" />
                                    ) : (
                                        <ToggleLeft className="w-10 h-10 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* System Fields (Read-only) */}
            <div className="card">
                <h2 className="text-lg font-semibold text-dark-900 mb-4">System Fields (Auto-Generated)</h2>
                <p className="text-sm text-text-light mb-4">
                    These fields are automatically managed by the system and cannot be disabled.
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {USER_FIELDS.system.map(field => (
                        <div
                            key={field.key}
                            className="p-3 rounded-lg bg-gray-100 border border-gray-200"
                        >
                            <p className="font-medium text-gray-600">{field.label}</p>
                            <p className="text-xs text-gray-500">Type: {field.type}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Modal */}
            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />
        </div>
    );
}
