-- =====================================================
-- 1단계: 테이블 생성 (RLS 정책 없이)
-- =====================================================

-- profiles 테이블
CREATE TABLE profiles (
  phone TEXT PRIMARY KEY,
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'instructor', 'member')),
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- members 테이블
CREATE TABLE members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_guest BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'guest')),
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- class_types 테이블
CREATE TABLE class_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 수업 타입 추가
INSERT INTO class_types (name) VALUES
  ('인트로'),
  ('개인수업'),
  ('듀엣수업'),
  ('그룹수업');

-- payment_types 테이블
CREATE TABLE payment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 결제 타입 추가
INSERT INTO payment_types (name) VALUES
  ('유료'),
  ('강사 서비스'),
  ('센터 서비스');

-- member_passes 테이블
CREATE TABLE member_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  class_type_id UUID NOT NULL REFERENCES class_types(id) ON DELETE CASCADE,
  payment_type_id UUID NOT NULL REFERENCES payment_types(id) ON DELETE CASCADE,
  total_count INTEGER NOT NULL DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- classes 테이블
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_date DATE NOT NULL,
  class_time TIME NOT NULL,
  instructor_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  class_type_id UUID NOT NULL REFERENCES class_types(id) ON DELETE CASCADE,
  payment_type_id UUID NOT NULL REFERENCES payment_types(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- attendances 테이블
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, member_id)
);

-- user_permissions 테이블
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone TEXT NOT NULL UNIQUE,
  menu_dashboard BOOLEAN DEFAULT true,
  menu_attendance BOOLEAN DEFAULT true,
  menu_members BOOLEAN DEFAULT false,
  menu_classes BOOLEAN DEFAULT false,
  menu_settlements BOOLEAN DEFAULT false,
  menu_settings BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2단계: RLS 정책, Trigger, 함수 생성
-- =====================================================

-- profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth_id = auth.uid());

-- members RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated insert members"
ON members FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view members based on role"
ON members FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR (
        profiles.role = 'instructor'
        AND EXISTS (
          SELECT 1 FROM classes
          WHERE classes.member_id = members.id
          AND classes.instructor_id = profiles.phone
        )
      )
    )
  )
);

CREATE POLICY "Users can update members based on role"
ON members FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR (
        profiles.role = 'instructor'
        AND EXISTS (
          SELECT 1 FROM classes
          WHERE classes.member_id = members.id
          AND classes.instructor_id = profiles.phone
        )
      )
    )
  )
);

CREATE POLICY "Users can delete members based on role"
ON members FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- class_types RLS
ALTER TABLE class_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to read class types"
ON class_types FOR SELECT
TO authenticated
USING (true);

-- payment_types RLS
ALTER TABLE payment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to read payment types"
ON payment_types FOR SELECT
TO authenticated
USING (true);

-- member_passes RLS
ALTER TABLE member_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view passes based on role"
ON member_passes FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR (
        profiles.role = 'instructor'
        AND EXISTS (
          SELECT 1 FROM classes
          WHERE classes.member_id = member_passes.member_id
          AND classes.instructor_id = profiles.phone
        )
      )
    )
  )
);

CREATE POLICY "Allow admin and instructor to insert passes"
ON member_passes FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role IN ('admin', 'instructor')
  )
);

CREATE POLICY "Allow admin and instructor to update passes"
ON member_passes FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- classes RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view classes based on role"
ON classes FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR (profiles.role = 'instructor' AND classes.instructor_id = profiles.phone)
      OR (profiles.role = 'member' AND classes.member_id = profiles.phone)
    )
  )
);

CREATE POLICY "Allow admin and instructor to insert classes"
ON classes FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role IN ('admin', 'instructor')
  )
);

CREATE POLICY "Allow admin and instructor to update classes"
ON classes FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role IN ('admin', 'instructor')
  )
);

CREATE POLICY "Allow admin and instructor to delete classes"
ON classes FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- attendances RLS
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attendances based on role"
ON attendances FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND (
      profiles.role = 'admin'
      OR (
        profiles.role = 'instructor'
        AND EXISTS (
          SELECT 1 FROM classes
          WHERE classes.id = attendances.class_id
          AND classes.instructor_id = profiles.phone
        )
      )
      OR (profiles.role = 'member' AND attendances.member_id = profiles.phone)
    )
  )
);

CREATE POLICY "Allow admin and instructor to insert attendances"
ON attendances FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role IN ('admin', 'instructor')
  )
);

CREATE POLICY "Allow admin and instructor to update attendances"
ON attendances FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role IN ('admin', 'instructor')
  )
);

-- user_permissions RLS
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated insert permissions"
ON user_permissions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admin can view all permissions"
ON user_permissions FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view own permissions"
ON user_permissions FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.phone = user_permissions.user_phone
  )
);

CREATE POLICY "Only admin can update permissions"
ON user_permissions FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Only admin can delete permissions"
ON user_permissions FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Trigger: profiles 생성 시 자동으로 members, permissions 생성
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- members 테이블에 자동 추가
  BEGIN
    INSERT INTO members (id, name, is_guest, status, join_date)
    VALUES (NEW.phone, NEW.name, true, 'guest', CURRENT_DATE)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to insert member: %', SQLERRM;
  END;
  
  -- user_permissions 테이블에 자동 추가
  BEGIN
    INSERT INTO user_permissions (
      user_phone, 
      menu_dashboard, 
      menu_attendance, 
      menu_members, 
      menu_classes, 
      menu_settlements, 
      menu_settings
    )
    VALUES (NEW.phone, true, true, false, false, false, true)
    ON CONFLICT (user_phone) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to insert permissions: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_profile();

