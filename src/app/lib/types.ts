export interface Customer {
  customer_id: number;
  customer_name: string;
  customer_address: string | null;
}

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
  
  export interface Service {
    service_id?: number;
    servicename: string;
    description: string;
    unitprice: number;
    istaxed: boolean;
  }

  export interface InvoiceServiceDetail {
    service_id: string;
    servicename: string;  // From services table
    description: string;  // From services table
    quantity: number;     // From invoicedetail table
    unitprice: number;    
    totalprice: number;
    istaxed: boolean;   
  }
  
  export interface DetailedInvoice extends Invoice {
    customer_id: number;
    customer_address: string;
    services: InvoiceServiceDetail[];
  }