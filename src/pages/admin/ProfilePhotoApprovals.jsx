import { useEffect, useState } from 'react';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { adminAPI } from '../../services/api';
import { toAbsoluteMediaUrl } from '../../utils/media';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ProfilePhotoApprovals = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const { data } = await adminAPI.getProfilePhotoApprovals();
            setUsers(data.users || []);
        } catch {
            toast.error('Failed to load photo approvals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const approve = async (id) => {
        try {
            await adminAPI.approveProfilePhoto(id);
            toast.success('Photo approved');
            fetchQueue();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Approve failed');
        }
    };

    const reject = async (id) => {
        const reason = prompt('Reason for rejection?') || 'Rejected by admin';
        try {
            await adminAPI.rejectProfilePhoto(id, reason);
            toast.success('Photo rejected');
            fetchQueue();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reject failed');
        }
    };

    if (loading) {
        return (
            <div className="p-16 flex justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Profile Photo Approvals
            </h1>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {users.length === 0 ? (
                    <div className="p-16 text-center text-gray-500">
                        No pending profile photos
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <div key={user._id} className="p-5 flex items-center justify-between gap-5">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={toAbsoluteMediaUrl(user.profilePhotoApproval?.pendingUrl)}
                                        alt={user.name}
                                        className="w-20 h-20 rounded-2xl object-cover border"
                                    />
                                    <div>
                                        <h3 className="font-bold text-gray-900">{user.name}</h3>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                        <p className="text-xs text-gray-400 capitalize">
                                            {(user.roles || []).join(', ')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => approve(user._id)}
                                        className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                                    >
                                        <HiCheckCircle /> Approve
                                    </button>
                                    <button
                                        onClick={() => reject(user._id)}
                                        className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100"
                                    >
                                        <HiXCircle /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePhotoApprovals;