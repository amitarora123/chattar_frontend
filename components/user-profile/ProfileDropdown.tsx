import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

const ProfileDropdown = () => {
  const { data } = useSession();

  return (
    <div className="mr-5">
      <DropdownMenu>
        <div className='flex items-center justify-center gap-3'>
          {data?.user.username}
          <DropdownMenuTrigger asChild>
            {data?.user.avatar_url ? (
              <Image
                className="rounded-full border-4 border-gray-500"
                src={data.user.avatar_url}
                width={40}
                height={40}
                alt={data.user.username}
              />
            ) : (
              <Button variant="outline">
                <User />
              </Button>
            )}
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent className="w-40" align="start">
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem>
              <Link href="/profile">My Profile</Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => signOut()}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProfileDropdown;
