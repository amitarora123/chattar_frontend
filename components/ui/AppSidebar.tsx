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

      <div className="w-screen z-30 fixed lg:hidden bottom-0 items-center bg-authBg p-4 border-r flex  justify-between">
        <div></div>
        <div className="flex flex-col items-center">
          <ProfileDropdown size={30} />
        </div>
      </div>
    </>
  );
};

export default AppSidebar;
