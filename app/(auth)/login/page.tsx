"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "מתחבר…" : "התחברות"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, { error: "" } as { error: string });

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">ברוך הבא ל-AgentAI</CardTitle>
        <CardDescription>היכנס לחשבון הסוכן שלך</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" dir="ltr" className="text-right" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Submit />
        </form>
        <p className="mt-4 text-sm text-center text-muted-foreground">
          אין לך חשבון? <Link href="/signup" className="text-brand hover:underline">הירשם</Link>
        </p>
      </CardContent>
    </Card>
  );
}
