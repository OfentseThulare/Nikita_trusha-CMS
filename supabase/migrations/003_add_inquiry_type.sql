-- Add inquiry_type column to bookings table
ALTER TABLE public.bookings
  ADD COLUMN inquiry_type TEXT
  CHECK (inquiry_type IN (
    'Investment Planning',
    'Life Cover & Risk Protection',
    'Financial Needs Analysis',
    'Long-Term Wealth Building',
    'Not sure, just looking for advice'
  ));
