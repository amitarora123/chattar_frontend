import {
  GetSignedUrlProps,
  GetSignedUrlResponse,
  UploadImageResponse,
} from "@/types/cloudinary.types";
import { apiClient } from "../apiClient/apiClient";

export const getSignedUploadUrl = async (
  data: GetSignedUrlProps
): Promise<GetSignedUrlResponse> => {
  const res = await apiClient.post(`/cloudinary/sign/${data.attachmentType}`, data);
  return res.data;
};

export const uploadAttachment = async ({
  file,
  attachmentType,
}: {
  file: File;
  attachmentType: "image" | "doc";
}): Promise<UploadImageResponse> => {
  const { signature, timestamp, cloud_name, api_key, upload_preset } = await getSignedUploadUrl({
    folder: "avatars",
    attachmentType,
  });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", api_key);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("upload_preset", upload_preset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/${attachmentType === "image" ? "image" : "raw"}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error?.message || "Image upload failed");
  }

  return res.json();
};
