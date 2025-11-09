# Luel Note - 설정 가이드

## 1. 환경 변수 설정

`.env.local` 파일이 자동으로 생성되었습니다. (keys.txt에서 정보 가져옴)

필요한 환경 변수:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key (관리자 기능용)

## 2. Supabase 데이터베이스 스키마 생성

Supabase 대시보드의 SQL Editor에서 다음 SQL을 실행하세요:

### ⚠️ 초기화 옵션 (선택사항)

**처음부터 시작하거나 모든 데이터를 삭제하고 다시 설정하려면, 아래 초기화 스크립트를 먼저 실행하세요:**

```sql
-- ============================================
-- 초기화 스크립트 - 모든 테이블 삭제
-- ⚠️ 경고: 이 스크립트는 모든 데이터를 삭제합니다!
-- ============================================

-- CASCADE로 관련된 모든 외래키와 의존성도 함께 삭제
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS instructor_members CASCADE;
DROP TABLE IF EXISTS membership_packages CASCADE;
DROP TABLE IF EXISTS class_members CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS payment_types CASCADE;
DROP TABLE IF EXISTS class_types CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 트리거 함수도 삭제
DROP FUNCTION IF EXISTS sync_time_columns() CASCADE;
DROP FUNCTION IF EXISTS deduct_membership_lesson(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 성공 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 모든 테이블이 삭제되었습니다. 이제 2-1부터 순서대로 실행하세요.';
END $$;
```

**초기화 후에는 2-1부터 순서대로 실행하세요.**

### 2.1. profiles 테이블 (사용자 프로필)

```sql
-- 확장 설치 (uuid 생성용)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 기존 테이블이 있다면 삭제 (주의: 데이터가 모두 삭제됩니다!)
-- 처음 설정하는 경우에만 이 줄을 실행하세요
-- DROP TABLE IF EXISTS profiles CASCADE;

-- 테이블 생성
-- 주의: auth.users는 Supabase 시스템 테이블이라 FK 제약 조건을 직접 걸 수 없습니다.
-- auth_id는 auth.users.id 값을 저장하지만 FK 제약 없이 사용합니다.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL,  -- auth.users.id를 저장 (FK 제약 없음)
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'instructor', 'member')) DEFAULT NULL,
  birth_date DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기존 테이블에 컬럼이 없다면 추가
DO $$
BEGIN
  -- auth_id 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN auth_id UUID;
  END IF;
END $$;

-- 인덱스 생성 (존재하면 건너뜀)
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
```

### 2.2. members 테이블 (회원 정보)

```sql
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,  -- auth.users.id를 저장 (FK 제약 없음)
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('member', 'guest')) DEFAULT 'guest',
  status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_profile_id ON members(profile_id);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_type ON members(type);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
```

### 2.3. class_types 테이블 (수업 유형)

**주의: 기존 코드가 `class_types`를 사용하므로 이 이름을 사용합니다.**

```sql
CREATE TABLE IF NOT EXISTS class_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 1,
  color VARCHAR(20) DEFAULT 'gray',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 수업 유형 추가
INSERT INTO class_types (name, max_members, color) VALUES
  ('인트로', 1, 'gray'),
  ('개인레슨', 1, 'purple'),
  ('듀엣레슨', 2, 'pink'),
  ('그룹레슨', 4, 'orange')
ON CONFLICT (name) DO NOTHING;
```

### 2.4. payment_types 테이블 (결제 유형)

```sql
CREATE TABLE IF NOT EXISTS payment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(20) DEFAULT 'gray',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 결제 유형 추가
INSERT INTO payment_types (name, color) VALUES
  ('체험수업', 'orange'),
  ('정규수업', 'blue'),
  ('강사제공', 'green'),
  ('센터제공', 'yellow')
ON CONFLICT (name) DO NOTHING;
```

### 2.5. classes 테이블 (레슨/수업)

**주의: 기존 코드가 `time` 컬럼을 사용하므로 `time` 컬럼을 포함합니다.**

```sql
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_type_id UUID REFERENCES class_types(id),
  date DATE NOT NULL,
  time TIME NOT NULL,  -- 기존 코드 호환용 (start_time과 동일한 값)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  instructor_id UUID REFERENCES profiles(id),
  payment_type_id UUID REFERENCES payment_types(id),
  status VARCHAR(20) CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_classes_date ON classes(date);
CREATE INDEX idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX idx_classes_status ON classes(status);

-- time과 start_time을 항상 동일하게 유지하는 트리거
CREATE OR REPLACE FUNCTION sync_time_columns()
RETURNS TRIGGER AS $$
BEGIN
  NEW.time = NEW.start_time;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_classes_time BEFORE INSERT OR UPDATE ON classes
FOR EACH ROW EXECUTE FUNCTION sync_time_columns();
```

