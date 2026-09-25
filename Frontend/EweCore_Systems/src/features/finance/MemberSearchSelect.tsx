import { useEffect, useState } from 'react';
import { Select, Spin } from 'antd';
import { memberApi, type MemberLookup } from '../../services/api/members';

const SEARCH_DEBOUNCE_MS = 300;

interface MemberSearchSelectProps {
  value?: string;
  onChange?: (value: string, member?: MemberLookup) => void;
  placeholder?: string;
  /** Members to always offer (e.g. one just added), even if not in the current search results. */
  knownMembers?: MemberLookup[];
}

/** Searches SACCO members by number or name on the server as the user types. */
export const MemberSearchSelect = ({
  value,
  onChange,
  placeholder = 'Search by member number or name',
  knownMembers = [],
}: MemberSearchSelectProps) => {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<MemberLookup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await memberApi.lookup(search);
        if (!cancelled) setOptions(results);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const allMembers = [...knownMembers, ...options.filter((m) => !knownMembers.some((k) => k.id === m.id))];

  return (
    <Select
      showSearch
      value={value}
      placeholder={placeholder}
      filterOption={false}
      onSearch={setSearch}
      onChange={(id: string) => onChange?.(id, allMembers.find((m) => m.id === id))}
      notFoundContent={loading ? <Spin size="small" /> : 'No members found'}
      options={allMembers.map((member) => ({
        value: member.id,
        label: `${member.member_number} — ${member.full_name}${member.account_status !== 'active' ? ` (${member.account_status})` : ''}`,
      }))}
    />
  );
};
