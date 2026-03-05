import ProfileDropdown from '../user-profile/ProfileDropdown';

const MobileBottomNav = () => {
  return (
    <div className="w-screen z-30  lg:hidden items-center bg-authBg p-4 border-r flex  justify-between">
      <div></div>
      <div className="flex flex-col items-center">
        <ProfileDropdown size={30} />
      </div>
    </div>
  );
};

export default MobileBottomNav;
