'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type Profile = {
  phone: string;
  name: string;
  role: 'admin' | 'instructor' | 'member';
  birth_date?: string;
  gender?: string;
};

type UserPermissions = {
  menu_dashboard: boolean;
  menu_attendance: boolean;
  menu_members: boolean;
  menu_classes: boolean;
  menu_settlements: boolean;
  menu_settings: boolean;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  permissions: UserPermissions | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  permissions: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadUserData = async (currentUser: User) => {
    try {
      console.log('=== 프로필 로딩 시작 ===')
      console.log('User ID:', currentUser.id)
      console.log('User Email:', currentUser.email)

      console.log('🔵 쿠키에서 토큰 가져오는 중...')
      
      // 프로젝트 ID를 환경변수에서 추출
      const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]
      
      console.log('🔵 프로젝트 ID:', projectId)
      
      // 쿠키에서 직접 세션 토큰 가져오기
      const cookies = document.cookie.split('; ')
      const authCookie = cookies.find(c => c.startsWith(`sb-${projectId}-auth-token=`))
      
      console.log('🔵 authCookie:', authCookie ? '있음' : '없음')
      
      if (!authCookie) {
        console.error('❌ 인증 쿠키 없음')
        setLoading(false)
        return
      }

      // 쿠키 값 파싱
      let cookieValue = decodeURIComponent(authCookie.split('=')[1])
      
      // base64로 시작하면 디코딩
      if (cookieValue.startsWith('base64-')) {
        cookieValue = atob(cookieValue.substring(7))
      }
      
      console.log('🔵 cookieValue 길이:', cookieValue.length)
      
      const sessionData = JSON.parse(cookieValue)
      const accessToken = sessionData.access_token
      
      console.log('🔵 액세스 토큰:', accessToken ? '있음' : '없음')

      if (!accessToken) {
        console.error('❌ 액세스 토큰 없음')
        setLoading(false)
        return
      }

      console.log('🔵 프로필 조회 시작 (fetch 사용)...')

      // fetch로 직접 조회
      const profileResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?auth_id=eq.${currentUser.id}&select=*`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      const profiles = await profileResponse.json()
      const profileData = profiles[0]

      console.log('프로필 조회 결과:', profileData)

      if (!profileData) {
        console.error('❌ 프로필 없음')
        setLoading(false)
        return
      }

      console.log('✅ 프로필 로드 성공!')
      setProfile(profileData)

      // 권한 조회
      const permResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_permissions?user_phone=eq.${profileData.phone}&select=*`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      const permsArray = await permResponse.json()
      const permissionsData = permsArray[0]

      console.log('권한 로드:', permissionsData)

      setPermissions(permissionsData || {
        menu_dashboard: true,
        menu_attendance: true,
        menu_members: true,
        menu_classes: true,
        menu_settlements: true,
        menu_settings: true,
      })
    } catch (error) {
      console.error('❌ loadUserData 전체 오류:', error)
    } finally {
      console.log('=== 프로필 로딩 완료 ===')
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadUserData(user);
    }
  };

  useEffect(() => {
    // 초기 사용자 확인
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log('초기 사용자:', user)
      setUser(user);
      if (user) {
        loadUserData(user);
      } else {
        setLoading(false);
      }
    });

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth 상태 변경:', event)
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await loadUserData(currentUser);
        } else {
          setProfile(null);
          setPermissions(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setPermissions(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        permissions,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};