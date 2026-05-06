import { HiOutlineUserGroup, HiOutlineBriefcase, HiOutlineLocationMarker, HiOutlineGlobeAlt } from 'react-icons/hi';

const PlatformSummary = ({ totalUsers = 0, totalProviders = 0, totalRecruiters = 0 }) => {
  return (
    <div className="bg-white rounded-3xl border border-[#EAE7F2] p-6 shadow-sm">
      <h3 className="font-extrabold text-gray-900 text-sm mb-4">Platform Summary</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#F8F7FB] p-4 rounded-2xl flex flex-col justify-between">
          <HiOutlineUserGroup className="w-4 h-4 text-gray-500 mb-3" />
          <div>
            <h4 className="font-extrabold text-gray-900 text-lg">{totalUsers.toLocaleString('en-IN')}</h4>
            <p className="text-[10px] text-gray-500">Users</p>
          </div>
        </div>

        <div className="bg-[#F8F7FB] p-4 rounded-2xl flex flex-col justify-between">
          <HiOutlineBriefcase className="w-4 h-4 text-gray-500 mb-3" />
          <div>
            <h4 className="font-extrabold text-gray-900 text-lg">{totalProviders.toLocaleString('en-IN')}</h4>
            <p className="text-[10px] text-gray-500">Candidates</p>
          </div>
        </div>

        <div className="bg-[#F8F7FB] p-4 rounded-2xl flex flex-col justify-between">
          <HiOutlineLocationMarker className="w-4 h-4 text-gray-500 mb-3" />
          <div>
            <h4 className="font-extrabold text-gray-900 text-lg">412</h4>
            <p className="text-[10px] text-gray-500">Cities</p>
          </div>
        </div>

        <div className="bg-[#F8F7FB] p-4 rounded-2xl flex flex-col justify-between">
          <HiOutlineGlobeAlt className="w-4 h-4 text-gray-500 mb-3" />
          <div>
            <h4 className="font-extrabold text-gray-900 text-lg">28</h4>
            <p className="text-[10px] text-gray-500">Countries</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformSummary;
