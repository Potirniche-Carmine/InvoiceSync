import { useState, useEffect } from "react";
import { Switch } from "./ui/switch";
import { Label } from "@/app/components/ui/label";
import { Service } from "@/app/lib/types";

interface ServiceSelectProps {
  onSelect: (service: Service) => void;
  initialService?: Service;
}

export default function ServiceSelect({ onSelect }: ServiceSelectProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editedService, setEditedService] = useState<Service | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/data/services');
        const data = await response.json();
        setServices(data.services);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleSelect = (service: Service) => {
    setSelectedService(service);
    setEditedService(service);
    setSearch(service.servicename);
    setShowDropdown(false);
    onSelect(service);
  };

  const handleCreateNewService = async () => {
    try {
      const response = await fetch('/api/data/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          servicename: search,
          description: '',
          unitprice: 0,
          istaxed: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create service');
      }

      const { service: newService } = await response.json();
      const formattedService = {
        ...newService,
        istaxed: Boolean(newService.istaxed)
      };

      setServices(prev => [...prev, formattedService]);
      setSelectedService(formattedService);
      setEditedService(formattedService);
      setShowDropdown(false);
      onSelect(formattedService);
    } catch (error) {
      console.error('Error creating new service:', error);
    }
  };

  const handleUpdateService = async (serviceToUpdate = editedService) => {
    if (!serviceToUpdate || !selectedService?.service_id) return;
  
    try {
      const response = await fetch('/api/data/services', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: selectedService.service_id,
          description: serviceToUpdate.description,
          unitprice: serviceToUpdate.unitprice,
          istaxed: Boolean(serviceToUpdate.istaxed)
        }),
      });
  
      if (response.ok) {
        const { service: updatedService } = await response.json();
        setServices(services.map(service =>
          service.service_id === selectedService.service_id
            ? { ...updatedService, istaxed: Boolean(updatedService.istaxed) }
            : service
        ));
      }
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const filteredServices = services.filter(service =>
    service.servicename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          className="w-full bg-white p-2 border rounded"
          placeholder="Search or enter new service..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
        />

        {showDropdown && search && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredServices.map((service) => (
              <div
                key={service.service_id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(service)}
              >
                <div className="font-medium">{service.servicename}</div>
                <div className="text-sm text-gray-500">
                  ${service.unitprice} - {service.description}
                </div>
              </div>
            ))}
            {filteredServices.length === 0 && (
              <div
                className="p-2 hover:bg-gray-100 cursor-pointer text-black"
                onClick={handleCreateNewService}
              >
                Create new service: &quot;{search}&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {selectedService && (
        <div className="space-y-2 p-4 border rounded-md">
          <h3 className="font-medium">Edit Service Details</h3>
          <div className="space-y-2">
            <input
              type="text"
              className="w-full bg-white p-2 border rounded"
              placeholder="Description"
              value={editedService?.description || ''}
              onChange={(e) => setEditedService(prev => ({
                ...prev!,
                description: e.target.value
              }))}
              onBlur={() => handleUpdateService()}
            />
            <div className="relative">
              <span className="absolute left-3 top-2">$</span>
              <input
                type="number"
                className="w-full bg-white p-2 pl-6 border rounded"
                placeholder="Unit Price"
                value={editedService?.unitprice || ''}
                onChange={(e) => {
                  const updatedService = {
                    ...editedService!,
                    unitprice: parseFloat(e.target.value) || 0
                  };
                  setEditedService(updatedService);
                  onSelect(updatedService);
                }}
                onBlur={() => handleUpdateService()}
              />
            </div>
            <div className="flex justify-between p-2">
              <Label>Tax</Label>
              <Switch
                id="Tax"
                checked={Boolean(editedService?.istaxed)}
                onCheckedChange={(checked) => {
                  if (!editedService) return;
                  const updatedService = {
                    ...editedService,
                    istaxed: checked
                  };
                  setEditedService(updatedService);
                  onSelect(updatedService);
                  const timeoutId = setTimeout(() => {
                    handleUpdateService(updatedService);
                  }, 500);

                  return () => clearTimeout(timeoutId);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}