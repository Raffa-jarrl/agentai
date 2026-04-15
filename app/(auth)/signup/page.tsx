"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signupAction } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "יוצר חשבון…" : "הרשמה"}
    </Button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signupAction, { error: "" } as { error: string });

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">פתיחת חשבון</CardTitle>
        <CardDescription>התחל לנהל את הלידים שלך בצורה חכמה</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">שם מלא</Label>
            <Input id="full_name" name="full_name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_name">שם העסק (אופציונלי)</Label>
            <Input id="business_name" name="business_name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">טלפון</Label>
            <Input id="phone" name="phone" type="tel" required dir="ltr" className="text-right" placeholder="050-123-4567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input id="email" name="email" type="email" required dir="ltr" className="text-right" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Submit />
        </form>
        <p className="mt-4 text-sm text-center text-muted-foreground">
          כבר יש לך חשבון? <Link href="/login" className="text-brand hover:underline">התחבר</Link>
        </p>
      </CardContent>
    </Card>
  );
}
