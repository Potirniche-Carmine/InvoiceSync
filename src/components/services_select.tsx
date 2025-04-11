import { useState, useEffect } from "react";
import { Switch } from "./ui/switch";
import { Label } from "@/components/ui/label";
import { Service, InvoiceService } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { TAX_RATE_DISPLAY, TAX_RATE } from "@/lib/constants";

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

  const [priceInput, setPriceInput] = useState(
    initialService?.unitprice ? initialService.unitprice.toString() : '0'
  );

  const [quantityInput, setQuantityInput] = useState(
    initialService?.quantity ? initialService.quantity.toString() : '1'
  );

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

  useEffect(() => {
    if (initialService) {
      setSelectedService(initialService);
      setEditedService(initialService);
      setSearch(initialService.servicename);
      setPriceInput(initialService.unitprice.toString());
    }
  }, [initialService]);

  const calculateSubtotal = (service: InvoiceService): number => {
    return (service.quantity || 1) * (service.unitprice || 0);
  };

  const calculateTaxAmount = (service: InvoiceService): number => {
    if (!service.istaxed) return 0;
    return calculateSubtotal(service) * TAX_RATE;
  };

  const calculateTotalPrice = (service: InvoiceService): number => {
    const subtotal = calculateSubtotal(service);
    const taxAmount = calculateTaxAmount(service);
    return subtotal + taxAmount;
  };

  const handleSelect = (service: Service) => {
    const invoiceService: InvoiceService = {
      ...service,
      service_id: typeof service.service_id === 'string' ? parseInt(service.service_id) : service.service_id,
      quantity: 1,
      totalprice: service.istaxed ?
        service.unitprice * (1 + TAX_RATE) :
        service.unitprice
    };

    setSelectedService(invoiceService);
    setEditedService(invoiceService);
    setSearch(service.servicename);
    setPriceInput(service.unitprice.toString());
    setShowDropdown(false);
    onSelect(invoiceService);
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
          isparts: false, // Add the isparts field with default false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create service');
      }

      const { service: newService } = await response.json();
      const formattedService: InvoiceService = {
        ...newService,
        istaxed: Boolean(newService.istaxed),
        isparts: Boolean(newService.isparts), // Ensure isparts is a boolean
        quantity: 1,
        totalprice: newService.unitprice || 0
      };

      setServices(prev => [...prev, formattedService]);
      setSelectedService(formattedService);
      setEditedService(formattedService);
      setPriceInput('0'); // Set to string '0' for new service
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
        serviceToUpdate.istaxed !== selectedService.istaxed ||
        serviceToUpdate.isparts !== selectedService.isparts // Add isparts to the comparison
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
            istaxed: Boolean(serviceToUpdate.istaxed),
            isparts: Boolean(serviceToUpdate.isparts) // Add isparts to the update
          }),
        });

        if (response.ok) {
          const { service: updatedService } = await response.json();
          setServices(services.map(service =>
            service.service_id === selectedService.service_id
              ? { 
                  ...updatedService, 
                  istaxed: Boolean(updatedService.istaxed),
                  isparts: Boolean(updatedService.isparts) // Ensure isparts is a boolean
                }
              : service
          ));
        }
      }

      onSelect({
        ...serviceToUpdate,
        totalprice: calculateTotalPrice(serviceToUpdate)
      });
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleQuantityChange = (value: string) => {
    setQuantityInput(value);

    if (!editedService) return;

    if (value && !isNaN(parseInt(value))) {
      const quantity = parseInt(value);
      const updatedService = {
        ...editedService,
        quantity: quantity,
        totalprice: calculateTotalPrice({
          ...editedService,
          quantity: quantity
        })
      };

      setEditedService(updatedService);
      onSelect(updatedService);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setPriceInput(value);

    if (!editedService) return;
    const unitprice = value ? parseFloat(value) : 0;
    if (!isNaN(unitprice)) {
      const updatedService = {
        ...editedService,
        unitprice,
        totalprice: calculateTotalPrice({
          ...editedService,
          unitprice
        })
      };

      setEditedService(updatedService);
      onSelect(updatedService);
    }
  };

  // Handle tax checkbox change
  const handleTaxChange = (checked: boolean) => {
    if (!editedService) return;

    const updatedService = {
      ...editedService,
      istaxed: checked,
      totalprice: calculateTotalPrice({
        ...editedService,
        istaxed: checked
      })
    };

    setEditedService(updatedService);
    onSelect(updatedService);
    handleUpdateService(updatedService);
  };

  const handlePartsChange = (checked: boolean) => {
    if (!editedService) return;

    const updatedService = {
      ...editedService,
      isparts: checked,
      totalprice: calculateTotalPrice({
        ...editedService,
        isparts: checked
      })
    };

    setEditedService(updatedService);
    onSelect(updatedService);
    handleUpdateService(updatedService);
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
              <div
                className="p-2 hover:bg-gray-100 cursor-pointer text-black"
                onClick={handleCreateNewService}
              >
                Create new service: &quot;{search}&quot;
              </div>
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
                  value={quantityInput}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  onBlur={() => {
                    let validQuantity = '1';
                    if (quantityInput && !isNaN(parseInt(quantityInput))) {
                      const num = parseInt(quantityInput);
                      validQuantity = Math.max(1, num).toString();
                    }
                    setQuantityInput(validQuantity);
                    handleQuantityChange(validQuantity);
                  }}
                />
              </div>
              <div>
                <Label className="mb-1 block">Unit Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full bg-white p-2 pl-6 border rounded"
                    value={priceInput}
                    onChange={handlePriceChange}
                    onBlur={() => {
                      let formattedPrice = '0';
                      if (priceInput && !isNaN(parseFloat(priceInput))) {
                        formattedPrice = parseFloat(priceInput).toString();
                      }
                      setPriceInput(formattedPrice);
                      handleUpdateService();
                    }}
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
              <Label>Apply Tax ({TAX_RATE_DISPLAY})</Label>
              <Switch
                id="Tax"
                checked={Boolean(editedService?.istaxed)}
                onCheckedChange={handleTaxChange}
              />
            </div>

            <div className="flex justify-between items-center p-2 mt-2 bg-gray-50 rounded">
              <Label>Is this parts?</Label>
              <Switch
                id="Parts"
                checked={Boolean(editedService?.isparts)}
                onCheckedChange={handlePartsChange}
              />
            </div>

            <div className="flex flex-col pt-2 border-t mt-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${editedService ? calculateSubtotal(editedService).toFixed(2) : '0.00'}</span>
              </div>

              {editedService?.istaxed && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tax ({TAX_RATE_DISPLAY}):</span>
                  <span>${editedService ? calculateTaxAmount(editedService).toFixed(2) : '0.00'}</span>
                </div>
              )}

              <div className="flex justify-between font-medium text-sm mt-1">
                <span>Total:</span>
                <span>${editedService ? calculateTotalPrice(editedService).toFixed(2) : '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}