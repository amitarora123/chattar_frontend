import { ApiResponse } from "@/types/api.types";
import { apiClient } from "../apiClient/apiClient";
import { Contact } from "@/types/contacts.types";

export const getMyContacts = async (): Promise<Contact[]> => {
  const res = await apiClient.get("/contacts/me");

  return res.data;
};

export const createContacts = async (data: {
  name: string;
  username: string;
}): Promise<ApiResponse> => {
  const res = await apiClient.post("/contacts", data, {});

  return res.data;
};
