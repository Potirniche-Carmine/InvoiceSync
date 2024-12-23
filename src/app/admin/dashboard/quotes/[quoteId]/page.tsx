import React from 'react';

interface QuotePageProps {
  params: Promise<{ QuoteId: string }>;
}

export default function QuotePage({ params }: QuotePageProps) {
  const { QuoteId } = React.use(params);
  const QuoteNumber = parseInt(QuoteId, 10);

  return <h1>Quote {QuoteNumber}</h1>;
}