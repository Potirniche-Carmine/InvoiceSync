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
    service_id: string;
    name: string;
    description: string;
    quantity: number;
    unitprice: number;
    totalprice: number;
  }
  
  export interface DetailedInvoice extends Invoice {
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    services: Service[];
  }