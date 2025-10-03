import Image from "next/image";

import { LoginForm } from "../../_components/login-form";

export default function LoginV1() {
  return (
    <div className="flex h-dvh">
      <div className="bg-primary hidden lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <Image
            src="/4-PAWS-Petcare.webp"
            alt="4Paws Pet Care"
            width={180}
            height={180}
            className="mx-auto"
            priority
            quality={85}
          />
        </div>
      </div>

      <div className="bg-background flex w-full items-center justify-center p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">Masuk</div>
            <div className="text-muted-foreground mx-auto max-w-xl">
              Silakan masukkan nama pengguna dan kata sandi Anda.
            </div>
          </div>
          <div className="space-y-4">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
