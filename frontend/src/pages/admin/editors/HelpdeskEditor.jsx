import React, { memo } from 'react';
import { Phone, Mail } from 'lucide-react';
import Input from '../../../components/forms/Input';

const HelpdeskEditor = memo(({ content, updateHelpdesk }) => {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                    Set up contact information for your helpdesk page. Users will see these details to reach support.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="form-label flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-600" />
                        Phone Number
                    </label>
                    <Input
                        value={content.phone}
                        onChange={(e) => updateHelpdesk('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                    />
                </div>

                <div>
                    <label className="form-label flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        Email Address
                    </label>
                    <Input
                        type="email"
                        value={content.email}
                        onChange={(e) => updateHelpdesk('email', e.target.value)}
                        placeholder="support@example.com"
                    />
                </div>
            </div>

            {/* Preview Card */}
            <div className="mt-8">
                <p className="form-label mb-3">Preview</p>
                <div className="border rounded-lg p-6 bg-gray-50">
                    <h3 className="font-semibold text-lg mb-4">Contact Support</h3>
                    <div className="space-y-3">
                        {content.phone && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <Phone className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium">{content.phone}</p>
                                </div>
                            </div>
                        )}
                        {content.email && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium">{content.email}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default HelpdeskEditor;
