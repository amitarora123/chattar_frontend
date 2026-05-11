"use client";
import { getMe, updateMe } from "@/lib/api/user.api";
import { uploadImage } from "@/lib/api/cloudinary.api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ProfilePictureUploader from "./ProfilePictureUploader";
import CustomFormField from "../form/CustomFormField";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { showErrorMessage, showSuccessMessage } from "@/lib/utils";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

const profileSchema = z.object({
  display_name: z.string(),
  is_active: z.enum(["ACTIVE", "INACTIVE"]),
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
    onSuccess: (data) => {
      const { message } = data as { message: string };
      showSuccessMessage(message || "Profile Updated");
    },
  });

  const preview = useMemo(() => {
    if (!file) {
      return userDetails?.avatar_url;
    }
    return URL.createObjectURL(file);
  }, [file, userDetails]);

  const profileForm = useForm<ProfileSchema>({
    values: {
      display_name: userDetails?.display_name ?? "",
      is_active: userDetails?.is_active ? "ACTIVE" : "INACTIVE",
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
      is_active: data.is_active === "ACTIVE",
    });
  };

  if (isLoading) return null;

  return (
    <div className="px-10 flex border-r border-border items-center flex-col py-5 w-100">
      <ProfilePictureUploader preview={preview} setFile={setFile} />
      <form
        id="form-signIn"
        className="flex flex-col gap-5 w-full"
        onSubmit={profileForm.handleSubmit(handleSaveProfile)}
      >
        <Field>
          <FieldLabel>Username</FieldLabel>
          <Input type="text" disabled value={userDetails?.username} />
        </Field>

        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" disabled value={userDetails?.email} />
        </Field>

        <CustomFormField
          control={profileForm.control}
          label="Name"
          type="text"
          name="display_name"
          placeholder="Enter your name"
        />

        <CustomFormField
          control={profileForm.control}
          label="ACCOUNT STATUS"
          name="is_active"
          type="select"
          options={[
            {
              label: "Active",
              value: "ACTIVE",
            },
            {
              label: "Inactive",
              value: "INACTIVE",
            },
          ]}
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
