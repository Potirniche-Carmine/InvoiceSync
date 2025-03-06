'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VinDecoderProps {
  vin: string;
  onVehicleInfoAdded: (vehicleInfo: string) => void;
  disabled?: boolean;
}

interface VehicleInfo {
  Make?: string;
  Model?: string;
  ModelYear?: string;
}

const VinDecoder = React.forwardRef<
  { decodeVin: () => Promise<void> },
  VinDecoderProps
>(({ 
  vin, 
  onVehicleInfoAdded,
  disabled = false 
}, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);

  const isValidVin = (vin: string) => {
    if (vin.length !== 17) return false;
    
    if (/[IOQ]/.test(vin.toUpperCase())) return false;
    
    return true;
  };

  const decodeVin = async () => {
    // Skip if VIN is missing or invalid
    if (!vin) {
      setError('Please enter a VIN');
      return;
    }

    // Use the isValidVin function to validate the VIN
    if (!isValidVin(vin)) {
      setError('Please enter a valid VIN (17 characters with no I, O, or Q)');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Use our server-side API to decode the VIN
      const response = await fetch(
        `/api/data/vin-decode?vin=${encodeURIComponent(vin)}`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      let apiResponse;
      try {
        apiResponse = await response.json();
      } catch {
        throw new Error('Unable to parse response from VIN decoder service');
      }
      
      // Extract the data from our API response
      const data = apiResponse.data;
      
      if (data && data.Results && data.Results.length > 0) {
        const result = data.Results[0];
        
        // Check for API errors
        if (result.ErrorCode && result.ErrorCode !== '0' && !result.Make) {
          setError(`Error: ${result.ErrorText || 'Failed to decode VIN'}`);
          setVehicleInfo(null);
          return;
        }
        
        const info: VehicleInfo = {
          Make: result.Make,
          Model: result.Model,
          ModelYear: result.ModelYear
        };
        
        // Only proceed if we have at least some basic information
        if (info.Make || info.Model || info.ModelYear) {
          setVehicleInfo(info);
          
          // Format the vehicle info as a string to append to comments
          const vehicleInfoString = formatVehicleInfo(info);
          onVehicleInfoAdded(vehicleInfoString);
        } else {
          setError('No vehicle information found for this VIN');
        }
      } else {
        setError('No vehicle information found for this VIN');
      }
    } catch (err) {
      console.error('VIN decode error:', err);
      setError('Failed to decode VIN');
    } finally {
      setIsLoading(false);
    }
  };

  const formatVehicleInfo = (info: VehicleInfo): string => {
    // Create a simple string with make, model, year and the last 8 of VIN
    const basicInfo = [info.Make, info.ModelYear, info.Model].filter(Boolean).join(' ');
    
    // Get the last 8 characters of the VIN (often used for identifying a specific vehicle)
    const lastEight = vin.length >= 8 ? vin.slice(-8) : vin;
    
    return `\n------------------------------\n${basicInfo} \nLast 8#: ${lastEight}`;
  };

  // Expose the decodeVin method to parent components
  React.useImperativeHandle(ref, () => ({
    decodeVin
  }));
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        {isLoading ? (
          <div className="flex items-center text-blue-600">
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
            <span>Decoding VIN...</span>
          </div>
        ) : vehicleInfo ? (
          <div className="text-green-600 text-sm">
            Vehicle information added
          </div>
        ) : null}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={decodeVin}
          disabled={isLoading || disabled || !vin}
          className="ml-auto"
        >
          <Search className="mr-2 h-4 w-4" />
          Decode VIN
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
});

VinDecoder.displayName = "VinDecoder";

export default VinDecoder;