import { useState, useEffect } from "react";

export interface Service {
    service_id?: number;
    servicename: string;
    description: string;
    unitprice: number;
}

interface ServiceSelectProps {
    onSelect: (service: Service) => void;
}

export default function ServiceSelect({ onSelect }: ServiceSelectProps) {
    const [services, setServices] = useState<Service[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [editedService, setEditedService] = useState<Service | null>(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch('/api/services');
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

    const filteredServices = services.filter(service =>
        service.servicename.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (service: Service) => {
        setSelectedService(service);
        setEditedService(service);
        setSearch(service.servicename);
        setShowDropdown(false);
        onSelect(service);
    };

    const handleCreateNewService = () => {
        const newService: Service = {
            servicename: 'search',
            description: '',
            unitprice: 0
        };
        setSelectedService(newService);
        setEditedService(newService);
        setShowDropdown(false);
        onSelect(newService);
    };

    const handleUpdateService = async () => {
        if (!editedService || !selectedService?.service_id) return;

        try {
            const response = await fetch('/api/services',{
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    service_id: selectedService.service_id,
                    description: editedService.description,
                    unitprice: editedService.unitprice,
                }),
            });
            if (response.ok) {
                const updatedService = await response.json();
                setServices(services.map(service =>
                    service.service_id === selectedService.service_id
                    ? updatedService.service
                    : service
                ));
            }
        } catch (error) {
            console.error('Error updating service:', error);
        }
    };

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
                    className="p-2 hover:bg-gray-100 cursor-pointer text-blue-600"
                    onClick={handleCreateNewService}
                  >
                    Create new service: "{search}"
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
                  onBlur={handleUpdateService}
                />
                <input
                  type="number"
                  className="w-full bg-white p-2 border rounded"
                  placeholder="Unit Price"
                  value={editedService?.unitprice || ''}
                  onChange={(e) => setEditedService(prev => ({
                    ...prev!,
                    unitprice: parseFloat(e.target.value)
                  }))}
                  onBlur={handleUpdateService}
                />
              </div>
            </div>
          )}
        </div>
  );
}

