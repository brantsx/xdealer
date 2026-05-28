import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { Field, TextInput } from "../components/ui/Field";
import { Logo } from "../components/ui/Logo";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, demoMode } = useAuth();
  const { pushToast } = useToast();
  const [email, setEmail] = useState("demo@xdealer.local");
  const [password, setPassword] = useState("demo-password");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email address and a password of at least six characters.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
      pushToast({ tone: "success", title: "Signed in", message: demoMode ? "Demo workspace loaded." : "Supabase session active." });
      navigate("/app/dashboard");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to sign in.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo to="/" tone="dark" />
        </div>
        <Card>
          <CardBody>
            <h1 className="text-xl font-semibold text-slate-950">Log in</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Access the demo trading workspace or connect Supabase credentials for a real tenant.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <Field label="Email address">
                <TextInput value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              </Field>
              <Field label="Password">
                <TextInput
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </Field>
              {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in..." : "Log in"}
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-slate-600">
              Need a workspace?{" "}
              <Link to="/signup" className="font-semibold text-signal-600 hover:text-signal-700">
                Create one
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
