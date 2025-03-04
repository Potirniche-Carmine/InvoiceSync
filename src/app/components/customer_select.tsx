import { useState, useEffect } from 'react';
import { Customer } from '@/app/lib/types';

interface CustomerSelectProps {
  onSelect: (customer: Customer) => void;
  initialCustomer?: Customer | null;
  disabled?: boolean;
}

export default function CustomerSelect({ 
  onSelect, 
  initialCustomer = null,
  disabled = false 
}: CustomerSelectProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState(initialCustomer?.customer_name || '');
  const [, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/data/customers');
        const data = await response.json();
        setCustomers(data.customers);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Set initial customer name when provided
  useEffect(() => {
    if (initialCustomer) {
      setSearch(initialCustomer.customer_name);
    }
  }, [initialCustomer]);

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setSearch(customer.customer_name);
    setShowDropdown(false); 
  };

  return (
    <div className="relative">
      <input
        type="text"
        className={`w-full p-2 border rounded ${disabled ? 'bg-gray-100' : 'bg-white'}`}
        placeholder="Search customers..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowDropdown(!disabled);
        }}
        onFocus={() => setShowDropdown(!disabled)}
        disabled={disabled}
      />
      {showDropdown && search && !disabled && (
        <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <div
                key={customer.customer_id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(customer)}
              >
                <div className="font-medium">{customer.customer_name}</div>
                {customer.customer_address && (
                  <div className="text-sm text-gray-500 truncate">
                    {customer.customer_address}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500">No customers found</div>
          )}
        </div>
      )}
    </div>
  );
}