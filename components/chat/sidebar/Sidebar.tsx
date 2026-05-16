import { SidebarType } from "@/lib/store/sidebarStore";
import ChatList from "./ChatList";
import DialPad from "./DialPad";
import GroupChat from "./GroupChat";
import clsx from "clsx";

interface SidebarProps {
  type: SidebarType;
  className: string;
}

const Sidebar = ({ className, type }: SidebarProps) => {
  const SIDEBAR_COMPONENTS: Record<SidebarType, React.ComponentType> = {
    ChatList,
    DialPad,
    GroupChat,
  };

  const ActiveComponent = SIDEBAR_COMPONENTS[type];

  return (
    <section
      className={clsx(
        "border-r flex flex-col transition-transform bg-background duration-300 ease-in-out lg:col-span-1 min-h-0 h-screen",
        className
      )}
    >
      <ActiveComponent />
    </section>
  );
};

export default Sidebar;
