import ProfileDropdown from '../user-profile/ProfileDropdown';

const AppSidebar = () => {
  return (
    <div className="h-screen px-2 py-4 border-r flex flex-col justify-between">
      <div></div>
      <div>
        <ProfileDropdown />
      </div>
    </div>
  );
};

export default AppSidebar;
