import { useState, useEffect } from "react";
import { Switch } from "./ui/switch";
import { Label } from "@/app/components/ui/label";
import { Service, InvoiceService } from "@/app/lib/types";
import { Button } from "@/app/components/ui/button";
import { Trash } from "lucide-react";

interface ServiceSelectProps {
  onSelect: (service: InvoiceService) => void;
  onRemove?: () => void;
  initialService?: InvoiceService;
  showRemoveButton?: boolean;
}

export default function ServiceSelect({ 
  onSelect, 
  onRemove, 
  initialService, 
  showRemoveButton = false 
}: ServiceSelectProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState(initialService?.servicename || '');
  const [, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedService, setSelectedService] = useState<InvoiceService | null>(
    initialService ? { ...initialService, quantity: initialService.quantity || 1 } : null
  );
  const [editedService, setEditedService] = useState<InvoiceService | null>(
    initialService ? { ...initialService, quantity: initialService.quantity || 1 } : null
  );

  // Fetch services on component mount
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

  // Set initial service when provided
  useEffect(() => {
    if (initialService) {
      setSelectedService(initialService);
      setEditedService(initialService);
      setSearch(initialService.servicename);
    }
  }, [initialService]);

  // Calculate total price based on quantity and unit price
  const calculateTotalPrice = (service: InvoiceService): number => {
    return (service.quantity || 1) * (service.unitprice || 0);
  };

  // Handle service selection from dropdown
  const handleSelect = (service: Service) => {
    const invoiceService: InvoiceService = {
      ...service,
      quantity: 1,
      totalprice: service.unitprice || 0
    };
    
    setSelectedService(invoiceService);
    setEditedService(invoiceService);
    setSearch(service.servicename);
    setShowDropdown(false);
    onSelect(invoiceService);
  };

  // Create a new service
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
      const formattedService: InvoiceService = {
        ...newService,
        istaxed: Boolean(newService.istaxed),
        quantity: 1,
        totalprice: newService.unitprice || 0
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

  // Update the service details
  const handleUpdateService = async (serviceToUpdate = editedService) => {
    if (!serviceToUpdate || !selectedService?.service_id) return;
  
    try {
      // Only update the service in the database if its properties (not quantity) change
      if (
        serviceToUpdate.description !== selectedService.description ||
        serviceToUpdate.unitprice !== selectedService.unitprice ||
        serviceToUpdate.istaxed !== selectedService.istaxed
      ) {
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
      }

      // Always notify the parent component about the updated service
      onSelect({
        ...serviceToUpdate,
        totalprice: calculateTotalPrice(serviceToUpdate)
      });
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (quantity: number) => {
    if (!editedService) return;
    
    const updatedService = {
      ...editedService,
      quantity: Math.max(1, quantity), // Ensure quantity is at least 1
      totalprice: Math.max(1, quantity) * editedService.unitprice
    };
    
    setEditedService(updatedService);
    onSelect(updatedService);
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
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{selectedService.servicename}</h3>
            {showRemoveButton && onRemove && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRemove}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash size={16} />
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-1 block">Quantity</Label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-white p-2 border rounded"
                  value={editedService?.quantity || 1}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label className="mb-1 block">Unit Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2">$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-white p-2 pl-6 border rounded"
                    value={editedService?.unitprice || 0}
                    onChange={(e) => {
                      if (!editedService) return;
                      const unitprice = parseFloat(e.target.value) || 0;
                      const updatedService = {
                        ...editedService,
                        unitprice,
                        totalprice: (editedService.quantity || 1) * unitprice
                      };
                      setEditedService(updatedService);
                      onSelect(updatedService);
                    }}
                    onBlur={() => handleUpdateService()}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label className="mb-1 block">Description</Label>
              <input
                type="text"
                className="w-full bg-white p-2 border rounded"
                placeholder="Description"
                value={editedService?.description || ''}
                onChange={(e) => {
                  if (!editedService) return;
                  setEditedService({
                    ...editedService,
                    description: e.target.value
                  });
                }}
                onBlur={() => handleUpdateService()}
              />
            </div>
            
            <div className="flex justify-between items-center p-2 mt-2 bg-gray-50 rounded">
              <Label>Apply Tax (8.75%)</Label>
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
                  handleUpdateService(updatedService);
                }}
              />
            </div>
            
            <div className="flex justify-between font-medium text-sm pt-2 border-t mt-2">
              <span>Total:</span>
              <span>${editedService ? calculateTotalPrice(editedService).toFixed(2) : '0.00'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}