import { formatDocumentDate } from '@/lib/documents/types';

interface DocumentFooterProps {
  businessName: string;
  phone: string;
  email: string;
  generatedAt: string;
}

export const DocumentFooter = ({
  businessName,
  phone,
  email,
  generatedAt,
}: DocumentFooterProps) => {
  return (
    <footer className="mt-8 border-t border-[#e5e5e5] pt-4 text-xs text-[#525252]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p>
            {phone}
            {email ? ` · ${email}` : ''}
          </p>
          <p>Thank you for your business.</p>
          <p className="text-[#a3a3a3]">Generated {formatDocumentDate(generatedAt)}</p>
        </div>
        <div className="space-y-3 text-right text-[#a3a3a3]">
          <p>Authorized Signature ____________</p>
          <p>Company Stamp / QR Code (placeholder)</p>
          <p>{businessName}</p>
        </div>
      </div>
    </footer>
  );
};
