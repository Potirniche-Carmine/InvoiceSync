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
    initialService?.unitprice != null ? initialService.unitprice.toFixed(2) : '0.00'
  );
  const [quantityInput, setQuantityInput] = useState(
    initialService?.quantity ? initialService.quantity.toString() : '1'
  );

  const [isPriceInputFocused, setIsPriceInputFocused] = useState(false);

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
      const qty = initialService.quantity || 1;
      const initialUnitPrice = Number(initialService.unitprice) || 0;
      const initialServicePriceString = initialUnitPrice.toFixed(2);

      const serviceWithDefaults = { ...initialService, quantity: qty, unitprice: initialUnitPrice };
      setSelectedService(serviceWithDefaults);
      setEditedService(serviceWithDefaults);
      setSearch(initialService.servicename);
      setQuantityInput(qty.toString());

      if (!isPriceInputFocused) {
        if (priceInput !== initialServicePriceString) {
          setPriceInput(initialServicePriceString);
        }
      }
    } else {
      setSelectedService(null);
      setEditedService(null);
      setSearch('');
      if (!isPriceInputFocused || priceInput !== '0.00') {
        setPriceInput('0.00');
      }
      if (quantityInput !== '1') {
        setQuantityInput('1');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialService]);

  const calculateSubtotal = (service: InvoiceService): number => {
    return (service.quantity || 1) * (Number(service.unitprice) || 0);
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
    const unitPriceNum = Number(service.unitprice) || 0;
    const invoiceService: InvoiceService = {
      ...service,
      service_id: typeof service.service_id === 'string' ? parseInt(service.service_id) : service.service_id,
      quantity: 1,
      unitprice: unitPriceNum,
      totalprice: service.istaxed ? unitPriceNum * (1 + TAX_RATE) : unitPriceNum
    };
    setSelectedService(invoiceService);
    setEditedService(invoiceService);
    setSearch(service.servicename);
    setPriceInput(unitPriceNum.toFixed(2));
    setQuantityInput("1");
    setShowDropdown(false);
    onSelect(invoiceService);
  };

  const handleCreateNewService = async () => {
    try {
      const response = await fetch('/api/data/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicename: search, description: '', unitprice: 0, istaxed: false }),
      });
      if (!response.ok) throw new Error('Failed to create service');
      const { service: newService } = await response.json();
      const unitPriceNum = Number(newService.unitprice) || 0;
      const formattedService: InvoiceService = {
        ...newService,
        istaxed: Boolean(newService.istaxed),
        quantity: 1,
        unitprice: unitPriceNum,
        totalprice: unitPriceNum,
      };
      setServices(prev => [...prev, formattedService]);
      setSelectedService(formattedService);
      setEditedService(formattedService);
      setPriceInput('0.00');
      setQuantityInput('1');
      setShowDropdown(false);
      onSelect(formattedService);
    } catch (error) {
      console.error('Error creating new service:', error);
    }
  };

  const handleUpdateService = async (serviceToUpdateParam = editedService) => {
    const serviceToUpdate = serviceToUpdateParam;
    if (!serviceToUpdate || !selectedService?.service_id) return;

    const numericUnitPriceInUpdate = Number(serviceToUpdate.unitprice) || 0;
    const numericUnitPriceInSelectedOriginal = Number(selectedService.unitprice) || 0;

    try {
      let dbNeedsUpdate = false;
      if (selectedService) { // Check against the original selected service for DB changes
        if (serviceToUpdate.description !== selectedService.description ||
          numericUnitPriceInUpdate !== numericUnitPriceInSelectedOriginal ||
          Boolean(serviceToUpdate.istaxed) !== Boolean(selectedService.istaxed)) {
          dbNeedsUpdate = true;
        }
      }

      if (dbNeedsUpdate) {
        const response = await fetch('/api/data/services', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: selectedService.service_id,
            description: serviceToUpdate.description,
            unitprice: numericUnitPriceInUpdate,
            istaxed: Boolean(serviceToUpdate.istaxed),
          }),
        });
        if (response.ok) {
          const { service: updatedDbService } = await response.json();
          const dbServiceNumeric = { ...updatedDbService, unitprice: Number(updatedDbService.unitprice), istaxed: Boolean(updatedDbService.istaxed) };
          setServices(services.map(s => s.service_id === selectedService.service_id ? { ...s, ...dbServiceNumeric } : s));
          setSelectedService(prev => prev ? { ...prev, ...dbServiceNumeric, quantity: serviceToUpdate.quantity } : null);
        }
      }
      const finalServiceStateForOnSelect = {
        ...serviceToUpdate,
        unitprice: numericUnitPriceInUpdate,
        totalprice: calculateTotalPrice({ ...serviceToUpdate, unitprice: numericUnitPriceInUpdate }),
      };
      onSelect(finalServiceStateForOnSelect);
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleQuantityChange = (value: string) => {
    setQuantityInput(value);
    if (!editedService) return;
    const quantity = parseInt(value);
    if (!isNaN(quantity) && quantity >= 0) {
      const updatedService = { ...editedService, quantity: quantity };
      setEditedService({ ...updatedService, totalprice: calculateTotalPrice(updatedService) });
      onSelect({ ...updatedService, totalprice: calculateTotalPrice(updatedService) });
    } else if (value === "") {
      const updatedService = { ...editedService, quantity: 0 };
      setEditedService({ ...updatedService, totalprice: calculateTotalPrice(updatedService) });
      onSelect({ ...updatedService, totalprice: calculateTotalPrice(updatedService) });
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPriceInput(value); 

    if (!editedService) return;
    const numericValue = parseFloat(value); 

    if (!isNaN(numericValue) || value === "" || value.endsWith(".") || value === "-") {
      const unitPriceForCalc = !isNaN(numericValue) ? numericValue : 0;
      const tempUpdatedService = {
        ...editedService,
        unitprice: unitPriceForCalc,
      };
      setEditedService(prev => prev ? { ...prev, unitprice: unitPriceForCalc, quantity: prev.quantity || 1, totalprice: calculateTotalPrice(tempUpdatedService) } : null);
    }
  };

  const handleTaxChange = (checked: boolean) => {
    if (!editedService) return;
    const serviceWithTaxChange = { ...editedService, istaxed: checked };
    const updatedService = { ...serviceWithTaxChange, totalprice: calculateTotalPrice(serviceWithTaxChange) };
    setEditedService(updatedService);
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
          onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        {showDropdown && search && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredServices.map((service) => (
              <div key={service.service_id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSelect(service)}>
                <div className="font-medium">{service.servicename}</div>
                <div className="text-sm text-gray-500">${(Number(service.unitprice) || 0).toFixed(2)} - {service.description}</div>
              </div>
            ))}
            {!filteredServices.find(s => s.servicename.toLowerCase() === search.toLowerCase()) && search.length > 0 && (
              <div className="p-2 hover:bg-gray-100 cursor-pointer text-black" onClick={handleCreateNewService}>
                Create new service: &quot;{search}&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {selectedService && editedService && (
        <div className="space-y-2 p-4 border rounded-md">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{editedService.servicename}</h3>
            {showRemoveButton && onRemove && (
              <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-500 hover:text-red-700 p-1">
                <Trash size={16} />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-1 block">Quantity</Label>
                <input
                  type="number" min="1" className="w-full bg-white p-2 border rounded"
                  value={quantityInput}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  onBlur={() => {
                    let validQuantity = "1";
                    if (quantityInput && !isNaN(parseInt(quantityInput))) {
                      validQuantity = Math.max(1, parseInt(quantityInput)).toString();
                    }
                    setQuantityInput(validQuantity);
                    handleQuantityChange(validQuantity);
                  }}
                />
              </div>
              <div>
                <Label className="mb-1 block">Unit Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number" step="0.01" min="0"
                    className="w-full bg-white p-2 pl-7 border rounded"
                    value={priceInput}
                    onChange={handlePriceChange}
                    onFocus={() => setIsPriceInputFocused(true)}
                    onBlur={() => {
                      setIsPriceInputFocused(false);
                      let numericValue = 0;
                      if (priceInput && priceInput.trim() !== "") {
                        const parsed = parseFloat(priceInput);
                        if (!isNaN(parsed) && parsed >= 0) numericValue = parsed;
                      }
                      const displayValue = numericValue.toFixed(2);
                      setPriceInput(displayValue);

                      if (editedService) {
                        const updatedService = {
                          ...editedService,
                          unitprice: numericValue,
                          totalprice: calculateTotalPrice({ ...editedService, unitprice: numericValue }),
                        };
                        setEditedService(updatedService);
                        handleUpdateService(updatedService);
                      } else {
                        handleUpdateService();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Description</Label>
              <input
                type="text" className="w-full bg-white p-2 border rounded"
                placeholder="Description" value={editedService.description || ''}
                onChange={(e) => { if (!editedService) return; setEditedService({ ...editedService, description: e.target.value }); }}
                onBlur={() => handleUpdateService()}
              />
            </div>
            <div className="flex justify-between items-center p-2 mt-2 bg-gray-50 rounded">
              <Label htmlFor={`tax-switch-${editedService.service_id}`}>Apply Tax ({TAX_RATE_DISPLAY})</Label>
              <Switch
                id={`tax-switch-${editedService.service_id}`}
                checked={Boolean(editedService.istaxed)}
                onCheckedChange={handleTaxChange}
              />
            </div>
            <div className="flex flex-col pt-2 border-t mt-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${editedService ? calculateSubtotal(editedService).toFixed(2) : '0.00'}</span>
              </div>
              {editedService.istaxed && (
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