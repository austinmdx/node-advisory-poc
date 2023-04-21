import React, { useEffect, useState } from 'react'
import { Input } from '@chakra-ui/react'
import { useDebounce } from '@/utils/useDebounce';

export default function Search({ onChange, onSubmit }: { onChange?: (value: string) => void, onSubmit?: (value: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  

  useEffect(() => {
    if (onChange) {
      onChange(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, onChange]);

  function _onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(debouncedSearchQuery);
    }
  }

  return (
    <form onSubmit={(e) => { _onSubmit(e) }}>
      <Input 
      placeholder="Search" 
      _placeholder={{ color: ['whhite', 'white', 'primary.500'] }} 
      width="auto" 
      onChange={(e) => setSearchQuery(e.target.value)}
      />
    </form>
  )
}
