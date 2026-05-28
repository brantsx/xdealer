import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { Field, TextInput } from "../components/ui/Field";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp, demoMode } = useAuth();
  const { pushToast } = useToast();
  const [fullName, setFullName] = useState("Sophie Carter");
  const [organisationName, setOrganisationName] = useState("Northgate Vehicle Trading");
  const [email, setEmail] = useState("demo@xdealer.local");
  const [password, setPassword] = useState("demo-password");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (fullName.trim().length < 2 || !email.includes("@") || password.length < 6) {
      setError("Enter your name, a valid email address and a password of at least six characters.");
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, fullName, organisationName);
      pushToast({
        tone: "success",
        title: demoMode ? "Demo workspace ready" : "Workspace created",
        message: "You can now review the Xdealer MVP.",
      });
      navigate("/app/dashboard");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to create the workspace.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-3 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-signal-500 text-sm font-black">X</span>
          <span className="text-xl font-semibold">Xdealer</span>
        </Link>
        <Card>
          <CardBody>
            <h1 className="text-xl font-semibold text-slate-950">Create workspace</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start in mock mode, then connect Supabase auth, database, storage and edge functions.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <Field label="Full name">
                <TextInput value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
              </Field>
              <Field label="Organisation">
                <TextInput value={organisationName} onChange={(event) => setOrganisationName(event.target.value)} />
              </Field>
              <Field label="Email address">
                <TextInput value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              </Field>
              <Field label="Password">
                <TextInput
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </Field>
              {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating..." : "Create workspace"}
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-slate-600">
              Already set up?{" "}
              <Link to="/login" className="font-semibold text-signal-600 hover:text-signal-700">
                Log in
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
