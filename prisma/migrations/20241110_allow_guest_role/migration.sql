-- Allow guest role for profiles
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_role_check";
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_role_check"
  CHECK (role IN ('guest', 'member', 'instructor', 'admin') OR role IS NULL);
