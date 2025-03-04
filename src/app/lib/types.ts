export interface Invoice {
  invoice_id: string;
  customer_name: string;
  date: string;
  duedate: string;
  totalamount: number;
  status: 'paid' | 'pending' | 'overdue';
  po_number: string;
  vin: string;
  description: string;
  subtotal: number;
  tax_total: number;
  private_comments: string;
}

export interface Customer {
  customer_id: number;
  customer_name: string;
  customer_address: string | null;
}

export interface Service {
  service_id: number | string;
  servicename: string;
  description: string;
  unitprice: number;
  istaxed: boolean;
  quantity?: number; 
}

export interface InvoiceService extends Service {
  quantity: number; 
  totalprice: number;
}

export interface DetailedInvoice extends Invoice {
  customer_address: string;
  services: InvoiceService[];
  customer_id: number;
}