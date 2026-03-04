"use client";

import { useState } from "react";
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
import { ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("パスワードが一致しません");
      return;
    }

    if (password.length < 6) {
      toast.error("パスワードは6文字以上にしてください");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error("パスワードの更新に失敗しました", {
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    toast.success("パスワードを更新しました");
    router.replace("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-background to-secondary/50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">現調報告</h1>
            <p className="text-xs text-muted-foreground">NEXT株式会社</p>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">新しいパスワードを設定</CardTitle>
            <CardDescription>
              新しいパスワードを入力してください
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">新しいパスワード</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="6文字以上のパスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="もう一度入力してください"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                  className="h-11"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                パスワードを更新
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
