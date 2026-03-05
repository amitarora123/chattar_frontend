'use client';
import ProfileDropdown from '../user-profile/ProfileDropdown';

const AppSidebar = () => {
  return (
    <>
      <div className="h-screen  items-center bg-authBg p-4 border-r lg:flex hidden flex-col justify-between">
        <div></div>
        <div className="flex flex-col items-center">
          <ProfileDropdown size={30} />
        </div>
      </div>
    </>
  );
};

export default AppSidebar;