### 2.6. membership_packages 테이블 (회원권)

**⚠️ 중요: class_members 테이블이 이 테이블을 참조하므로 반드시 먼저 생성해야 합니다!**

```sql
CREATE TABLE IF NOT EXISTS membership_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  payment_type_id UUID REFERENCES payment_types(id),
  total_lessons INTEGER NOT NULL DEFAULT 0,
  remaining_lessons INTEGER NOT NULL DEFAULT 0,
  used_lessons INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) CHECK (status IN ('active', 'expired', 'exhausted')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_packages_member_id ON membership_packages(member_id);
CREATE INDEX IF NOT EXISTS idx_membership_packages_status ON membership_packages(status);
```

### 2.7. class_members 테이블 (레슨 참여 회원)

**⚠️ 중요: membership_packages 테이블을 먼저 생성한 후 실행하세요!**

```sql
CREATE TABLE IF NOT EXISTS class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  membership_package_id UUID REFERENCES membership_packages(id),
  attended BOOLEAN DEFAULT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_class_members_class_id ON class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_member_id ON class_members(member_id);
```

### 2.8. instructor_members 테이블 (강사-회원 연결)

```sql
CREATE TABLE IF NOT EXISTS instructor_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instructor_id, member_id)
);

CREATE INDEX idx_instructor_members_instructor_id ON instructor_members(instructor_id);
CREATE INDEX idx_instructor_members_member_id ON instructor_members(member_id);
```

### 2.9. user_permissions 테이블 (사용자 권한)

```sql
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission_key VARCHAR(50) NOT NULL,
  granted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, permission_key)
);

CREATE INDEX idx_user_permissions_profile_id ON user_permissions(profile_id);
```

### 2.10. settlements 테이블 (정산)

```sql
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES profiles(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  lesson_type_id UUID REFERENCES class_types(id),  -- class_types 사용
  payment_type_id UUID REFERENCES payment_types(id),
  lesson_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instructor_id, year, month, lesson_type_id, payment_type_id)
);

CREATE INDEX idx_settlements_instructor_id ON settlements(instructor_id);
CREATE INDEX idx_settlements_year_month ON settlements(year, month);
```

## 3. Row Level Security (RLS) 정책 설정

### 3.1. profiles 테이블 RLS

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 관리자 확인 함수 (무한 재귀 방지)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- auth.uid()가 없으면 false
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 프로필에서 role 조회 (SECURITY DEFINER로 RLS 우회)
  SELECT role INTO user_role
  FROM profiles
  WHERE auth_id = auth.uid()
  LIMIT 1;
  
  RETURN user_role = 'admin';
END;
$$;

-- 본인 프로필 조회 가능
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth_id = auth.uid());

-- 관리자는 모든 프로필 조회 가능 (함수 사용으로 재귀 방지)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin_user());

-- 본인 프로필 INSERT 허용 (회원가입 시)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth_id = auth.uid());
```

### 3.2. members 테이블 RLS

```sql
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 본인 회원 정보 조회 가능
CREATE POLICY "Users can view own member info"
  ON members FOR SELECT
  USING (profile_id = auth.uid());

-- 강사는 담당 회원 조회 가능
CREATE POLICY "Instructors can view assigned members"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM instructor_members im
      JOIN profiles p ON p.id = im.instructor_id
      WHERE im.member_id = members.id AND p.auth_id = auth.uid()
    )
  );

-- 관리자는 모든 회원 조회 가능
CREATE POLICY "Admins can view all members"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- 본인 회원 정보 INSERT 허용 (회원가입 시)
CREATE POLICY "Users can insert own member"
  ON members FOR INSERT
  WITH CHECK (profile_id = auth.uid());
```

### 3.3. classes 테이블 RLS

```sql
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- 강사는 본인 레슨 조회 가능
CREATE POLICY "Instructors can view own classes"
  ON classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = classes.instructor_id AND auth_id = auth.uid()
    )
  );

-- 관리자는 모든 레슨 조회 가능
CREATE POLICY "Admins can view all classes"
  ON classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- 회원은 본인이 참여하는 레슨 조회 가능
CREATE POLICY "Members can view own classes"
  ON classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_members cm
      JOIN members m ON m.id = cm.member_id
      WHERE cm.class_id = classes.id AND m.profile_id = auth.uid()
    )
  );
```

### 3.4. 나머지 테이블 RLS (전체 SQL)

아래 SQL을 그대로 복사-붙여넣기 하세요. 중복 실행해도 안전합니다.

```sql
-- 1) RLS 활성화
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_types ENABLE ROW LEVEL SECURITY;

