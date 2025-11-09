This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 관리자 권한 부여

AWS Cognito에서는 역할 정보를 관리하지 않으므로, 최초 관리자 계정은 데이터베이스에서 직접 승격해야 합니다.  
프로젝트 루트(`E:\dev\luel-note`)에서 다음 명령으로 역할을 설정할 수 있습니다.

```bash
# 의존성 설치 (최초 1회)
npm install

# 전화번호 01012345678 사용자를 관리자(admin)로 승격
npm run set-role 01012345678 admin

# 역할은 member, instructor, admin 중 하나를 지정할 수 있습니다.
```

명령이 성공하면 사용자 권한과 연결된 메뉴 권한이 함께 업데이트됩니다.  
이후에는 관리자 계정으로 로그인하여 앱 내 "관리자 설정" 모달에서 다른 사용자 권한을 변경할 수 있습니다.
