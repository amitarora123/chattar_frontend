'use client';
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

const ProfileDropdown = ({
  className = '',
  size = 40,
}: {
  className?: string;
  size?: number;
}) => {
  const { data } = useSession();

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer" asChild>
          {data?.user.avatar_url ? (
            <Image
              className="rounded-full"
              src={data.user.avatar_url}
              width={size}
              height={size}
              alt={data.user.username}
            />
          ) : (
            <Button variant="outline">
              <User />
            </Button>
          )}
        </DropdownMenuTrigger>
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