-- 2) 관리자 전체 조회 허용
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='class_members' AND policyname='admin read class_members'
  ) THEN
    CREATE POLICY "admin read class_members" ON class_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles p WHERE p.auth_id = auth.uid() AND p.role = 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='membership_packages' AND policyname='admin read membership_packages'
  ) THEN
    CREATE POLICY "admin read membership_packages" ON membership_packages FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles p WHERE p.auth_id = auth.uid() AND p.role = 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='instructor_members' AND policyname='admin read instructor_members'
  ) THEN
    CREATE POLICY "admin read instructor_members" ON instructor_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles p WHERE p.auth_id = auth.uid() AND p.role = 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_permissions' AND policyname='admin read user_permissions'
  ) THEN
    CREATE POLICY "admin read user_permissions" ON user_permissions FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles p WHERE p.auth_id = auth.uid() AND p.role = 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='settlements' AND policyname='admin read settlements'
  ) THEN
    CREATE POLICY "admin read settlements" ON settlements FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles p WHERE p.auth_id = auth.uid() AND p.role = 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_types' AND policyname='public read payment_types'
  ) THEN
    CREATE POLICY "public read payment_types" ON payment_types FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='class_types' AND policyname='public read class_types'
  ) THEN
    CREATE POLICY "public read class_types" ON class_types FOR SELECT USING (true);
  END IF;
END$$;

-- 3) 강사/회원 자기 데이터 조회 허용

-- 강사: 본인이 담당/진행한 수업의 class_members만
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='class_members' AND policyname='instructor read own class_members'
  ) THEN
    CREATE POLICY "instructor read own class_members" ON class_members FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM classes c
        JOIN profiles pi ON pi.id = c.instructor_id
        WHERE c.id = class_members.class_id AND pi.auth_id = auth.uid()
      )
    );
  END IF;
END$$;

-- 회원: 본인 class_members / membership_packages만
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='class_members' AND policyname='member read own class_members'
  ) THEN
    CREATE POLICY "member read own class_members" ON class_members FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM members m
        WHERE m.id = class_members.member_id AND m.profile_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='membership_packages' AND policyname='member read own membership_packages'
  ) THEN
    CREATE POLICY "member read own membership_packages" ON membership_packages FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM members m
        WHERE m.id = membership_packages.member_id AND m.profile_id = auth.uid()
      )
    );
  END IF;
END$$;

-- (선택) 강사: 본인 settlements만
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='settlements' AND policyname='instructor read own settlements'
  ) THEN
    CREATE POLICY "instructor read own settlements" ON settlements FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM profiles pi
        WHERE pi.id = settlements.instructor_id AND pi.auth_id = auth.uid()
      )
    );
  END IF;
END$$;
```

## 4. 함수 및 트리거

### 4.1. 회원권 차감 함수

```sql
CREATE OR REPLACE FUNCTION deduct_membership_lesson(
  p_membership_package_id UUID,
  p_class_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE membership_packages
  SET 
    remaining_lessons = remaining_lessons - 1,
    used_lessons = used_lessons + 1,
    updated_at = NOW()
  WHERE 
    id = p_membership_package_id
    AND remaining_lessons > 0;
  
  RETURN FOUND;
END;
$$;
```

### 4.2. updated_at 자동 업데이트 트리거

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 트리거 적용 (중복 실행 시 에러 방지를 위해 DROP IF EXISTS 사용)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_class_types_updated_at ON class_types;
CREATE TRIGGER update_class_types_updated_at BEFORE UPDATE ON class_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_types_updated_at ON payment_types;
CREATE TRIGGER update_payment_types_updated_at BEFORE UPDATE ON payment_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_class_members_updated_at ON class_members;
CREATE TRIGGER update_class_members_updated_at BEFORE UPDATE ON class_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_membership_packages_updated_at ON membership_packages;
CREATE TRIGGER update_membership_packages_updated_at BEFORE UPDATE ON membership_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;
CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 5. 초기 관리자 계정 생성

Supabase Auth에서 관리자 계정을 먼저 생성하고, profiles 테이블에 role을 'admin'으로 설정하세요:

```sql
-- 관리자 프로필 업데이트 (auth.users 테이블의 id로 연결)
UPDATE profiles
SET role = 'admin'
WHERE phone = '관리자전화번호';
```

또는 Supabase 대시보드에서 직접 수정할 수 있습니다.

## 6. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 7. 테스트 계정 생성

1. `/signup` 페이지에서 회원가입
2. Supabase 대시보드에서 해당 계정의 role을 'member' 또는 'instructor'로 설정
3. 로그인 후 해당 역할의 페이지 접근 가능

## 참고사항

- 현재 수업 유형과 결제 유형은 로컬 스토리지(`lib/utils/lesson-types.ts`)로도 관리됩니다.
- Admin Settings 모달에서 동적으로 추가/수정 가능합니다.
- 데이터베이스와 로컬 스토리지 중 어느 것을 우선할지 결정해야 합니다.

