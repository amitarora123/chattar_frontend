import { SidebarType } from '@/lib/store/sidebarStore';
import AllChats from './AllChats';
import NewChat from './NewChat';
import NewContact from './NewContact';
import AddGroupMembers from './AddGroupMembers';
import NewGroup from './NewGroup';
import DialPad from './DialPad';
import clsx from 'clsx';

interface SidebarProps {
  type: SidebarType;
  className: string;
}

const Sidebar = ({ className, type }: SidebarProps) => {
  const SIDEBAR_COMPONENTS: Record<SidebarType, React.ComponentType> = {
    AllChats,
    NewChat,
    NewContact,
    AddGroupMembers,
    DialPad,
    NewGroup,
  };

  const ActiveComponent = SIDEBAR_COMPONENTS[type];

  return (
    <section
      className={clsx(
        'border-r transition-transform bg-background duration-300 ease-in-out pt-3 px-3 lg:col-span-1 max-lg:h-screen',
        className,
      )}
    >
      <ActiveComponent />
    </section>
  );
};

export default Sidebar;
