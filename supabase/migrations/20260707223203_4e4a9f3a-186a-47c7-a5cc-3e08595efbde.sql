-- 1) جدول السيارات
CREATE TABLE public.cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.warranty_brands(id) ON DELETE SET NULL,
  model TEXT,
  year INTEGER,
  plate_number TEXT,
  color TEXT,
  vin TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cars_customer ON public.cars(customer_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cars TO authenticated;
GRANT ALL ON public.cars TO service_role;

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- العميل يرى سياراته فقط
CREATE POLICY "customers view own cars" ON public.cars
FOR SELECT TO authenticated
USING (
  customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'branch_staff')
);

CREATE POLICY "customers insert own cars" ON public.cars
FOR INSERT TO authenticated
WITH CHECK (
  customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'branch_staff')
);

CREATE POLICY "customers update own cars" ON public.cars
FOR UPDATE TO authenticated
USING (
  customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "customers delete own cars" ON public.cars
FOR DELETE TO authenticated
USING (
  customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- trigger updated_at
CREATE TRIGGER cars_updated_at
BEFORE UPDATE ON public.cars
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) ربط السيارة بالضمان (اختياري للحفاظ على البيانات القديمة)
ALTER TABLE public.warranties
ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_warranties_car ON public.warranties(car_id);