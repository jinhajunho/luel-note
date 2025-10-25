'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types';

// ============================================
// Props 타입
// ============================================

interface HeaderProps {
  profile: Profile;
}

// ============================================
// Header 컴포넌트
// ============================================

export default function Header({ profile }: HeaderProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [adminMode, setAdminMode] = useState<'admin' | 'instructor'>('admin');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 관리자/강사 모드 전환
  const toggleAdminMode = () => {
    const newMode = adminMode === 'admin' ? 'instructor' : 'admin';
    setAdminMode(newMode);
    // TODO: 실제 모드 전환 로직 (context, localStorage 등)
    // TODO: 페이지 리다이렉트
    if (newMode === 'admin') {
      router.push('/admin/schedule');
    } else {
      router.push('/instructor/schedule');
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      // TODO: Supabase 로그아웃
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  // 역할 텍스트
  const getRoleText = () => {
    if (profile.role === 'admin') return '관리자';
    if (profile.role === 'instructor') return '강사';
    return '회원';
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 mx-auto max-w-7xl">
        
        {/* ============================================ */}
        {/* 로고 */}
        {/* ============================================ */}
        <Link href="/" className="flex items-center">
          {/* 모바일: 왕관 아이콘만 */}
          <div className="block md:hidden">
            <Image
              src="/logo-luel.svg"
              alt="Luel Note"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </div>
          
          {/* 데스크톱: 텍스트 로고 */}
          <div className="hidden md:block">
            <Image
              src="/mark-luel.svg"
              alt="Luel Note"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
          </div>
        </Link>

        {/* ============================================ */}
        {/* 우측: 관리자전환 + 알림 + 프로필 */}
        {/* ============================================ */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* 관리자 전환 버튼 (관리자 권한만 표시, 모드와 관계없이 항상 표시) */}
          {profile.role === 'admin' && (
            <button
              onClick={toggleAdminMode}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title={`현재 ${adminMode === 'admin' ? '관리자' : '강사'} 모드`}
            >
              {adminMode === 'admin' ? '관리자' : '강사'}
            </button>
          )}

          {/* 알림 아이콘 */}
          <button
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="알림"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* 알림 뱃지 (옵션) */}
            {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
          </button>

          {/* 프로필 드롭다운 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="프로필 메뉴"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <svg
                className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 드롭다운 메뉴 */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                {/* 사용자 정보 */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{getRoleText()}</p>
                </div>

                {/* 메뉴 */}
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowDropdown(false)}
                >
                  프로필 설정
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
