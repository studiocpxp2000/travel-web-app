import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetPublicFeedbackFormQuery, useSubmitFeedbackMutation } from '../../redux/slices/apiSlice';
import { MessageSquareText, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

// Custom Star Rating Component
const StarRating = ({ value, onChange, disabled }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex gap-1 sm:gap-4 justify-center py-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    className={
                        "p-1 focus:outline-none transition-transform transform hover:scale-110 " +
                        (disabled ? 'cursor-not-allowed opacity-70' : '')
                    }
                    onClick={() => onChange(star)}
                    onMouseEnter={() => !disabled && setHover(star)}
                    onMouseLeave={() => !disabled && setHover(0)}
                >
                    <svg
                        className={
                            "w-8 h-8 sm:w-10 sm:h-10 transition-colors " +
                            (star <= (hover || value) ? 'text-yellow-400 fill-current' : 'text-gray-200 fill-current')
                        }
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                </button>
            ))}
        </div>
    );
};

export default function Feedback() {
    const { orgSlug } = useParams();

    // Check if user is logged in natively so we can prefill info, though feedback can be anonymous
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (!user) {
        // Redirect to login if user is not logged in, pass the returnUrl
        window.location.href = `/${orgSlug}/login?returnUrl=/${orgSlug}/feedback`;
        return null; // Return null so the rest of the component holds rendering
    }

    const [formState, setFormState] = useState({
        answers: {} // { questionId: answer }
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);

    const {
        data: formRes,
        isLoading,
        error: fetchError
    } = useGetPublicFeedbackFormQuery(orgSlug);

    const [submitFeedback, { isLoading: isSubmitting }] = useSubmitFeedbackMutation();

    const formData = formRes?.data;
    const questions = formData?.questions || [];

    // Early return for loading
    if (isLoading) return <Loading />;

    // Handle form disabled/not found
    if (fetchError || !formData) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Unavailable</h2>
                    <p className="text-gray-500 mb-6">
                        {fetchError?.data?.message || 'This feedback form is currently closed or does not exist.'}
                    </p>
                    <Link to={"/" + orgSlug} className="inline-block px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                        Return to Home
                    </Link>
                </div>
            </div >
        );
    }

    const handleAnswerChange = (questionId, value) => {
        setFormState(prev => ({
            ...prev,
            answers: { ...prev.answers, [questionId]: value }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Required field validation (assuming all configured questions are mandatory)
        const unanwered = questions.find(q => !formState.answers[q.id]);
        if (unanwered) {
            return toast.error("Please answer all questions before submitting.");
        }

        try {
            // Format responses for backend
            const responses = questions.map(q => ({
                question_id: q.id,
                question_text: q.text,
                type: q.type,
                answer: formState.answers[q.id]
            }));

            await submitFeedback({
                orgSlug,
                data: {
                    name: user?.name || 'Anonymous',
                    email: user?.email || '',
                    user_id: user?._id || user?.id || null,
                    responses
                }
            }).unwrap();

            setIsSubmitted(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Optional confetti
            if (typeof window.confetti === 'function') {
                window.confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

        } catch (err) {
            // Check if error is 'already submitted'
            if (err?.status === 400 && err?.data?.message?.toLowerCase().includes('already submitted')) {
                setAlreadySubmitted(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                toast.error(err?.data?.message || "Failed to submit feedback. Please try again.");
            }
        }
    };

    if (alreadySubmitted) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
                <div className="bg-white rounded-2xl shadow border border-gray-100 p-8 text-center md:py-16">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquareText className="w-10 h-10 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Feedback Already Received</h2>
                    <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
                        You have already submitted your feedback for this event. Thank you for sharing your experience!
                    </p>
                    <Link
                        to={"/" + orgSlug}
                        className="inline-block px-8 py-3 text-white rounded-xl font-medium transition-opacity hover:opacity-90 shadow-md"
                        style={{ backgroundColor: formData?.buttonColor || '#111827' }}
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 text-center md:py-16 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600"></div>
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
                    <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
                        Your feedback has been successfully submitted. We appreciate you taking the time to help us improve.
                    </p>
                    <Link
                        to={"/" + orgSlug}
                        className="inline-block px-8 py-3 text-white rounded-xl font-medium transition-opacity hover:opacity-90 shadow-md"
                        style={{ backgroundColor: formData?.buttonColor || '#111827' }}
                    >
                        Return to Home
                    </Link>
                </div>
            </div >
        );
    }

    return (
        <div className="max-w-xl mx-auto py-10 px-4 sm:px-6 pb-28 relative">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {formData.orgName} Feedback
                </h1>
                <p className="text-gray-500 text-sm max-w-lg mx-auto">
                    We'd love to hear your thoughts! Please take a moment to share your experience with us.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {questions.map((q, index) => (
                    <div key={q.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex gap-3 sm:gap-4">
                            {/* Number Indicator */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shadow-sm">
                                {index + 1}
                            </div>

                            {/* Question Content */}
                            <div className="flex-1 w-full pt-1.5 sm:pt-0.5 overflow-hidden">
                                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 pr-1">
                                    {q.text} <span className="text-red-500">*</span>
                                </h3>

                                <div className="mt-2 text-center w-full block">
                                    {q.type === 'text' && (
                                        <textarea
                                            required
                                            rows="3"
                                            value={formState.answers[q.id] || ''}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-y min-h-[100px] bg-gray-50 text-base"
                                            placeholder="Write your answer here..."
                                        ></textarea>
                                    )}

                                    {q.type === 'rating' && (
                                        <StarRating
                                            value={formState.answers[q.id] || 0}
                                            onChange={(val) => handleAnswerChange(q.id, val)}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <div className="pt-6 pb-12 flex justify-center">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full max-w-sm flex items-center justify-center gap-2 px-8 py-4 text-white rounded-xl font-semibold text-lg transition-opacity hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform active:scale-95"
                        style={{ backgroundColor: formData?.buttonColor || '#111827' }}
                    >
                        {isSubmitting ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                Submit Feedback
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
