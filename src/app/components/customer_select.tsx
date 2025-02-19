import { useState, useEffect } from 'react';

export interface Customer {
    customer_id: number;
    customer_name: string;
    customer_address: string | null;
  }

interface CustomerSelectProps {
    onSelect: (customer: Customer) => void;
    }

export default function CustomerSelect({ onSelect }: CustomerSelectProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
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
        className="w-full p-2 border rounded"
        placeholder="Search customers..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowDropdown(true); 
        }}
        onFocus={() => setShowDropdown(true)} 
      />
      {showDropdown && search && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-auto">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.customer_id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(customer)}
            >
              {customer.customer_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}