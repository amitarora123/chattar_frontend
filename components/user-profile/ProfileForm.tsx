"use client";
import { getMe, updateMe } from "@/lib/api/user.api";
import { uploadImage } from "@/lib/api/cloudinary.api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import ProfilePictureUploader from "./ProfilePictureUploader";
import CustomFormField from "../form/CustomFormField";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { showErrorMessage } from "@/lib/utils";

const profileSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters"),
  display_name: z.string().optional(),
  email: z.string().optional(),
});

type ProfileSchema = z.infer<typeof profileSchema>;

const ProfileForm = () => {
  const [file, setFile] = useState<File | null>(null);

  const { data: userDetails, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getMe,
  });

  const uploadImageMutation = useMutation({
    mutationFn: uploadImage,
    onError: (error) => {
      showErrorMessage(error);
    },
  });

  const saveUserMutation = useMutation({
    mutationKey: ["profile-save"],
    mutationFn: updateMe,
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
    },
    resolver: zodResolver(profileSchema),
  });

  const handleSaveProfile = async (data: ProfileSchema) => {
    console.log(data);
    let avatarUrl = userDetails?.avatar_url;

    if (file) {
      const { secure_url } = await uploadImageMutation.mutateAsync(file);
      avatarUrl = secure_url;
    }

    saveUserMutation.mutate({
      name: data.display_name,
      avatar_url: avatarUrl,
      is_active: true,
    });
  };

  useEffect(() => {
    if (userDetails) {
      profileForm.reset(userDetails);
    }
  }, [userDetails, profileForm]);

  if (isLoading) return null;

  return (
    <div className="px-10 flex border-r border-border items-center flex-col py-5 w-100">
      <ProfilePictureUploader preview={preview} setFile={setFile} />
      <form
        id="form-signIn"
        className="flex flex-col gap-5 w-full"
        onSubmit={profileForm.handleSubmit(handleSaveProfile)}
      >
        <div>
          <CustomFormField
            control={profileForm.control}
            label="Username"
            type="text"
            name="username"
            placeholder="Enter your username"
            disabled
          />
        </div>

        <CustomFormField
          control={profileForm.control}
          label="Email"
          type="email"
          name="email"
          placeholder="Enter your email"
          disabled
        />
        <CustomFormField
          control={profileForm.control}
          label="Name"
          type="text"
          name="display_name"
          placeholder="Enter your name"
        />

        <Button
          type="submit"
          disabled={uploadImageMutation.isPending || saveUserMutation.isPending}
          className="bg-authBtn text-white disabled:opacity-60 cursor-pointer hover:bg-authBtn hover:opacity-85"
        >
          {uploadImageMutation.isPending
            ? "Uploading..."
            : saveUserMutation.isPending
              ? "Saving..."
              : "Save"}
        </Button>
      </form>
    </div>
  );
};

export default ProfileForm;
