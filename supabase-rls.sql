-- ========================================================
-- KEMET Row Level Security (RLS) Policies Migration (v2 Production)
-- Architecture: Zero Client Trust / Admin & Server-First Security
-- ========================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Helper Function to Check if Current Authenticated User is Admin
-- Includes SET search_path = public for SECURITY DEFINER PostgreSQL best practices
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ========================================================
-- 1. CATEGORIES POLICIES
-- ========================================================
DROP POLICY IF EXISTS "Allow anon and authenticated read access to categories" ON public.categories;
CREATE POLICY "Allow anon and authenticated read access to categories"
ON public.categories FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow admin full access to categories" ON public.categories;
CREATE POLICY "Allow admin full access to categories"
ON public.categories FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ========================================================
-- 2. PRODUCTS POLICIES
-- ========================================================
DROP POLICY IF EXISTS "Allow anon and authenticated read access to active products" ON public.products;
CREATE POLICY "Allow anon and authenticated read access to active products"
ON public.products FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Allow admin full access to products" ON public.products;
CREATE POLICY "Allow admin full access to products"
ON public.products FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ========================================================
-- 3. PRODUCT VARIANTS POLICIES
-- ========================================================
DROP POLICY IF EXISTS "Allow anon and authenticated read access to product variants" ON public.product_variants;
CREATE POLICY "Allow anon and authenticated read access to product variants"
ON public.product_variants FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow admin full access to product variants" ON public.product_variants;
CREATE POLICY "Allow admin full access to product variants"
ON public.product_variants FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ========================================================
-- 4. PROFILES POLICIES
-- ========================================================
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.profiles;
CREATE POLICY "Allow users to read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
CREATE POLICY "Allow users to insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admin full access to profiles" ON public.profiles;
CREATE POLICY "Allow admin full access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ========================================================
-- 5. ORDERS POLICIES
-- ========================================================
-- NOTE: Zero client INSERT allowed! Orders created safely via Server/Service Role.

DROP POLICY IF EXISTS "Allow users to read own orders" ON public.orders;
CREATE POLICY "Allow users to read own orders"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin full access to orders" ON public.orders;
CREATE POLICY "Allow admin full access to orders"
ON public.orders FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ========================================================
-- 6. ORDER ITEMS POLICIES
-- ========================================================
-- NOTE: Zero client INSERT allowed! Order Items created safely via Server/Service Role.

DROP POLICY IF EXISTS "Allow users to read own order items" ON public.order_items;
CREATE POLICY "Allow users to read own order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE public.orders.id = public.order_items.order_id
        AND public.orders.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Allow admin full access to order items" ON public.order_items;
CREATE POLICY "Allow admin full access to order items"
ON public.order_items FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