-- 함수: get_members_with_passes (회원 + 잔여 수업)
CREATE OR REPLACE FUNCTION get_members_with_passes()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  is_guest BOOLEAN,
  status TEXT,
  join_date DATE,
  total_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.is_guest,
    m.status,
    m.join_date,
    COALESCE(SUM(mp.total_count - mp.used_count), 0)::INTEGER as total_remaining
  FROM members m
  LEFT JOIN member_passes mp ON m.id = mp.member_id
  GROUP BY m.id, m.name, m.is_guest, m.status, m.join_date
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Trigger 삭제
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
DROP FUNCTION IF EXISTS handle_new_profile();

DELETE FROM user_permissions WHERE user_phone = '01058405579';
DELETE FROM members WHERE id = '01058405579';
DELETE FROM profiles WHERE phone = '01058405579';

DROP POLICY IF EXISTS "Allow authenticated insert profiles" ON profiles;

CREATE POLICY "Anyone can insert profiles"
ON profiles FOR INSERT
WITH CHECK (true);

SELECT * FROM profiles WHERE phone = '01077778888';
SELECT * FROM members WHERE id = '01077778888';
SELECT * FROM user_permissions WHERE user_phone = '01077778888';

-- 1. profiles 확인
SELECT * FROM profiles WHERE phone = '01077778888';

SELECT * FROM members WHERE id = '01077778888';

SELECT id, email FROM auth.users WHERE email = '01077778888@luelnote.app';

UPDATE profiles SET role = 'admin' WHERE phone = '01077778888';

-- 권한도 모두 true로
UPDATE user_permissions 
SET menu_members = true,
    menu_classes = true,
    menu_settlements = true
WHERE user_phone = '01077778888';

-- Table Editor → class_types → RLS 설정
-- 또는 SQL Editor에서 실행:

CREATE POLICY "Enable read access for authenticated users" ON class_types
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users" ON payment_types
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users" ON profiles
FOR SELECT
TO authenticated
USING (true);


-- =====================================================
-- Luel Note 프로젝트 DB 업데이트
-- 1. instructor_members 테이블 생성 (강사-회원 다대다 관계)
-- 2. payment_types 데이터 업데이트 (유료 → 세션)
-- =====================================================

-- 1. 강사-회원 연결 테이블 생성
CREATE TABLE IF NOT EXISTS instructor_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instructor_id, member_id)
);

-- instructor_members 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_instructor_members_instructor 
ON instructor_members(instructor_id);

CREATE INDEX IF NOT EXISTS idx_instructor_members_member 
ON instructor_members(member_id);

-- instructor_members RLS 정책
ALTER TABLE instructor_members ENABLE ROW LEVEL SECURITY;

-- 관리자는 모두 볼 수 있음
CREATE POLICY "Admin can view all instructor_members"
ON instructor_members FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 강사는 자신과 연결된 회원 관계 볼 수 있음
CREATE POLICY "Instructor can view own instructor_members"
ON instructor_members FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.phone = instructor_members.instructor_id
  )
);

-- 회원은 자신과 연결된 강사 관계 볼 수 있음
CREATE POLICY "Member can view own instructor_members"
ON instructor_members FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.phone = instructor_members.member_id
  )
);

-- 회원은 자신의 담당 강사를 추가/수정/삭제 가능
CREATE POLICY "Member can manage own instructors"
ON instructor_members FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.phone = instructor_members.member_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.phone = instructor_members.member_id
  )
);

-- 관리자는 모든 관계 관리 가능
CREATE POLICY "Admin can manage all instructor_members"
ON instructor_members FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 2. payment_types 데이터 업데이트 (유료 → 세션)
UPDATE payment_types 
SET name = '세션' 
WHERE name = '유료';

-- 3. 헬퍼 함수: 강사의 담당 회원 목록 조회
CREATE OR REPLACE FUNCTION get_instructor_members(instructor_phone TEXT)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  is_guest BOOLEAN,
  status TEXT,
  join_date DATE,
  total_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.is_guest,
    m.status,
    m.join_date,
    COALESCE(SUM(mp.total_count - mp.used_count), 0)::INTEGER as total_remaining
  FROM members m
  INNER JOIN instructor_members im ON m.id = im.member_id
  LEFT JOIN member_passes mp ON m.id = mp.member_id
  WHERE im.instructor_id = instructor_phone
  GROUP BY m.id, m.name, m.is_guest, m.status, m.join_date
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 헬퍼 함수: 회원의 담당 강사 목록 조회
CREATE OR REPLACE FUNCTION get_member_instructors(member_phone TEXT)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.phone as id,
    p.name,
    p.role
  FROM profiles p
  INNER JOIN instructor_members im ON p.phone = im.instructor_id
  WHERE im.member_id = member_phone
  AND p.role IN ('instructor', 'admin')
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 헬퍼 함수: 회원의 잔여 회원권 체크
CREATE OR REPLACE FUNCTION check_member_has_passes(member_phone TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  total_remaining INTEGER;
BEGIN
  SELECT COALESCE(SUM(mp.total_count - mp.used_count), 0)
  INTO total_remaining
  FROM member_passes mp
  WHERE mp.member_id = member_phone;
  
  RETURN total_remaining > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 완료!
-- 이 SQL을 Supabase SQL Editor에서 실행하세요.
