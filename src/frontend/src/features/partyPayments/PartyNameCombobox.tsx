import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { PartyMaster } from './types';

interface PartyNameComboboxProps {
  value: string;
  onChange: (value: string) => void;
  partyMasters: PartyMaster[];
  onSelectParty: (party: PartyMaster | null) => void;
  className?: string;
  error?: boolean;
}

export function PartyNameCombobox({
  value,
  onChange,
  partyMasters,
  onSelectParty,
  className,
  error,
}: PartyNameComboboxProps) {
  const [open, setOpen] = useState(false);

  const sortedParties = useMemo(() => {
    return [...partyMasters].sort((a, b) => 
      a.partyName.localeCompare(b.partyName)
    );
  }, [partyMasters]);

  const handleSelect = (selectedName: string) => {
    const party = partyMasters.find(p => p.partyName === selectedName);
    onChange(selectedName);
    onSelectParty(party || null);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    // Check if the typed value matches any party
    const party = partyMasters.find(
      p => p.partyName.toLowerCase() === newValue.toLowerCase()
    );
    if (party) {
      onSelectParty(party);
    } else {
      onSelectParty(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            error && 'border-destructive',
            className
          )}
        >
          {value || 'Select or type party name...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search or type party name..." 
            value={value}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>
              {value ? `Use "${value}" as new party` : 'No parties found'}
            </CommandEmpty>
            {sortedParties.length > 0 && (
              <CommandGroup heading="Imported Parties">
                {sortedParties.map((party) => (
                  <CommandItem
                    key={party.partyName}
                    value={party.partyName}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === party.partyName ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{party.partyName}</span>
                      {party.phoneNumber && (
                        <span className="text-xs text-muted-foreground">
                          {party.phoneNumber}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
