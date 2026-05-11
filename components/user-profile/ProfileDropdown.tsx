"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/api/auth.api";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useMutation } from "@tanstack/react-query";
import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ProfileDropdown = ({ className = "", size = 40 }: { className?: string; size?: number }) => {
  const router = useRouter();

  const { user } = useAuth();

  const logoutMutation = useMutation({
    mutationKey: ["logout"],
    mutationFn: logout,
    onSuccess: () => {
      router.replace("/auth/sign-in");
    },
  });
  const handleLogout = async () => {
    logoutMutation.mutate();
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer" asChild>
          {user?.avatar_url ? (
            <Image
              className="rounded-full"
              src={user.avatar_url}
              width={size}
              height={size}
              alt={user.username}
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
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProfileDropdown;
