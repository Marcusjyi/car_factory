import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-text-secondary">
          로그인 화면을 불러오는 중...
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
