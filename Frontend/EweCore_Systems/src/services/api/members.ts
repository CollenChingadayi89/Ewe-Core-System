/**
 * SACCO Members API Service
 */

import { get, post } from './client';

/** Minimal member data for pickers (no IDs, balances or other sensitive fields). */
export interface MemberLookup {
  id: string;
  member_number: string;
  full_name: string;
  phone: string;
  account_status: 'active' | 'inactive' | 'suspended' | 'closed';
}

/** Fields needed to register a member; member number and join date are assigned by the server. */
export interface MemberCreateRequest {
  first_name: string;
  last_name: string;
  national_id: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone: string;
  email: string;
  address: string;
}

interface MemberCreateResponse extends MemberCreateRequest {
  id: string;
  member_number: string;
  middle_name: string | null;
  account_status: MemberLookup['account_status'];
}

export const memberApi = {
  /**
   * Search members by member number or name (max 20 results)
   */
  lookup: async (search: string): Promise<MemberLookup[]> => {
    const response = await get<MemberLookup[]>('/members/lookup/', { params: { search } });
    return response.data;
  },

  /**
   * Register a new member (member number is generated) and return it in lookup form
   */
  create: async (data: MemberCreateRequest): Promise<MemberLookup> => {
    const response = await post<MemberCreateResponse>('/members/', data);
    const member = response.data;
    return {
      id: member.id,
      member_number: member.member_number,
      full_name: [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' '),
      phone: member.phone,
      account_status: member.account_status,
    };
  },
};
