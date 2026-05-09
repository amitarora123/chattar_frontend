"use client";
import { getUserDetails } from "@/lib/api/user.api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import ProfilePictureUploader from "./ProfilePictureUploader";
import CustomFormField from "../form/CustomFormField";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const profileSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters"),
  display_name: z.string().optional(),
  email: z.string().optional(),
  avatar_url: z.string().optional(),
  is_active: z.boolean(),
});

type ProfileSchema = z.infer<typeof profileSchema>;

const ProfileForm = () => {
  const { data } = useSession();
  const [file, setFile] = useState<File | null>(null);

  const { data: userDetails, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => getUserDetails(data!.user.id),
    enabled: !!data?.user.id,
  });

  const {} = useMutation({
    mutationKey: ["profile", "save"],
    mutationFn: 
  });

  const preview = useMemo(() => {
    if (!file) {
      return userDetails?.avatar_url;
    }
    return URL.createObjectURL(file);
  }, [file, userDetails]);

  const profileForm = useForm<ProfileSchema>({
    defaultValues: {
      email: "",
      username: "",
      display_name: "",
      avatar_url: "",
      is_active: true,
    },
    resolver: zodResolver(profileSchema),
  });

  const handleSaveProfile = async (data: ProfileSchema) => {};

  useEffect(() => {
    if (userDetails) {
      profileForm.reset(userDetails);
    }
  }, [userDetails, profileForm]);

  return (
    <div>
      <ProfilePictureUploader preview={preview} setFile={setFile} />
      <form
        id="form-signIn"
        className="flex flex-col gap-5"
        onSubmit={profileForm.handleSubmit(handleSaveProfile)}
      >
        <div>
          <CustomFormField
            control={profileForm.control}
            label={
              <p className="w-full flex items-center justify-between">
                <span>Username</span>
                {isEnabled &&
                  (usernameLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : isUsernameUnique ? (
                    <span className="text-green-400 flex justify-center items-center gap-2">
                      Username is available <Check />
                    </span>
                  ) : (
                    <span className="text-red-400 flex justify-center items-center gap-2">
                      Username is not available <X />
                    </span>
                  ))}
              </p>
            }
            type="text"
            name="username"
            placeholder="Enter your username"
          />
        </div>

        <CustomFormField
          control={profileForm.control}
          label="Email"
          type="email"
          name="email"
          placeholder="Enter your email"
        />

        <CustomFormField
          control={profileForm.control}
          label="Password"
          type="password"
          name="password"
          placeholder="Enter your password"
        />

        <CustomFormField
          control={profileForm.control}
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          placeholder="Confirm your password"
        />

        <Button
          type="submit"
          disabled={isPending}
          className="bg-authBtn text-white cursor-pointer hover:bg-authBtn hover:opacity-85"
        >
          {isPending ? "Signing up..." : "Sign Up"}
        </Button>
      </form>
    </div>
  );
};

export default ProfileForm;
