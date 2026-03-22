import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { LoginToast } from "./login-toast";

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    reason?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = await searchParams;

  // Redirect authenticated users away from login
  if (session?.user) {
    redirect(params.callbackUrl || "/dashboard");
  }

  return (
    <div style={{
      width: "100%",
      maxWidth: "400px",
      padding: "2rem",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
          SileTravel
        </h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>
          SOHA Travel
        </p>
      </div>

      <LoginToast reason={params.reason} />
      <LoginForm
        callbackUrl={params.callbackUrl || "/dashboard"}
        error={params.error}
      />
    </div>
  );
}
