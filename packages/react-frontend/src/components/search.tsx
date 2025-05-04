import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Endpoints, useSmatterQuery } from "../api/api";

export const Search = () => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const navigate = useNavigate();

  const { data: users } = useSmatterQuery(Endpoints.users.search(searchTerm), {
    enabled: searchTerm.length > 1,
    refetchOnWindowFocus: false,
  });

  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    if (!searchTerm) return users;

    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleSelect = (currentValue: string) => {
    if (currentValue === value) {
      // Reset everything
      setValue("");
      setSearchTerm("");
    } else {
      setValue(currentValue);
      navigate(`/profile/${currentValue}`);
    }
    setOpen(false);
  };

  // Reset search when popover closes
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setSearchTerm("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {(value && users?.find((user) => user.id === value)?.username) ||
            "Search users..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search users"
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {searchTerm.length > 1 && filteredUsers.length === 0 ? (
              <CommandEmpty>No matching results</CommandEmpty>
            ) : (
              <>
                <CommandEmpty className="hidden">No users found.</CommandEmpty>
                {searchTerm.length > 1 && (
                  <CommandGroup heading="Search Results">
                    {filteredUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={handleSelect}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col">
                            <span className="font-medium">{user.username}</span>
                            <span className="text-sm text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                          {value === user.id && (
                            <Check className="ml-2 h-4 w-4 opacity-100" />
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
