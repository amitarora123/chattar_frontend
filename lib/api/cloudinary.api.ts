import {
  GetSignedUrlProps,
  GetSignedUrlResponse,
  UploadImageResponse,
} from "@/types/cloudinary.types";
import { apiClient } from "../apiClient/apiClient";

export const getSignedUrl = async (data: GetSignedUrlProps): Promise<GetSignedUrlResponse> => {
  const res = await apiClient.post("/cloudinary/sign", data);
  return res.data;
};

export const uploadImage = async (file: File): Promise<UploadImageResponse> => {
  const { signature, timestamp, cloud_name, api_key } = await getSignedUrl({ folder: "avatars" });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", api_key);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", "avatars");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Image upload failed");

  return res.json();
};
