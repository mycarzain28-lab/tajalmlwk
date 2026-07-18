
-- Phase 1: Website Builder foundation tables

-- 1) website_pages
CREATE TABLE public.website_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft | published
  is_home BOOLEAN NOT NULL DEFAULT false,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout JSONB NOT NULL DEFAULT '{"sections":[]}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_pages TO authenticated;
GRANT SELECT ON public.website_pages TO anon;
GRANT ALL ON public.website_pages TO service_role;
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wb_pages_public_read_published" ON public.website_pages FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "wb_pages_admin_all" ON public.website_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER trg_website_pages_updated BEFORE UPDATE ON public.website_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) website_sections (reusable sections)
CREATE TABLE public.website_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- hero, features, gallery, cta, text, faq, testimonials, custom
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_sections TO authenticated;
GRANT SELECT ON public.website_sections TO anon;
GRANT ALL ON public.website_sections TO service_role;
ALTER TABLE public.website_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wb_sections_public_read" ON public.website_sections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "wb_sections_admin_all" ON public.website_sections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER trg_website_sections_updated BEFORE UPDATE ON public.website_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) website_menus (navigation)
CREATE TABLE public.website_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL, -- header, footer, mobile
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  parent_id UUID REFERENCES public.website_menus(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_menus TO authenticated;
GRANT SELECT ON public.website_menus TO anon;
GRANT ALL ON public.website_menus TO service_role;
ALTER TABLE public.website_menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wb_menus_public_read" ON public.website_menus FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "wb_menus_admin_all" ON public.website_menus FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER trg_website_menus_updated BEFORE UPDATE ON public.website_menus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) website_theme (single-row theme config)
CREATE TABLE public.website_theme (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'default',
  is_active BOOLEAN NOT NULL DEFAULT true,
  tokens JSONB NOT NULL DEFAULT '{}'::jsonb, -- colors, fonts, radius, spacing
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_theme TO authenticated;
GRANT SELECT ON public.website_theme TO anon;
GRANT ALL ON public.website_theme TO service_role;
ALTER TABLE public.website_theme ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wb_theme_public_read" ON public.website_theme FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "wb_theme_admin_all" ON public.website_theme FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER trg_website_theme_updated BEFORE UPDATE ON public.website_theme FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) website_media (media library metadata)
CREATE TABLE public.website_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  alt TEXT,
  type TEXT NOT NULL DEFAULT 'image', -- image | video | file
  size INT,
  width INT,
  height INT,
  folder TEXT DEFAULT '/',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_media TO authenticated;
GRANT SELECT ON public.website_media TO anon;
GRANT ALL ON public.website_media TO service_role;
ALTER TABLE public.website_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wb_media_public_read" ON public.website_media FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "wb_media_admin_all" ON public.website_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'));

-- 6) website_forms (form definitions)
CREATE TABLE public.website_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  notify_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_forms TO authenticated;
GRANT SELECT ON public.website_forms TO anon;
GRANT ALL ON public.website_forms TO service_role;
ALTER TABLE public.website_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wb_forms_public_read_active" ON public.website_forms FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "wb_forms_admin_all" ON public.website_forms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER trg_website_forms_updated BEFORE UPDATE ON public.website_forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) website_form_submissions
CREATE TABLE public.website_form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.website_forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.website_form_submissions TO anon, authenticated;
GRANT SELECT, DELETE ON public.website_form_submissions TO authenticated;
GRANT ALL ON public.website_form_submissions TO service_role;
ALTER TABLE public.website_form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wb_submissions_insert_any" ON public.website_form_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "wb_submissions_admin_read" ON public.website_form_submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "wb_submissions_admin_delete" ON public.website_form_submissions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'));

-- 8) website_settings (key/value general site settings)
CREATE TABLE public.website_settings (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_settings TO authenticated;
GRANT SELECT ON public.website_settings TO anon;
GRANT ALL ON public.website_settings TO service_role;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wb_settings_public_read" ON public.website_settings FOR SELECT TO anon, authenticated USING (is_public);
CREATE POLICY "wb_settings_admin_all" ON public.website_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'));

-- 9) website_page_revisions (version history)
CREATE TABLE public.website_page_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.website_pages(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.website_page_revisions TO authenticated;
GRANT ALL ON public.website_page_revisions TO service_role;
ALTER TABLE public.website_page_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wb_revisions_admin_all" ON public.website_page_revisions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'));

-- Seed default theme
INSERT INTO public.website_theme (name, is_active, tokens)
VALUES ('تاج الملوك', true, '{"primary":"#D4AF37","secondary":"#0A0A0A","font":"Cairo","radius":"0.75rem"}'::jsonb);

-- Seed default settings
INSERT INTO public.website_settings (key, value, is_public) VALUES
  ('site_name', '"تاج الملوك"'::jsonb, true),
  ('site_description', '"مركز ومتجر متكامل للعناية بالسيارات"'::jsonb, true)
ON CONFLICT (key) DO NOTHING;
