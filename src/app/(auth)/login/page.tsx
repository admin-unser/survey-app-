"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClipboardCheck, Loader2, Wind, Shield, Zap } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("ログインに失敗しました", {
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    toast.success("ログインしました");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      {/* Left: Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">現調報告</h1>
              <p className="text-xs text-muted-foreground">NEXT株式会社</p>
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">ログイン</CardTitle>
              <CardDescription>
                メールアドレスとパスワードを入力してください
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="パスワードを入力"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  ログイン
                </Button>
                <p className="text-sm text-muted-foreground">
                  アカウントをお持ちでない方は{" "}
                  <Link
                    href="/signup"
                    className="font-medium text-primary hover:underline"
                  >
                    サインアップ
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      {/* Right: Brand Panel */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:items-center lg:justify-center bg-gradient-to-br from-primary via-primary/90 to-accent p-12 text-primary-foreground">
        <div className="max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight">
              エアコンの現場調査を、
              <br />
              もっと簡単に。
            </h2>
            <p className="mt-4 text-primary-foreground/80 leading-relaxed">
              現場スタッフの調査入力から管理者の報告書発行まで、
              エアコン施工に必要な現場調査のすべてをこの1つのアプリで完結できます。
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                <Wind className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">スマホで簡単入力</h3>
                <p className="text-sm text-primary-foreground/70">
                  現場で片手操作、ステップ形式で迷わず調査データを記録
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">報告書を自動生成</h3>
                <p className="text-sm text-primary-foreground/70">
                  入力したデータからPDF報告書をワンクリックで発行
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">案件を一元管理</h3>
                <p className="text-sm text-primary-foreground/70">
                  カレンダー、地図、一覧表示で進捗を素早く把握
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-primary-foreground/20 pt-6">
            <p className="text-sm text-primary-foreground/60">
              NEXT株式会社 - 快適な空間づくりに必要な空調設備で、
              皆さまの生活を支えます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
